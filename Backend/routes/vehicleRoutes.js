import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  getVehicles,
  getVehicleById,
  checkAvailability,
  createVehicleBooking,
  getCustomerVehicleBookings,
  cancelCustomerVehicleBooking,
  acceptVehicleQuote,
  getOwnerVehicles,
  createVehicle,
  updateVehicle,
  toggleVehicleStatus,
  deleteVehicle,
  getOwnerBookings,
  respondToVehicleBooking,
  getAdminVehicles,
  verifyAdminVehicle,
  getAdminVehicleBookings,
  updateAdminVehicleBookingStatus,
} from "../controllers/vehicleController.js";

const router = express.Router();

// ============================================
// Public / General Endpoints
// ============================================
router.get("/", getVehicles);

// ============================================
// Owner / Provider Endpoints (must precede /:id)
// ============================================
router.get("/my-vehicles", requireAuth, getOwnerVehicles);
router.post("/", requireAuth, createVehicle);
router.get("/my-bookings", requireAuth, getOwnerBookings);
router.patch("/bookings/:id/respond", requireAuth, respondToVehicleBooking);

// ============================================
// Customer Endpoints (must precede /:id)
// ============================================
router.get("/customer/bookings", requireAuth, getCustomerVehicleBookings);
router.patch("/customer/bookings/:id/cancel", requireAuth, cancelCustomerVehicleBooking);
router.patch("/customer/bookings/:id/accept-quote", requireAuth, acceptVehicleQuote);

// ============================================
// Admin Endpoints (must precede /:id)
// ============================================
router.get("/admin/all", requireAuth, requireRole("admin"), getAdminVehicles);
router.patch("/admin/:id/verify", requireAuth, requireRole("admin"), verifyAdminVehicle);
router.get("/admin/bookings", requireAuth, requireRole("admin"), getAdminVehicleBookings);
router.patch("/admin/bookings/:id/status", requireAuth, requireRole("admin"), updateAdminVehicleBookingStatus);

// ============================================
// Specific Vehicle Item Endpoints
// ============================================
router.get("/:id", getVehicleById);
router.get("/:id/check-availability", checkAvailability);
router.post("/:id/book", requireAuth, createVehicleBooking);
router.put("/:id", requireAuth, updateVehicle);
router.patch("/:id/status", requireAuth, toggleVehicleStatus);
router.delete("/:id", requireAuth, deleteVehicle);

export default router;
