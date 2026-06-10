import { Router } from "express";
import { login,register,me,googleOAuth,googleOAuthCallback,refresh,logout} from "../controllers/auth.controller";
import authMiddleware from "../middleware/auth.middleware";

const router=Router();

router.post("/login",login);
router.post("/register",register);
router.post("/refresh",refresh);
router.post("/logout",logout);
router.get("/googleOAuth",googleOAuth);
router.get("/googleOAuthCallBack",googleOAuthCallback);
router.get("/me",authMiddleware,me);

export default router;
