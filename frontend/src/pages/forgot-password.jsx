"use client";
import { useState } from "react";
import Link from "@/compat/Link";
import api from "@/api/axios";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      const { data } = await api.post("/api/auth/forgot-password", { email: toSend });
      if (!data.ok) {
        throw new Error(data.error || "Failed to send reset link. Please try again.");
      }
      setMessage(data.message || "A password reset link has been sent to your email.");
    } catch (err) {
      const data = err.response?.data;
      setError(data?.error || err.message || "Failed to send reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await sendResetEmail(email);
  };

  const handleResend = async () => {
    if (loading) return;
    await sendResetEmail(email);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-brand-50/40">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-brand-500/5 border border-brand-100 p-6 sm:p-10">
        <div className="text-center mb-6">
          <span className="text-4xl">🔐</span>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink mt-3 mb-1">
            Forgot Password?
          </h1>
          <p className="text-muted text-sm">
            Enter your registered email and we'll send you a secure link to reset your password.
          </p>
        </div>

        {message && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm mb-5">
            <p className="font-semibold m-0">{message}</p>
            <p className="text-xs text-emerald-700 mt-1 m-0">
              Please check your inbox (and spam/junk folder) and click the link to reset your password.
            </p>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl font-medium mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
              Email address
            </label>
            <input
              type="email"
              required
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-50 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 shadow-md shadow-brand-500/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? "Sending reset link…" : message ? "Send Again" : "Send Reset Link"}
          </button>
        </form>

        {message && (
          <div className="mt-6 pt-5 border-t border-brand-100 text-center">
            <p className="text-xs text-muted mb-2">
              Didn't receive the email?
            </p>
            <button
              type="button"
              onClick={handleResend}
              disabled={loading}
              className="text-xs font-bold px-3.5 py-1.5 rounded-lg border border-brand-200 bg-brand-50 hover:bg-brand-100 text-brand-700 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {loading ? "Sending…" : "Resend Email"}
            </button>
          </div>
        )}

        <p className="mt-6 text-center text-muted text-sm">
          Remembered your password?{" "}
          <Link href="/login" className="text-brand-700 font-bold hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
