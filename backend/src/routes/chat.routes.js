import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { handleChat } from "../controllers/chat.controller.js";

const router= Router();

router.post("/",authMiddleware,handleChat);

export default router;