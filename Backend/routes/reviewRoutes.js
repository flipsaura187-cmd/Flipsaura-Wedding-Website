import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { getReviews, createReview } from "../controllers/reviewController.js";

const router = express.Router();

router.get("/", getReviews);
router.post("/", requireAuth, createReview);

export default router;
