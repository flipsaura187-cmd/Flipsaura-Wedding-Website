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
    setError(""); setBusy(true);
    try {
      const u = await login(email, password);
      const next =
      sp.get("next") ||
      (u.role === "admin"
        ? "/admin/dashboard"
        : u.role === "vendor"
          ? "/vendor/dashboard"
          : "/account");
      router.push(next);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="container">
      <div className="form-card">
        <h1>Welcome back</h1>
        <p className="sub">Login to your FlipsAura account.</p>
        {error && <div className="error">{error}</div>}
        <form onSubmit={submit}>
          <div className="field"><label>Email</label><input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div className="field"><label>Password</label><input type="password" required value={password} onChange={e => setPassword(e.target.value)} /></div>
          <div style={{ textAlign: "right", marginBottom: "1rem" }}>
            <Link href="/forgot-password" style={{ fontSize: "0.85rem", color: "var(--pink-600)" }}>Forgot password?</Link>
          </div>
          <button className="btn btn-primary btn-block" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        </form>
        <p style={{ marginTop: 18, textAlign: "center", color: "var(--muted)" }}>
          New here? <Link href="/register" style={{ color: "var(--pink-700)", fontWeight: 600 }}>Create an account</Link>
        </p>
      </div>
    </div>
  );
}
