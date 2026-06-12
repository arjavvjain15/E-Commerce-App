import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { addToWishlist, removeFromWishlist, viewWishlist } from "../controllers/wishlist.controller.js";

const router=Router();

router.get("/", authMiddleware, viewWishlist);
router.post("/", authMiddleware,addToWishlist);
router.delete("/:productId", authMiddleware, removeFromWishlist);

export default router;