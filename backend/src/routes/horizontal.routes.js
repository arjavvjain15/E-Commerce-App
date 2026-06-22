import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middleware.js";
import { getAll, create, update, remove } from "../controllers/horizontal.controller.js";

const router=Router();

router.get("/",getAll);
router.post("/",authMiddleware,roleMiddleware(["admin"]),create);
router.put("/:id",authMiddleware,roleMiddleware(["admin"]),update);
router.delete("/:id",authMiddleware,roleMiddleware(["admin"]),remove);

export default router;
