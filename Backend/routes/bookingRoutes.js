import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { getBookings, createBooking, getBooking, updateBooking } from "../controllers/bookingController.js";

const router = express.Router();

router.get("/", requireAuth, getBookings);
router.post("/", requireAuth, createBooking);
router.get("/:id", requireAuth, getBooking);
router.put("/:id", requireAuth, updateBooking);

export default router;
