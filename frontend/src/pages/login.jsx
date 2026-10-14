"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "@/compat/navigation";
import Link from "@/compat/Link";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login, user, logout } = useAuth();
  const router = useRouter();
  const [sp] = useSearchParams();
  const [email, setEmail] = useState(() => sp?.get("email") || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const qEmail = sp?.get("email");
    if (qEmail) setEmail(qEmail);
  }, [sp]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const u = await login(email, password);
      const role = String(u?.role || "").toLowerCase();
      const next =
        sp?.get("next") ||
        (role === "admin"
          ? "/admin/dashboard"
          : role === "vendor"
          ? "/vendor/dashboard"
          : "/");
      router.push(next);
    } catch (err) {
      if (err.response?.data?.requiresVerification) {
        const queryParams = new URLSearchParams({
          email: (err.response.data.data?.email || email).trim(),
          phone: (err.response.data.data?.phone || "").trim(),
          fromLogin: "true",
        });
        if (err.response.data.data?.maskedPhone) {
          queryParams.set("maskedPhone", err.response.data.data.maskedPhone);
        }
        router.push(`/verify-otp?${queryParams.toString()}`);
        return;
      }
      setError(err.message || "Invalid credentials. Please check your email and password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container py-16 px-4">
      <div className="form-card max-w-md mx-auto bg-white rounded-2xl shadow-lg border border-line p-8">
        <h1 className="text-2xl font-serif font-bold text-wine mb-2">Welcome back</h1>
        <p className="sub text-sm text-gray-500 mb-6">
          Login to your FlipsAura account.
        </p>

        {user && (
          <div className="p-4 rounded-xl mb-6 bg-emerald-50 text-emerald-900 border border-emerald-200 text-sm">
            <div className="font-semibold text-emerald-950 mb-1 flex items-center gap-1.5">
              <span>✅</span>
              <span>You are already signed in as {user.name}</span>
            </div>
            <p className="text-xs text-emerald-800 mb-3">{user.email}</p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/"
                className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-sm transition"
              >
                Go to Home Page →
              </Link>
              <Link
                href="/account"
                className="px-3 py-2 rounded-lg border border-emerald-300 hover:bg-emerald-100/60 text-xs text-emerald-900 font-medium transition"
              >
                My Account
              </Link>
              <button
                type="button"
                onClick={logout}
                className="px-3 py-2 rounded-lg border border-emerald-300 hover:bg-emerald-100/60 text-xs text-emerald-900 font-medium transition cursor-pointer"
              >
                Sign Out / Switch Account
              </button>
            </div>
          </div>
        )}

        {sp?.get("verified") === "true" && !error && (
          <div className="p-3.5 rounded-xl mb-4 bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm font-medium flex items-start gap-2">
            <span>✅</span>
            <div>
              <strong>WhatsApp number verified successfully!</strong>
              <div className="text-xs text-emerald-700 mt-0.5">
                Please enter your password below to sign in to your account.
              </div>
            </div>
          </div>
        )}

        {sp?.get("registered") === "true" && !sp?.get("verified") && !error && (
          <div className="p-3 rounded-lg mb-4 bg-green-50 text-green-800 border border-green-200 text-sm font-medium">
            ✅ Account created successfully! Please sign in to continue.
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg mb-4 bg-red-50 text-red-800 border border-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div className="field">
            <label className="block mb-1.5 font-medium text-sm text-gray-700">
              Email address
            </label>
            <input
              type="email"
              required
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
            />
          </div>

          <div className="field">
            <label className="block mb-1.5 font-medium text-sm text-gray-700">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
            />
          </div>

          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-xs text-wine hover:underline font-medium"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 px-4 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition shadow-sm disabled:opacity-50"
          >
            {busy ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-500 text-sm">
          New here?{" "}
          <Link href="/register" className="text-wine font-semibold hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
