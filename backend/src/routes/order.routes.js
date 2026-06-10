import { Router } from "express";
import { create, getMyOrders, getOrderDetails } from "../controllers/order.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", authMiddleware, create);
router.get("/", authMiddleware, getMyOrders);
router.get("/:id", authMiddleware, getOrderDetails);

export default router;
