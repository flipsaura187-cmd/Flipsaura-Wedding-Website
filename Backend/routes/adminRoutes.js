import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  getAdminStats,
  getUsers,
  updateUser,
  getAdminBlogs,
  getAdminVendors,
  getAdminVendorDetail,
  reviewAdminVendorDocument,
  reviewAdminVendorBank,
  updateAdminVendorStatus,
} from "../controllers/adminController.js";

import {
  getAdminHotels,
  getAdminHotelDetail,
  createAdminHotel,
  updateAdminHotel,
  deleteAdminHotel,
} from "../controllers/adminHotelController.js";

const router = express.Router();
const adminOnly = [requireAuth, requireRole("admin")];

// General Admin Routes
router.get("/stats", ...adminOnly, getAdminStats);
router.get("/users", ...adminOnly, getUsers);
router.put("/users", ...adminOnly, updateUser);
router.get("/blogs", ...adminOnly, getAdminBlogs);

// Vendor Management Routes
router.get("/vendors", ...adminOnly, getAdminVendors);
router.get("/vendors/:id", ...adminOnly, getAdminVendorDetail);
router.put("/vendors/:id/documents/:docType", ...adminOnly, reviewAdminVendorDocument);
router.put("/vendors/:id/bank-details", ...adminOnly, reviewAdminVendorBank);
router.put("/vendors/:id/status", ...adminOnly, updateAdminVendorStatus);

// Hotel & Room Management Routes
router.get("/hotels", ...adminOnly, getAdminHotels);
router.get("/hotels/:id", ...adminOnly, getAdminHotelDetail);
router.post("/hotels", ...adminOnly, createAdminHotel);
router.put("/hotels/:id", ...adminOnly, updateAdminHotel);
router.delete("/hotels/:id", ...adminOnly, deleteAdminHotel);

export default router;
