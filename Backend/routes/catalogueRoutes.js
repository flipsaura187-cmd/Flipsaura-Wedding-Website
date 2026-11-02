import express from "express";
import { getCatalogueMetadata } from "../controllers/catalogueController.js";

const router = express.Router();

router.get("/metadata", getCatalogueMetadata);

export default router;

