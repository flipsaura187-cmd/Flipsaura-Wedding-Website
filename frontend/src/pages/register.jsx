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

      const res = await register(payload);

      if (res?.requiresVerification) {
        const queryParams = new URLSearchParams({
          email: form.email.trim(),
          phone: form.phone.trim(),
        });
        if (res.data?.maskedPhone) {
          queryParams.set("maskedPhone", res.data.maskedPhone);
        }
        router.push(`/verify-otp?${queryParams.toString()}`);
      } else {
        // Redirect user to login page so they must explicitly log in
        router.push("/login?registered=true");
      }
    } catch (err) {
      setError(err.message || "Registration failed. Please check your inputs.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-brand-50/40">
      <div className={`w-full ${form.role === "vendor" ? "max-w-3xl lg:max-w-4xl" : "max-w-md"} bg-white rounded-2xl shadow-xl shadow-brand-500/5 border border-brand-100 p-6 sm:p-10 transition-all duration-300`}>
        <div className="text-center mb-6">
          <h1 className="font-serif text-3xl font-bold text-ink">Create an account</h1>
          <p className="text-muted text-sm mt-1">
            {form.role === "vendor"
              ? "Register your wedding business with FlipsAura."
              : "Join FlipsAura to book premium wedding services."}
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl font-medium mb-6">
            <div>{error}</div>
            {error.toLowerCase().includes("already registered") && (
              <div className="mt-2 pt-2 border-t border-rose-200/60">
                <Link
                  href={`/login?email=${encodeURIComponent(form.email)}`}
                  className="font-bold underline text-rose-800 hover:text-rose-950 inline-flex items-center gap-1"
                >
                  <span>Already verified? Click here to Sign In →</span>
                </Link>
              </div>
            )}
          </div>
        )}

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-2">
              I want to register as
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className={`py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
                  form.role === "user"
                    ? "bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-md shadow-brand-500/20"
                    : "bg-brand-50 hover:bg-brand-100 text-ink border border-brand-200/60"
                }`}
                onClick={() => setForm({ ...form, role: "user" })}
              >
                💍 Customer
              </button>
              <button
                type="button"
                className={`py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
                  form.role === "vendor"
                    ? "bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-md shadow-brand-500/20"
                    : "bg-brand-50 hover:bg-brand-100 text-ink border border-brand-200/60"
                }`}
                onClick={() => setForm({ ...form, role: "vendor" })}
              >
                🏪 Vendor / Business
              </button>
            </div>
          </div>

          {form.role === "vendor" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 pt-1">
              <div className="md:col-span-2 bg-brand-50 p-4 rounded-xl border border-brand-100">
                <h4 className="font-bold text-sm text-brand-700 mb-1">
                  Vendor Registration Details
                </h4>
                <p className="text-xs text-muted m-0">
                  Complete your basic registration to access the dashboard. Features unlock upon admin approval.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                  Business / Vendor Name *
                </label>
                <input
                  required
                  placeholder="e.g. Royal Shutter Photography"
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                  Contact Person / Owner Name *
                </label>
                <input
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={form.ownerName}
                  onChange={(e) => setForm({ ...form, ownerName: e.target.value, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                  Mobile Number *
                </label>
                <input
                  required
                  placeholder="e.g. 9876543210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                  Email ID *
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@business.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                  Vendor Type *
                </label>
                <select
                  value={form.vendorType}
                  onChange={(e) => setForm({ ...form, vendorType: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                >
                  <option value="Individual">Individual (Freelancer / Sole Proprietor)</option>
                  <option value="Business">Business (Registered Company / Agency)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                  PIN Code *
                </label>
                <input
                  required
                  placeholder="e.g. 302001"
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                  Business Address *
                </label>
                <input
                  required
                  placeholder="Street / Area / Landmark"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                  City *
                </label>
                <input
                  required
                  placeholder="e.g. Jaipur"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                  State *
                </label>
                <input
                  required
                  placeholder="e.g. Rajasthan"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                  Profile Photo / Logo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "profile")}
                  disabled={uploadingPhoto}
                  className="block w-full text-xs text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
                />
                {uploadingPhoto && <span className="text-xs text-brand-600 font-medium block mt-1">Uploading logo...</span>}
                {form.profilePhoto && (
                  <div className="mt-2 flex items-center gap-2">
                    <img src={form.profilePhoto} alt="Logo" className="w-9 h-9 rounded-full object-cover border border-brand-200" />
                    <span className="text-xs text-emerald-600 font-semibold">✓ Logo uploaded</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                  Cover Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "cover")}
                  disabled={uploadingCover}
                  className="block w-full text-xs text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
                />
                {uploadingCover && <span className="text-xs text-brand-600 font-medium block mt-1">Uploading cover...</span>}
                {form.coverPhoto && (
                  <div className="mt-2 flex items-center gap-2">
                    <img src={form.coverPhoto} alt="Cover" className="w-14 h-9 rounded-lg object-cover border border-brand-200" />
                    <span className="text-xs text-emerald-600 font-semibold">✓ Cover uploaded</span>
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                  Password * (Minimum 6 characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                />
              </div>

              <div className="md:col-span-2 pt-2">
                <button
                  type="submit"
                  disabled={busy || uploadingPhoto || uploadingCover}
                  className="w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 shadow-md shadow-brand-500/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {busy ? "Registering account..." : "Register as Vendor →"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <input
                  required
                  placeholder="Your Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Mobile Number (WhatsApp) *</span>
                  <span className="text-[11px] text-brand-600 font-semibold normal-case">OTP sent on WhatsApp</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    title="Please enter a valid 10-digit mobile number"
                    placeholder="9876543210"
                    maxLength={10}
                    value={form.phone.replace(/^\+?91/, "").replace(/\D/g, "")}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setForm({ ...form, phone: digits });
                    }}
                    className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all font-mono"
                  />
                </div>
                <p className="text-[11px] text-muted mt-1">
                  We will send a 6-digit verification code to this WhatsApp number.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 px-4 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 shadow-md shadow-brand-500/20 disabled:opacity-50 transition-all cursor-pointer mt-2"
              >
                {busy ? "Registering account..." : "Create Account"}
              </button>
            </div>
          )}
        </form>

        <p className="mt-6 text-center text-muted text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-700 font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

