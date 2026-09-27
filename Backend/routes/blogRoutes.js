import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  getBlogs,
  createBlog,
  getBlog,
  updateBlog,
  deleteBlog,
  publishBlog,
  unpublishBlog,
  getAdminBlogs,
} from "../controllers/blogController.js";

const router = express.Router();
const adminOnly = [requireAuth, requireRole("admin")];

// Public endpoints
router.get("/", getBlogs);
router.get("/:slug", getBlog);

// Admin-only endpoints
router.get("/admin/all", ...adminOnly, getAdminBlogs);
router.post("/", ...adminOnly, createBlog);
router.put("/:idOrSlug", ...adminOnly, updateBlog);
router.delete("/:idOrSlug", ...adminOnly, deleteBlog);
router.patch("/:idOrSlug/publish", ...adminOnly, publishBlog);
router.patch("/:idOrSlug/unpublish", ...adminOnly, unpublishBlog);

export default router;
