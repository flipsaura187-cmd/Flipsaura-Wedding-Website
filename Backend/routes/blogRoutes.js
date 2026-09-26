import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  getBlogs, createBlog, getBlog, updateBlog, deleteBlog
} from "../controllers/blogController.js";

const router = express.Router();

router.get("/", getBlogs);
router.post("/", requireAuth, requireRole("admin"), createBlog);
router.get("/:slug", getBlog);
router.put("/:slug", requireAuth, requireRole("admin"), updateBlog);
router.delete("/:slug", requireAuth, requireRole("admin"), deleteBlog);

export default router;
