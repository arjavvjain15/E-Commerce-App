import jwt from "jsonwebtoken";
import {registerUser,loginUser,findOrCreateGoogleUser,createSession,deleteSessionByJti,findSessionByRefreshToken,updateSessionJti,} from "../services/auth.service.js";
import generateAccessToken from "../utils/generateAccessToken.js";
import generateRefreshToken from "../utils/generateRefreshToken.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const user = await registerUser({ name, email, password, role });
    res.status(201).json({
      message: "Registration successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await loginUser({ email, password });

    const { token: accessToken, jti } = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await createSession({
      userId: user.id,
      jti,
      refreshToken,
      expiresAt,
    });

    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, 
    });

    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, 
    });

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const googleOAuth = (req, res) => {
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const options = {
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    client_id: process.env.GOOGLE_CLIENT_ID,
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
  };

  const queryString = new URLSearchParams(options).toString();
  res.redirect(`${rootUrl}?${queryString}`);
};

export const googleOAuthCallback = async (req, res, next) => {
  try {
    const code = req.query.code;
    if (!code) {
      return res.status(400).json({ message: "Authorization code not provided" });
    }

    const tokenUrl = "https://oauth2.googleapis.com/token";
    const tokenBody = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    };

    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(tokenBody).toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Google token exchange failed: ${errorText}`);
    }

    const { access_token } = await tokenResponse.json();

    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      throw new Error("Failed to fetch user profile from Google");
    }

    const googleUser = await userInfoResponse.json();

    const user = await findOrCreateGoogleUser({
      googleId: googleUser.sub,
      name: googleUser.name,
      email: googleUser.email,
    });

    const { token: accessToken, jti } = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await createSession({
      userId: user.id,
      jti,
      refreshToken,
      expiresAt,
    });

    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect("http://localhost:5173");
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required" });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired refresh token" });
    }

    const session = await findSessionByRefreshToken(refreshToken);
    if (!session) {
      return res.status(401).json({ message: "Active session not found" });
    }

    // Verify session expiry in DB
    if (new Date() > new Date(session.expiresAt)) {
      await deleteSessionByJti(session.jti);
      return res.status(401).json({ message: "Session expired" });
    }

    // Generate new Access Token with new JTI
    const { token: newAccessToken, jti: newJti } = generateAccessToken(
      decoded.userId,
      session.role 
    );

    const userSession = await session.getUser();
    if (!userSession) {
      return res.status(401).json({ message: "User not found" });
    }

    const { token: accessToken, jti } = generateAccessToken(userSession.id, userSession.role);

    await updateSessionJti(session, jti);

    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    res.status(200).json({ message: "Token refreshed successfully" });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;
    if (accessToken) {
      const decoded = jwt.decode(accessToken);
      if (decoded && decoded.jti) {
        await deleteSessionByJti(decoded.jti);
      }
    }

    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    res.status(200).json({ user: req.user });
  } catch (error) {
    next(error);
  }
};
