import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  getMyHomeSetupProfile,
  saveHomeSetupOnboarding,
  updateHomeSetupProfile,
  getMyServices,
  getVendorHomeSetupStats,
  createService,
  updateService,
  deleteService,
  getPublicCategories,
  getPublicServices,
} from "../controllers/homeSetupVendorController.js";

const router = express.Router();
const vendorAuth = [requireAuth, requireRole("user", "vendor", "admin")];

// Public (customer-side)
router.get("/categories", getPublicCategories);
router.get("/services", getPublicServices);

// Vendor-protected
router.get("/profile", ...vendorAuth, getMyHomeSetupProfile);
router.post("/onboard", ...vendorAuth, saveHomeSetupOnboarding);
router.put("/profile", ...vendorAuth, updateHomeSetupProfile);

router.get("/my-services", ...vendorAuth, getMyServices);
router.get("/stats", ...vendorAuth, getVendorHomeSetupStats);
router.post("/services", ...vendorAuth, createService);
router.put("/services/:id", ...vendorAuth, updateService);
router.delete("/services/:id", ...vendorAuth, deleteService);

export default router;
