"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "@/compat/navigation";
import Link from "@/compat/Link";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [sp] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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
          : "/account");
      router.push(next);
    } catch (err) {
      setError(err.message || "Invalid credentials. Please check your email and password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container" style={{ padding: "60px 16px" }}>
      <div className="form-card" style={{ maxWidth: 440, margin: "0 auto" }}>
        <h1 style={{ fontSize: 24, marginBottom: 8, color: "var(--wine, #8B1E3F)" }}>Welcome back</h1>
        <p className="sub" style={{ fontSize: 14, color: "#666", marginBottom: 20 }}>
          Login to your FlipsAura account.
        </p>

        {error && (
          <div
            className="error"
            style={{
              padding: "12px 16px",
              borderRadius: 8,
              marginBottom: 16,
              background: "#FFEBEE",
              color: "#C62828",
              border: "1px solid #FFCDD2",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={submit}>
          <div className="field" style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: 14 }}>
              Email address
            </label>
            <input
              type="email"
              required
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 15 }}
            />
          </div>

          <div className="field" style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: 14 }}>
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 15 }}
            />
          </div>

          <div style={{ textAlign: "right", marginBottom: 20 }}>
            <Link
              href="/forgot-password"
              style={{ fontSize: "0.85rem", color: "var(--wine, #8B1E3F)", fontWeight: 500 }}
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={busy}
            style={{ width: "100%", padding: "12px", borderRadius: 8, fontWeight: 600, fontSize: 15, cursor: busy ? "not-allowed" : "pointer" }}
          >
            {busy ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p style={{ marginTop: 20, textAlign: "center", color: "#666", fontSize: 14 }}>
          New here?{" "}
          <Link href="/register" style={{ color: "var(--wine, #8B1E3F)", fontWeight: 600 }}>
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
