"use client";
import { useState } from "react";
import { useRouter } from "@/compat/navigation";
import Link from "@/compat/Link";
import { useAuth } from "@/context/AuthContext";
import { uploadFile } from "@/lib/uploadHelper";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    role: "user",
    name: "",
    email: "",
    phone: "",
    password: "",
    // Vendor specific fields
    businessName: "",
    ownerName: "",
    vendorType: "Individual",
    address: "",
    city: "",
    state: "",
    pincode: "",
    profilePhoto: "",
    coverPhoto: "",
  });

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const handleFileUpload = async (file, type) => {
    try {
      if (type === "profile") {
        setUploadingPhoto(true);
        const url = await uploadFile(file, "flipsaura/profiles");
        setForm((prev) => ({ ...prev, profilePhoto: url }));
      } else {
        setUploadingCover(true);
        const url = await uploadFile(file, "flipsaura/covers");
        setForm((prev) => ({ ...prev, coverPhoto: url }));
      }
    } catch (err) {
      setError(`Failed to upload ${type === "profile" ? "logo" : "cover photo"}: ${err.message}`);
    } finally {
      if (type === "profile") setUploadingPhoto(false);
      else setUploadingCover(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      const payload = {
        ...form,
        name: form.role === "vendor" ? (form.ownerName || form.name) : form.name,
      };

      await register(payload);

      // Redirect user to login page so they must explicitly log in
      router.push("/login?registered=true");
    } catch (err) {
      setError(err.message || "Registration failed. Please check your inputs.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container" style={{ padding: "40px 16px 80px" }}>
      <div className="form-card" style={{ maxWidth: form.role === "vendor" ? 640 : 440, margin: "0 auto" }}>
        <h1>Create an account</h1>
        <p className="sub">
          {form.role === "vendor"
            ? "Register your wedding business with FlipsAura."
            : "Join FlipsAura to book premium wedding services."}
        </p>

        {error && (
          <div
            className="error"
            style={{
              padding: "12px 16px",
              borderRadius: 8,
              marginBottom: 20,
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
          <div className="field" style={{ marginBottom: 18 }}>
            <label style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>I want to register as</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <button
                type="button"
                className={`btn ${form.role === "user" ? "btn-primary" : "btn-ghost"}`}
                style={{ padding: "10px", fontSize: 14, borderRadius: 8 }}
                onClick={() => setForm({ ...form, role: "user" })}
              >
                💍 Customer
              </button>
              <button
                type="button"
                className={`btn ${form.role === "vendor" ? "btn-primary" : "btn-ghost"}`}
                style={{ padding: "10px", fontSize: 14, borderRadius: 8 }}
                onClick={() => setForm({ ...form, role: "vendor" })}
              >
                🏪 Vendor / Business
              </button>
            </div>
          </div>

          {form.role === "vendor" ? (
            <>
              <div style={{ background: "var(--pink-50)", padding: "16px", borderRadius: 10, marginBottom: 20 }}>
                <h4 style={{ margin: "0 0 6px", fontSize: 15, color: "var(--pink-700)" }}>
                  Vendor Registration Details
                </h4>
                <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                  Complete your basic registration to access the dashboard shell. Features unlock upon verification.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div className="field">
                  <label>Business / Vendor Name *</label>
                  <input
                    required
                    placeholder="e.g. Royal Shutter Photography"
                    value={form.businessName}
                    onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                  />
                </div>

                <div className="field">
                  <label>Contact Person / Owner Name *</label>
                  <input
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={form.ownerName}
                    onChange={(e) => setForm({ ...form, ownerName: e.target.value, name: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div className="field">
                  <label>Mobile Number *</label>
                  <input
                    required
                    placeholder="e.g. 9876543210"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>

                <div className="field">
                  <label>Email ID *</label>
                  <input
                    type="email"
                    required
                    placeholder="name@business.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="field">
                <label>Vendor Type *</label>
                <select
                  value={form.vendorType}
                  onChange={(e) => setForm({ ...form, vendorType: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #ddd" }}
                >
                  <option value="Individual">Individual (Freelancer / Sole Proprietor)</option>
                  <option value="Business">Business (Registered Company / Agency)</option>
                </select>
              </div>

              <div className="field">
                <label>Business Address *</label>
                <input
                  required
                  placeholder="Street / Area / Landmark"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div className="field">
                  <label>City *</label>
                  <input
                    required
                    placeholder="e.g. Jaipur"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>

                <div className="field">
                  <label>State *</label>
                  <input
                    required
                    placeholder="e.g. Rajasthan"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                  />
                </div>

                <div className="field">
                  <label>PIN Code *</label>
                  <input
                    required
                    placeholder="e.g. 302001"
                    value={form.pincode}
                    onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, margin: "8px 0 16px" }}>
                <div className="field">
                  <label>Profile Photo / Business Logo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "profile")}
                    disabled={uploadingPhoto}
                  />
                  {uploadingPhoto && <span style={{ fontSize: 12, color: "var(--pink-600)" }}>Uploading logo...</span>}
                  {form.profilePhoto && (
                    <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
                      <img src={form.profilePhoto} alt="Logo" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} />
                      <span style={{ fontSize: 12, color: "green" }}>✓ Logo uploaded</span>
                    </div>
                  )}
                </div>

                <div className="field">
                  <label>Cover Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "cover")}
                    disabled={uploadingCover}
                  />
                  {uploadingCover && <span style={{ fontSize: 12, color: "var(--pink-600)" }}>Uploading cover...</span>}
                  {form.coverPhoto && (
                    <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
                      <img src={form.coverPhoto} alt="Cover" style={{ width: 60, height: 35, borderRadius: 4, objectFit: "cover" }} />
                      <span style={{ fontSize: 12, color: "green" }}>✓ Cover uploaded</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="field">
                <label>Password * (Minimum 6 characters)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
            </>
          ) : (
            <>
              <div className="field">
                <label>Full Name *</label>
                <input
                  required
                  placeholder="Your Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="field">
                <label>Email *</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div className="field">
                <label>Phone (Optional)</label>
                <input
                  placeholder="Your Mobile Number"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div className="field">
                <label>Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={busy || uploadingPhoto || uploadingCover}
            style={{ marginTop: 12, padding: "12px", fontSize: 15 }}
          >
            {busy ? "Registering account..." : form.role === "vendor" ? "Register as Vendor →" : "Create Account"}
          </button>
        </form>

        <p style={{ marginTop: 22, textAlign: "center", color: "var(--muted)", fontSize: 14 }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--pink-700)", fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
