"use client";
import { useState } from "react";
import { useRouter } from "@/compat/navigation";
import Link from "@/compat/Link";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", role: "user", businessName: "", aadhar: "", pan: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      const u = await register(form);
      router.push("/login");
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="container">
      <div className="form-card">
        <h1>Create an account</h1>
        <p className="sub">Join FlipsAura to book or list services.</p>
        {error && <div className="error">{error}</div>}
        <form onSubmit={submit}>
          <div className="field"><label>I am a</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="user">Customer</option>
              <option value="vendor">Vendor</option>
            </select>
          </div>
          <div className="field"><label>Full name</label><input required value={form.name} placeholder="Your Name" onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          {form.role === "vendor" && (
            <>
              <div className="field"><label>Business name</label><input value={form.businessName} onChange={e => setForm({ ...form, businessName: e.target.value })} /></div>
              <div className="field"><label>Aadhar Number</label><input required value={form.aadhar} onChange={e => setForm({ ...form, aadhar: e.target.value })} /></div>
              <div className="field"><label>PAN Number (Optional)</label><input value={form.pan} onChange={e => setForm({ ...form, pan: e.target.value })} /></div>
            </>
          )}
          <div className="field"><label>Email</label><input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          <div className="field"><label>Phone</label><input value={form.phone} placeholder="Phone Number" onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="field"><label>Password</label><input type="password" required minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
          <button className="btn btn-primary btn-block" disabled={busy}>{busy ? "Creating…" : "Create account"}</button>
        </form>
        <p style={{ marginTop: 18, textAlign: "center", color: "var(--muted)" }}>
          Have an account? <Link href="/login" style={{ color: "var(--pink-700)", fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
