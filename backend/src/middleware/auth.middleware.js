import jwt from "jsonwebtoken";
import { Session, User } from "../models/index.js";

const authMiddleware = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      return res.status(401).json({ message: "Access token required" });
    }

    let decoded;
    try {
      decoded = jwt.verify(accessToken, process.env.ACCESS_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired access token" });
    }

    const session = await Session.findOne({ where: { jti: decoded.jti } });
    if (!session) {
      return res.status(401).json({ message: "Session expired or logged out" });
    }

    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    req.sessionJti = decoded.jti;
    next();
  } catch (error) {
    next(error);
  }
};

export default authMiddleware;