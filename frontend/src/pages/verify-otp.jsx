"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "@/compat/navigation";
import Link from "@/compat/Link";
import { useAuth } from "@/context/AuthContext";

export default function VerifyOtpPage() {
  const router = useRouter();
  const [sp] = useSearchParams();
  const { verifyOtp, resendOtp, user } = useAuth();

  const email = sp?.get("email") || "";
  const initialPhone = sp?.get("phone") || "";
  const maskedPhone = sp?.get("maskedPhone") || (initialPhone ? `+91 ******${initialPhone.slice(-4)}` : "");
  const fromLogin = sp?.get("fromLogin") === "true";

  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(45);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef([]);

  // Redirect if already logged in and verified
  useEffect(() => {
    if (user && user.isPhoneVerified && !busy && !success) {
      const role = String(user.role || "").toLowerCase();
      const target =
        role === "admin"
          ? "/admin/dashboard"
          : role === "vendor"
          ? "/vendor/dashboard"
          : "/account";
      router.push(target);
    }
  }, [user, router, busy, success]);

  // Countdown timer for Resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  // Auto-focus first input box on load
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleDigitChange = (index, value) => {
    // Only accept numeric digits
    const cleaned = value.replace(/\D/g, "");

    if (cleaned.length > 1) {
      // Handle paste of multiple characters
      const pastedDigits = cleaned.slice(0, 6).split("");
      const newDigits = [...otpDigits];
      pastedDigits.forEach((d, i) => {
        if (index + i < 6) newDigits[index + i] = d;
      });
      setOtpDigits(newDigits);
      const nextFocus = Math.min(index + pastedDigits.length, 5);
      inputRefs.current[nextFocus]?.focus();

      if (newDigits.every((d) => d !== "")) {
        submitOtp(newDigits.join(""));
      }
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = cleaned;
    setOtpDigits(newDigits);
    setError("");

    // Move to next input if digit entered
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (cleaned && index === 5 && newDigits.every((d) => d !== "")) {
      submitOtp(newDigits.join(""));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      // Move to previous input on backspace
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const newDigits = [...otpDigits];
    pasted.split("").forEach((d, i) => {
      newDigits[i] = d;
    });
    setOtpDigits(newDigits);
    const nextFocus = Math.min(pasted.length, 5);
    inputRefs.current[nextFocus]?.focus();

    if (pasted.length === 6) {
      submitOtp(pasted);
    }
  };

  const submitOtp = async (codeToSubmit) => {
    const otp = typeof codeToSubmit === "string" ? codeToSubmit : otpDigits.join("");
    if (otp.length < 6) {
      setError("Please enter the complete 6-digit OTP code.");
      return;
    }

    if (!email) {
      setError("Email reference missing. Please try signing in again.");
      return;
    }

    setError("");
    setSuccess("");
    setBusy(true);

    try {
      await verifyOtp(email, otp);
      setSuccess("WhatsApp number verified successfully! Redirecting to login page...");
      setTimeout(() => {
        router.push(`/login?verified=true&email=${encodeURIComponent(email)}`);
      }, 1000);
    } catch (err) {
      setError(err.message || "Invalid or expired OTP. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || resending || !email) return;
    setError("");
    setSuccess("");
    setResending(true);

    try {
      const res = await resendOtp(email);
      setSuccess(res.message || "A new OTP has been sent to your WhatsApp number.");
      setCountdown(45);
      setCanResend(false);
      setOtpDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message || "Failed to resend OTP. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-brand-50/40">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-brand-500/5 border border-brand-100 p-6 sm:p-8 text-center transition-all">
        {/* WhatsApp Icon Header */}
        <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
          <span className="text-3xl" role="img" aria-label="WhatsApp">
            💬
          </span>
        </div>

        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink mb-2">
          Verify Mobile Number
        </h1>
        <p className="text-muted text-sm mb-1">
          We have sent a 6-digit verification code to your WhatsApp.
        </p>

        {maskedPhone && (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200/80 rounded-full text-emerald-800 text-xs font-semibold my-2">
            <span>WhatsApp:</span>
            <span className="font-mono">{maskedPhone}</span>
          </div>
        )}

        {fromLogin && (
          <div className="mt-2 mb-4 p-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl text-left">
            ⚠️ <strong>Verification required:</strong> Please verify your phone number to sign in to your FlipsAura account.
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm rounded-xl font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm rounded-xl font-medium">
            ✅ {success}
          </div>
        )}

        {/* 6-box OTP input */}
        <div className="my-6">
          <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-3">
            Enter 6-Digit Code
          </label>
          <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
            {otpDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                value={digit}
                disabled={busy}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-xl border transition-all focus:outline-none ${
                  digit
                    ? "border-brand-600 bg-brand-50/30 text-brand-900 shadow-sm"
                    : "border-brand-200 bg-white text-ink focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="button"
          onClick={() => submitOtp()}
          disabled={busy || otpDigits.join("").length < 6}
          className="w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 shadow-md shadow-brand-500/20 disabled:opacity-50 transition-all cursor-pointer"
        >
          {busy ? "Verifying OTP..." : "Verify & Continue to Login →"}
        </button>

        {/* Resend Section */}
        <div className="mt-6 pt-4 border-t border-brand-100 flex flex-col sm:flex-row items-center justify-between text-xs text-muted gap-2">
          <span>Didn't receive the OTP on WhatsApp?</span>
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-brand-700 font-bold hover:underline cursor-pointer disabled:opacity-50"
            >
              {resending ? "Sending..." : "Resend OTP"}
            </button>
          ) : (
            <span className="font-mono text-gray-500">
              Resend in {countdown}s
            </span>
          )}
        </div>

        {/* Alternative Links */}
        <div className="mt-6 text-center text-xs text-muted">
          <Link href="/login" className="text-brand-700 font-medium hover:underline">
            ← Back to Login
          </Link>
          <span className="mx-2">•</span>
          <Link href="/register" className="text-brand-700 font-medium hover:underline">
            Register with different details
          </Link>
        </div>
      </div>
    </div>
  );
}
