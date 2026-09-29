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

const router = express.Router();
const vendorAuth = [requireAuth, requireRole("vendor", "admin")];

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

export default router;
