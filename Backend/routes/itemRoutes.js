import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { getItems, createItem, getItem, updateItem, deleteItem } from "../controllers/itemController.js";

const router = express.Router();

router.get("/", getItems);
router.post("/", requireAuth, requireRole("admin", "vendor"), createItem);
router.get("/:id", getItem);
router.put("/:id", requireAuth, updateItem);
router.delete("/:id", requireAuth, deleteItem);

export default router;
