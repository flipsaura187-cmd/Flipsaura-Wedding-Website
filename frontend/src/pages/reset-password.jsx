"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useParams } from "@/compat/navigation";
import Link from "@/compat/Link";
import api from "@/api/axios";

export default function ResetPasswordPage() {
  const searchParamsResult = useSearchParams();
  const searchParams = Array.isArray(searchParamsResult) ? searchParamsResult[0] : searchParamsResult;
  const routeParams = useParams();

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

  useEffect(() => {
    if (!token) {
      setError("Missing reset token. Please use the complete link provided in your email.");
    }
  }, [token]);

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
      const { data } = await api.post("/api/auth/reset-password", { token, newPassword });
      if (!data.ok) {
        throw new Error(data.error || "Password reset failed. The link may be invalid.");
      }

      setMessage("Password updated successfully! You can now log in with your new password.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-brand-50/40">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-brand-500/5 border border-brand-100 p-6 sm:p-10">
        <div className="text-center mb-6">
          <span className="text-4xl">🔑</span>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink mt-3 mb-1">
            Create New Password
          </h1>
          <p className="text-muted text-sm">
            Choose a strong, secure password for your account.
          </p>
        </div>

        {message ? (
          <div className="space-y-5 text-center">
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm">
              <p className="font-semibold m-0">{message}</p>
            </div>

            <Link
              href="/login"
              className="inline-block w-full py-3 px-4 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 shadow-md shadow-brand-500/20 transition-all text-center"
            >
              Log In Now →
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl font-medium mb-5">
                <p className="m-0">{error}</p>
                {(error.includes("expired") || error.includes("Missing") || error.includes("Invalid")) && (
                  <div className="mt-2">
                    <Link
                      href="/forgot-password"
                      className="text-xs text-rose-800 font-bold underline"
                    >
                      Request a new password reset link →
                    </Link>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
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
                  className="w-full px-4 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-50 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
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
                  className="w-full px-4 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-50 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !token}
                className="w-full py-3 px-4 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 shadow-md shadow-brand-500/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? "Updating password…" : "Reset Password"}
              </button>
            </form>

            <p className="mt-6 text-center text-muted text-sm">
              Remembered your password?{" "}
              <Link href="/login" className="text-brand-700 font-bold hover:underline">
                Back to login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
