import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { createUpload } from "../controllers/uploadController.js";

const router = express.Router();

router.post("/", requireAuth, requireRole("admin", "vendor"), createUpload);

export default router;
