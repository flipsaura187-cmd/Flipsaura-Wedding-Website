import express from "express";
import { createBookingEnquiry } from "../controllers/enquiryController.js";

const router = express.Router();

router.post("/", createBookingEnquiry);

export default router;

