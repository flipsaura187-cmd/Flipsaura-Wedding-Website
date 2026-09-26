import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  getAdminStats, getUsers, updateUser, getAdminBlogs
} from "../controllers/adminController.js";

const router = express.Router();
const adminOnly = [requireAuth, requireRole("admin")];

router.get("/stats", ...adminOnly, getAdminStats);
router.get("/users", ...adminOnly, getUsers);
router.put("/users", ...adminOnly, updateUser);
router.get("/blogs", ...adminOnly, getAdminBlogs);

export default router;
