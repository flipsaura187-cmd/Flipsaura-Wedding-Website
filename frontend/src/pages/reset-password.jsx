"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter, useParams } from "@/compat/navigation";
import Link from "@/compat/Link";

export default function ResetPasswordPage() {
  const searchParamsResult = useSearchParams();
  const searchParams = Array.isArray(searchParamsResult) ? searchParamsResult[0] : searchParamsResult;
  const routeParams = useParams();
  const router = useRouter();

  // Support token from query param (?token=...) or path param (/reset-password/:token)
  const token =
    (typeof searchParams?.get === "function" ? searchParams.get("token") : null) ||
    (typeof searchParamsResult?.get === "function" ? searchParamsResult.get("token") : null) ||
    routeParams?.token ||
    (typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("token") ||
        window.location.pathname.split("/reset-password/")[1]?.split("?")[0]
      : "");

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(0);

  useEffect(() => {
    if (!token) {
      setError("Missing reset token. Please use the complete link provided in your email.");
    }
  }, [token]);

  useEffect(() => {
    if (redirectCountdown <= 0) return;
    const timer = setTimeout(() => {
      if (redirectCountdown === 1) {
        router.push("/login");
      } else {
        setRedirectCountdown((prev) => prev - 1);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [redirectCountdown, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("No valid reset token found. Please request a new link.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirm) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Password reset failed. The link may have expired.");
      }

      setMessage("Password updated successfully! Redirecting you to login...");
      setRedirectCountdown(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: "60px 16px" }}>
      <div className="form-card" style={{ maxWidth: 440, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <span style={{ fontSize: 36 }}>🔑</span>
          <h1 style={{ fontSize: 24, margin: "12px 0 6px", color: "var(--wine, #8B1E3F)" }}>
            Create New Password
          </h1>
          <p className="sub" style={{ fontSize: 14, color: "#666" }}>
            Choose a strong, secure password for your account.
          </p>
        </div>

        {message && (
          <div
            className="success"
            style={{
              padding: "14px 16px",
              borderRadius: 8,
              marginBottom: 16,
              background: "#E8F5E9",
              color: "#2E7D32",
              border: "1px solid #C8E6C9",
              fontSize: 14,
            }}
          >
            <p style={{ margin: 0, fontWeight: 600 }}>{message}</p>
            {redirectCountdown > 0 && (
              <p style={{ margin: "6px 0 0", fontSize: 13 }}>
                Redirecting in {redirectCountdown}s...
              </p>
            )}
          </div>
        )}

        {error && (
          <div
            className="error"
            style={{
              padding: "14px 16px",
              borderRadius: 8,
              marginBottom: 16,
              background: "#FFEBEE",
              color: "#C62828",
              border: "1px solid #FFCDD2",
              fontSize: 14,
            }}
          >
            <p style={{ margin: 0 }}>{error}</p>
            {error.includes("expired") || error.includes("Missing") || error.includes("Invalid") ? (
              <div style={{ marginTop: 10 }}>
                <Link
                  href="/forgot-password"
                  style={{
                    fontSize: 13,
                    color: "#B71C1C",
                    textDecoration: "underline",
                    fontWeight: 600,
                  }}
                >
                  Request a new password reset link →
                </Link>
              </div>
            ) : null}
          </div>
        )}

        {!message && (
          <form onSubmit={handleSubmit}>
            <div className="field" style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: 14 }}>
                New Password (min 6 characters)
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading || !token}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #ddd",
                  fontSize: 15,
                }}
              />
            </div>

            <div className="field" style={{ marginBottom: 20 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: 14 }}>
                Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={loading || !token}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #ddd",
                  fontSize: 15,
                }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading || !token}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 15,
                cursor: loading || !token ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Updating password…" : "Reset Password"}
            </button>
          </form>
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