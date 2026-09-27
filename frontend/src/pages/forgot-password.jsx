"use client";
import { useState, useEffect } from "react";
import Link from "@/compat/Link";

import api from "@/api/axios";
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const sendResetEmail = async (targetEmail) => {
    const toSend = targetEmail || email;
    if (!toSend) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      try {
        const { data } = await api.post("/api/auth/forgot-password", { email: toSend });
        if (!data.ok) throw new Error(data.error || "Failed to send reset link. Please try again.");
        setMessage(data.message || "A password reset link has been sent to your email.");
      } catch (err) {
        const data = err.response?.data;
        if (err.response?.status === 429 && data?.retryAfter) {
          setCooldown(data.retryAfter);
        }
        throw new Error(data?.error || err.message || "Failed to send reset link. Please try again.");
      }
      setCooldown(60); // 60 seconds cooldown for resending
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await sendResetEmail(email);
  };

  const handleResend = async () => {
    if (cooldown > 0 || loading) return;
    await sendResetEmail(email);
  };

  return (
    <div className="container" style={{ padding: "60px 16px" }}>
      <div className="form-card" style={{ maxWidth: 440, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <span style={{ fontSize: 36 }}>🔐</span>
          <h1 style={{ fontSize: 24, margin: "12px 0 6px", color: "var(--wine, #8B1E3F)" }}>Forgot Password?</h1>
          <p className="sub" style={{ fontSize: 14, color: "#666" }}>
            Enter your registered email and we'll send you a secure link to reset your password.
          </p>
        </div>

        {message && (
          <div className="success" style={{ padding: "14px 16px", borderRadius: 8, marginBottom: 16, background: "#E8F5E9", color: "#2E7D32", border: "1px solid #C8E6C9", fontSize: 14 }}>
            <p style={{ margin: 0, fontWeight: 500 }}>{message}</p>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "#388E3C" }}>
              Please check your inbox (and spam/junk folder).
            </p>
          </div>
        )}

        {error && (
          <div className="error" style={{ padding: "14px 16px", borderRadius: 8, marginBottom: 16, background: "#FFEBEE", color: "#C62828", border: "1px solid #FFCDD2", fontSize: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field" style={{ marginBottom: 18 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: 14 }}>
              Email address
            </label>
            <input
              type="email"
              required
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 15 }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading || (message && cooldown > 0)}
            style={{ width: "100%", padding: "12px", borderRadius: 8, fontWeight: 600, fontSize: 15, cursor: "pointer" }}
          >
            {loading ? "Sending reset link…" : message ? "Send Again" : "Send Reset Link"}
          </button>
        </form>

        {message && (
          <div style={{ marginTop: 16, textAlign: "center", paddingTop: 16, borderTop: "1px solid #eee" }}>
            <p style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>
              Didn't receive the email?
            </p>
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || loading}
              className="btn btn-ghost"
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: cooldown > 0 ? "#999" : "var(--wine, #8B1E3F)",
                cursor: cooldown > 0 ? "not-allowed" : "pointer",
                padding: "6px 14px",
                border: "1px solid #ddd",
                borderRadius: 6,
                background: "#fdfdfd"
              }}
            >
              {cooldown > 0 ? `Resend email in ${cooldown}s` : "Resend Email"}
            </button>
          </div>
        )}

        <p style={{ marginTop: 24, textAlign: "center", fontSize: 14 }}>
          Remembered your password?{" "}
          <Link href="/login" style={{ color: "var(--wine, #8B1E3F)", fontWeight: 600 }}>
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
