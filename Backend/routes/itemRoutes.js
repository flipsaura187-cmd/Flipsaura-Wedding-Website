import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { getItems, getFilterOptions, createItem, getItem, updateItem, deleteItem } from "../controllers/itemController.js";
import { getHotelAvailability, toggleHotelBlockedDates } from "../controllers/hotelAvailabilityController.js";

const router = express.Router();

router.get("/", getItems);
router.get("/filter-options", getFilterOptions);
router.post("/", requireAuth, requireRole("admin", "vendor"), createItem);
router.get("/:id/hotel-availability", getHotelAvailability);
router.post("/:id/block-dates", requireAuth, requireRole("admin", "vendor"), toggleHotelBlockedDates);
router.get("/:id", getItem);
router.put("/:id", requireAuth, updateItem);
router.delete("/:id", requireAuth, deleteItem);

export default router;
