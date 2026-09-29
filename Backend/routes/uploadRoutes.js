import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { createUpload, directUpload } from "../controllers/uploadController.js";

const router = express.Router();

router.post("/", requireAuth, requireRole("admin", "vendor"), createUpload);
router.post("/direct", requireAuth, requireRole("admin", "vendor"), directUpload);

export default router;
