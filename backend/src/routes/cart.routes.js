import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware";
import { addToCart, removeFromCart, updateQuantity, viewCart } from "../controllers/cart.controller";

const router=Router();

router.get("/", authMiddleware,viewCart);
router.post("/", authMiddleware, addToCart);
router.put("/:productId", authMiddleware,updateQuantity);
router.delete("/:productId", authMiddleware,removeFromCart);

export default router;