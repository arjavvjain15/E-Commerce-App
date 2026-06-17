import { Router } from "express";
import roleMiddleware from "../middleware/role.middleware.js";
import { 
  uploadImage, 
  startMultipart, 
  uploadPartHandler, 
  completeMultipart, 
  abortMultipart 
} from "../controllers/upload.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", authMiddleware, roleMiddleware(["admin"]), upload.single("image"), uploadImage);

router.post("/multipart/start", authMiddleware, roleMiddleware(["admin"]), startMultipart);
router.post("/multipart/part", authMiddleware, roleMiddleware(["admin"]), upload.single("chunk"), uploadPartHandler);
router.post("/multipart/complete", authMiddleware, roleMiddleware(["admin"]), completeMultipart);
router.delete("/multipart/abort", authMiddleware, roleMiddleware(["admin"]), abortMultipart);

export default router;
