import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  getCategories, createCategory, getCategory, updateCategory, deleteCategory
} from "../controllers/categoryController.js";

const router = express.Router();

router.get("/", getCategories);
router.post("/", requireAuth, requireRole("admin"), createCategory);
router.get("/:slug", getCategory);
router.put("/:slug", requireAuth, requireRole("admin"), updateCategory);
router.delete("/:slug", requireAuth, requireRole("admin"), deleteCategory);

export default router;
