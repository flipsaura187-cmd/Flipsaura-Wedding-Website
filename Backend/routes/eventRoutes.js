import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  getPublicEvents,
  getEventBySlug,
  registerForEvent,
  verifyEventPayment,
  reportPaymentFailure,
  retryEventPayment,
  getRegistrationDetails,
  handleRazorpayWebhook,
  getAdminEvents,
  getAdminEventById,
  createAdminEvent,
  updateAdminEvent,
  deleteAdminEvent,
  getAdminEventRegistrations,
  exportEventRegistrationsCsv,
} from "../controllers/eventController.js";

const router = express.Router();
const adminOnly = [requireAuth, requireRole("admin")];

// 1. Admin Event Management Routes (Placed first to avoid collision with :slug)
router.get("/admin/all", ...adminOnly, getAdminEvents);
router.get("/admin/:id/registrations", ...adminOnly, getAdminEventRegistrations);
router.get("/admin/:id/export", ...adminOnly, exportEventRegistrationsCsv);
router.get("/admin/:id", ...adminOnly, getAdminEventById);
router.post("/admin", ...adminOnly, createAdminEvent);
router.put("/admin/:id", ...adminOnly, updateAdminEvent);
router.delete("/admin/:id", ...adminOnly, deleteAdminEvent);

// 2. Specific Public Routes
router.get("/", getPublicEvents);
router.post("/payment/verify", verifyEventPayment);
router.post("/verify-payment", verifyEventPayment);
router.post("/payment/failure", reportPaymentFailure);
router.post("/payment-failed", reportPaymentFailure);
router.post("/payment/retry-order", retryEventPayment);
router.get("/registration-details/:identifier", getRegistrationDetails);
router.get("/registration/:identifier", getRegistrationDetails);
router.post("/webhook", handleRazorpayWebhook);

// 3. Dynamic Event Slug / ID Routes
router.post("/:slug/register", registerForEvent);
router.get("/detail/:slug", getEventBySlug);
router.get("/:slug", getEventBySlug);

export default router;
