import { Router } from "express";
import { createBanner, deleteBanner, getAllBanners, updateBanner } from "../services/banner.services";
import authMiddleware from "../middleware/auth.middleware";
import roleMiddleware from "../middleware/role.middleware";
const router=Router();

router.get("/",getAllBanners);
router.post("/",authMiddleware,roleMiddleware["admin"],createBanner);
router.put("/:id",authMiddleware,roleMiddleware["admin"],updateBanner);
router.delete("/:id",authMiddleware,roleMiddleware["admin"],deleteBanner);

export default router;