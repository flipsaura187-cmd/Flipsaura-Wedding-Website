import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  getAdminStats,
  getUsers,
  updateUser,
  deleteUser,
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

import {
  getAdminVenues,
  getAdminVenueDetail,
  createAdminVenue,
  updateAdminVenue,
  deleteAdminVenue,
} from "../controllers/adminVenueController.js";

import {
  getAdminPhotographies,
  getAdminPhotographyDetail,
  createAdminPhotography,
  updateAdminPhotography,
  deleteAdminPhotography,
} from "../controllers/adminPhotographyController.js";

const router = express.Router();
const adminOnly = [requireAuth, requireRole("admin")];

// General Admin Routes
router.get("/stats", ...adminOnly, getAdminStats);
router.get("/users", ...adminOnly, getUsers);
router.put("/users", ...adminOnly, updateUser);
router.delete("/users/:id", ...adminOnly, deleteUser);
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

// Venue Management Routes
router.get("/venues", ...adminOnly, getAdminVenues);
router.get("/venues/:id", ...adminOnly, getAdminVenueDetail);
router.post("/venues", ...adminOnly, createAdminVenue);
router.put("/venues/:id", ...adminOnly, updateAdminVenue);
router.delete("/venues/:id", ...adminOnly, deleteAdminVenue);

// Photography Management Routes
router.get("/photography", ...adminOnly, getAdminPhotographies);
router.get("/photography/:id", ...adminOnly, getAdminPhotographyDetail);
router.post("/photography", ...adminOnly, createAdminPhotography);
router.put("/photography/:id", ...adminOnly, updateAdminPhotography);
router.delete("/photography/:id", ...adminOnly, deleteAdminPhotography);

export default router;
