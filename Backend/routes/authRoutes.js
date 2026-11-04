import express from "express";
import {
  login,
  sendLoginOtp,
  verifyLoginOtp,
  register,
  logout,
  me,
  forgotPassword,
  resetPassword,
  verifyOtp,
  resendOtp,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/login-otp/send", sendLoginOtp);
router.post("/login-otp/verify", verifyLoginOtp);
router.post("/logout", logout);
router.get("/me", me);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/reset-password/:token", resetPassword);

export default router;
