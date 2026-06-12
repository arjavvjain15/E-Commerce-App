import { Router } from "express";

import authMiddleware from "../middleware/auth.middleware.js";
import { googleOAuth, googleOAuthCallback, login, logout, me, refresh, register } from "../controllers/auth.controller.js";

const router=Router();

router.post("/login",login);
router.post("/register",register);
router.post("/refresh",refresh);
router.post("/logout",logout);
router.get("/googleOAuth",googleOAuth);
router.get("/googleOAuthCallBack",googleOAuthCallback);
router.get("/me",authMiddleware,me);

export default router;
