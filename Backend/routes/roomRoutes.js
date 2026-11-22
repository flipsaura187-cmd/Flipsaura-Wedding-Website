import express from "express";
import { getCurrentUser, requireAuth, requireRole } from "../middleware/auth.js";
import {
  getRooms,
  getRoom,
  createRoom,
  updateRoom,
  deleteRoom,
} from "../controllers/roomController.js";
import { toggleRoomBlockedDates } from "../controllers/hotelAvailabilityController.js";

const router = express.Router();

async function optionalAuth(req, res, next) {
  try {
    const user = await getCurrentUser(req);
    if (user) req.user = user;
  } catch (e) {}
  next();
}

// Public or vendor listing
router.get("/", optionalAuth, getRooms);
router.get("/:id", optionalAuth, getRoom);

// Vendor & Admin CRUD mutations
router.post("/", requireAuth, requireRole("admin", "vendor"), createRoom);
router.post("/:id/block-dates", requireAuth, requireRole("admin", "vendor"), toggleRoomBlockedDates);
router.put("/:id", requireAuth, requireRole("admin", "vendor"), updateRoom);
router.delete("/:id", requireAuth, requireRole("admin", "vendor"), deleteRoom);

export default router;
