import { Router } from "express";
import roleMiddleware from "../middleware/role.middleware.js";
import { uploadImage } from "../controllers/upload.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/",authMiddleware,roleMiddleware([("admin")]),upload.single("image"),uploadImage);

export default router;
