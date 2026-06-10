import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware";
import { addToWishlist, removeFromWishlist, viewWishlist } from "../controllers/wishlist.controller";

const router=Router();

router.get("/", authMiddleware, viewWishlist);
router.post("/", authMiddleware,addToWishlist);
router.delete("/:productId", authMiddleware, removeFromWishlist);

export default router;