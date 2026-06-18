import { Router } from "express";
import authRoutes from "./auth.routes.js";
import productRoutes from "./product.routes.js";
import cartRoutes from "./cart.routes.js";
import wishlistRoutes from "./wishlist.routes.js";
import orderRoutes from "./order.routes.js";
import adminRoutes from "./admin.routes.js";
import bannerRoutes from "./banner.routes.js";
import uploadRoutes from "./upload.routes.js";
import chatRoutes from "./chat.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/cart", cartRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/orders", orderRoutes);
router.use("/admin", adminRoutes);
router.use("/banners",bannerRoutes);
router.use("/upload", uploadRoutes);
router.use("/chat",chatRoutes);

export default router;
