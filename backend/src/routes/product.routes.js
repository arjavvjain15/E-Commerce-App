import { Router } from "express";
import { getAll, getById, create, update, remove, download } from "../controllers/product.controller.js";
import { add as addReview, getByProduct as getProductReviews } from "../controllers/review.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middleware.js";

const router = Router();

router.get("/", getAll);
router.get("/:id", getById);

router.get("/:id/download", download);

router.get("/:productId/reviews", getProductReviews);
router.post("/:productId/reviews", authMiddleware, addReview);

router.post("/", authMiddleware, roleMiddleware(["admin"]), create);
router.put("/:id", authMiddleware, roleMiddleware(["admin"]), update);
router.delete("/:id", authMiddleware, roleMiddleware(["admin"]), remove);


export default router;

