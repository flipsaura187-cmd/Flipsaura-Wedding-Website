import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { getVendorStats } from "../controllers/adminController.js";
import {
  getVendorProfile,
  updateVendorProfile,
  uploadOrUpdateDocument,
  updateBankDetails,
  addPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  submitForVerification,
  getVendorStatus,
} from "../controllers/vendorController.js";
import {
  createAdminVenue,
  updateAdminVenue,
  deleteAdminVenue,
} from "../controllers/adminVenueController.js";
import {
  createAdminHotel,
  updateAdminHotel,
  deleteAdminHotel,
} from "../controllers/adminHotelController.js";
import {
  createAdminPhotography,
  updateAdminPhotography,
  deleteAdminPhotography,
} from "../controllers/adminPhotographyController.js";
import {
  createAdminMehandi,
  updateAdminMehandi,
  deleteAdminMehandi,
} from "../controllers/adminMehandiController.js";
import {
  createAdminHomeSetup,
  updateAdminHomeSetup,
  deleteAdminHomeSetup,
} from "../controllers/adminHomeSetupController.js";

const router = express.Router();
const vendorAuth = [requireAuth, requireRole("user", "vendor", "admin")];

// Profile & Completion
router.get("/profile", ...vendorAuth, getVendorProfile);
router.put("/profile", ...vendorAuth, updateVendorProfile);
router.get("/status", ...vendorAuth, getVendorStatus);

// KYC Documents
router.post("/document", ...vendorAuth, uploadOrUpdateDocument);

// Bank Details
router.put("/bank-details", ...vendorAuth, updateBankDetails);

// Portfolio
router.post("/portfolio", ...vendorAuth, addPortfolioItem);
router.put("/portfolio/:id", ...vendorAuth, updatePortfolioItem);
router.delete("/portfolio/:id", ...vendorAuth, deletePortfolioItem);

// Submission for Verification
router.post("/submit-verification", ...vendorAuth, submitForVerification);

// Vendor Stats
router.get("/stats", ...vendorAuth, getVendorStats);

// Specialized Vendor Service CRUD
// Venues
router.post("/venues", ...vendorAuth, createAdminVenue);
router.put("/venues/:id", ...vendorAuth, updateAdminVenue);
router.delete("/venues/:id", ...vendorAuth, deleteAdminVenue);

// Hotels
router.post("/hotels", ...vendorAuth, createAdminHotel);
router.put("/hotels/:id", ...vendorAuth, updateAdminHotel);
router.delete("/hotels/:id", ...vendorAuth, deleteAdminHotel);

// Photography
router.post("/photography", ...vendorAuth, createAdminPhotography);
router.put("/photography/:id", ...vendorAuth, updateAdminPhotography);
router.delete("/photography/:id", ...vendorAuth, deleteAdminPhotography);

// Mehandi
router.post("/mehandi", ...vendorAuth, createAdminMehandi);
router.put("/mehandi/:id", ...vendorAuth, updateAdminMehandi);
router.delete("/mehandi/:id", ...vendorAuth, deleteAdminMehandi);

// Home Setup & Event Services
router.post("/home-setup", ...vendorAuth, createAdminHomeSetup);
router.put("/home-setup/:id", ...vendorAuth, updateAdminHomeSetup);
router.delete("/home-setup/:id", ...vendorAuth, deleteAdminHomeSetup);

export default router;
