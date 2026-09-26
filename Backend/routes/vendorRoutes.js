import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { getVendorStats } from "../controllers/adminController.js";

const router = express.Router();

router.get("/stats", requireAuth, requireRole("vendor", "admin"), getVendorStats);

export default router;
