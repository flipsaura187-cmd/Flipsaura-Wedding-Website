"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "@/compat/navigation";
import Link from "@/compat/Link";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login, user, logout } = useAuth();
  const router = useRouter();
  const [sp] = useSearchParams();

  // Identifier = email OR 10-digit mobile number
  const [identifier, setIdentifier] = useState(() => sp?.get("email") || sp?.get("phone") || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const qEmail = sp?.get("email");
    const qPhone = sp?.get("phone");
    if (qEmail) setIdentifier(qEmail);
    else if (qPhone) setIdentifier(qPhone);
  }, [sp]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    // Basic client-side validation
    const val = identifier.trim();
    if (!val) {
      setError("Please enter your mobile number or email address.");
      return;
    }

    // If looks like phone, validate 10 digits
    const isLikelyPhone = /^\+?[\d\s\-()]{7,}$/.test(val) && !val.includes("@");
    if (isLikelyPhone) {
      const digits = val.replace(/\D/g, "");
      if (digits.length < 10) {
        setError("Please enter a valid 10-digit mobile number.");
        return;
      }
    }

    setBusy(true);
    try {
      const u = await login(val, password);
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
      setError(err.message || "Invalid credentials. Please check and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-brand-50/40">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-brand-500/5 border border-brand-100 p-6 sm:p-10">

        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-4xl">💍</span>
          <h1 className="font-serif text-3xl font-bold text-ink mt-3 mb-1">
            Welcome back
          </h1>
          <p className="text-muted text-sm">
            Sign in with your mobile number or email.
          </p>
        </div>

        {/* Already logged in banner */}
        {user && (
          <div className="p-4 rounded-xl mb-6 bg-emerald-50 text-emerald-900 border border-emerald-200 text-sm">
            <div className="font-semibold text-emerald-950 mb-1 flex items-center gap-1.5">
              <span>✅</span>
              <span>You are already signed in as {user.name}</span>
            </div>
            <p className="text-xs text-emerald-800 mb-3">{user.email || user.phone}</p>
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

        {/* Success: just registered */}
        {sp?.get("registered") === "true" && !error && (
          <div className="p-3.5 rounded-xl mb-5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm font-medium flex items-start gap-2">
            <span>🎉</span>
            <div>
              <strong>Account created successfully!</strong>
              <div className="text-xs text-emerald-700 mt-0.5">
                Please sign in with your mobile number or email to continue.
              </div>
            </div>
          </div>
        )}

        {/* Success: verified */}
        {sp?.get("verified") === "true" && !error && (
          <div className="p-3.5 rounded-xl mb-5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm font-medium flex items-start gap-2">
            <span>✅</span>
            <div>
              <strong>Account verified successfully!</strong>
              <div className="text-xs text-emerald-700 mt-0.5">
                Please enter your password below to sign in.
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl font-medium mb-5">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-5">
          {/* Mobile / Email identifier */}
          <div>
            <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
              Mobile Number or Email
            </label>
            <input
              type="text"
              required
              autoComplete="username"
              placeholder="9876543210  or  name@example.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={busy}
              className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-50 transition-all"
            />
            <p className="text-xs text-muted mt-1">Enter the mobile number or email used during signup.</p>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-ink uppercase tracking-wider">
                Password
              </label>
              <Link
                href={`/forgot-password${identifier && identifier.includes("@") ? `?email=${encodeURIComponent(identifier)}` : ""}`}
                className="text-xs text-brand-700 hover:text-brand-900 font-semibold hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
                className="w-full px-3.5 py-2.5 pr-11 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-50 transition-all"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 px-4 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 shadow-md shadow-brand-500/20 disabled:opacity-50 transition-all cursor-pointer mt-1"
          >
            {busy ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing in…
              </span>
            ) : (
              "Sign In →"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-brand-100" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-muted">Don't have an account?</span>
          </div>
        </div>

        <Link
          href="/register"
          className="block w-full py-2.5 px-4 rounded-xl text-center text-brand-700 font-bold text-sm border border-brand-200 hover:bg-brand-50 hover:border-brand-400 transition-all"
        >
          Create Account →
        </Link>
      </div>
    </div>
  );
}
