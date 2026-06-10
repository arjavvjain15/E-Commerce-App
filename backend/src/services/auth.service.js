import { User, Cart, Wishlist, Session } from "../models/index.js";

export const registerUser = async ({ name, email, password, role }) => {
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    const error = new Error("User already exists");
    error.status = 400;
    throw error;
  }

  const user = await User.create({
    name,
    email,
    password,
    provider: "local",
    role: role || "user",
  });

  await Cart.create({ userId: user.id });
  await Wishlist.create({ userId: user.id });

  return user;
};

export const logoutUser=async(decoded)=>{

  if(decoded?.jti){
    await Session.deleteOne({jti: decoded.jti});
  }
  return true;
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    const error = new Error("User does not exist");
    error.status = 404;
    throw error;
  }

  if (user.provider !== "local") {
    const error = new Error("Please log in using your Google account");
    error.status = 400;
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error("Invalid password");
    error.status = 401;
    throw error;
  }

  return user;
};

export const findOrCreateGoogleUser = async ({ googleId, name, email }) => {
  let user = await User.findOne({ where: { googleId } });
  if (!user) {
    user = await User.findOne({ where: { email } });
    if (user) {
      user.googleId = googleId;
      user.provider = "google";
      await user.save();
    } else {
      user = await User.create({
        name,
        email,
        googleId,
        provider: "google",
        role: "user",
      });
      await Cart.create({ userId: user.id });
      await Wishlist.create({ userId: user.id });
    }
  }
  return user;
};

export const createSession = async ({ userId, jti, refreshToken, expiresAt }) => {
  return await Session.create({
    userId,
    jti,
    refreshToken,
    expiresAt,
  });
};

export const deleteSessionByJti = async (jti) => {
  return await Session.destroy({ where: { jti } });
};

export const findSessionByRefreshToken = async (refreshToken) => {
  return await Session.findOne({ where: { refreshToken } });
};

export const updateSessionJti = async (session, newJti) => {
  session.jti = newJti;
  await session.save();
};