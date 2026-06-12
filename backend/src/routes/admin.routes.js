import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middleware.js";
import { cancelOrder, getOrders, getUsers,updateOrder } from "../controllers/admin.controller.js";

const router=Router();
router.use(authMiddleware);
router.use(roleMiddleware(["admin"]));

router.get("/orders",getOrders);
router.get("/users",getUsers);
router.put("/orders/:id",updateOrder);
router.put("/orders/:id",cancelOrder);

export default router;