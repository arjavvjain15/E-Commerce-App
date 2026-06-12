import { Router } from "express";
import { getAll, create, update, remove } from "../controllers/banner.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middleware.js";
const router=Router();

router.get("/",getAll);
router.post("/",authMiddleware,roleMiddleware(["admin"]),create);
router.put("/:id",authMiddleware,roleMiddleware(["admin"]),update);
router.delete("/:id",authMiddleware,roleMiddleware(["admin"]),remove);

export default router;