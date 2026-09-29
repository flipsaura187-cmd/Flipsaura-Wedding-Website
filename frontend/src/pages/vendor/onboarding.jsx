"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "@/compat/navigation";
import api from "@/api/axios";
import { uploadFile } from "@/lib/uploadHelper";

export default function VendorOnboardingPage() {
  const [sp] = useSearchParams();
  const router = useRouter();
  const initialTab = sp?.get("tab") || "profile";

  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [categories, setCategories] = useState([]);
  const [profile, setProfile] = useState(null);
  const [completion, setCompletion] = useState(null);
  const [user, setUser] = useState(null);

  // Form states for profile & service
  const [profileForm, setProfileForm] = useState({
    businessName: "",
    ownerName: "",
    vendorType: "Individual",
    address: "",
    city: "",
    state: "",
    pincode: "",
    about: "",
    profilePhoto: "",
    coverPhoto: "",
    phone: "",
    // Services
    serviceDescription: "",
    startingPrice: "",
    priceRange: "",
    serviceLocation: "",
    experience: "",
    additionalServicesStr: "",
    categories: [],
  });

  // Bank Form State
  const [bankForm, setBankForm] = useState({
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    chequeUrl: "",
  });

  // Portfolio Form State
  const [portfolioModalOpen, setPortfolioModalOpen] = useState(false);
  const [editingPortfolioId, setEditingPortfolioId] = useState(null);
  const [portfolioForm, setPortfolioForm] = useState({
    title: "",
    category: "Wedding",
    serviceCategory: "",
    description: "",
    images: [],
    videoUrl: "",
  });

  // Doc Upload states
  const [uploadingDoc, setUploadingDoc] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profRes, catRes] = await Promise.all([
        api.get("/api/vendor/profile"),
        api.get("/api/categories"),
      ]);

      if (catRes.data?.ok) {
        setCategories(catRes.data.data?.categories || []);
      }

      if (profRes.data?.ok) {
        const p = profRes.data.data.profile;
        const comp = profRes.data.data.completion;
        const u = profRes.data.data.user;

        setProfile(p);
        setCompletion(comp);
        setUser(u);

        // Populate profile form
        setProfileForm({
          businessName: p.businessName || "",
          ownerName: p.ownerName || u.name || "",
          vendorType: p.vendorType || "Individual",
          address: p.address || "",
          city: p.city || "",
          state: p.state || "",
          pincode: p.pincode || "",
          about: p.about || "",
          profilePhoto: p.profilePhoto || "",
          coverPhoto: p.coverPhoto || "",
          phone: u.phone || "",
          serviceDescription: p.serviceDescription || "",
          startingPrice: p.startingPrice || "",
          priceRange: p.priceRange || "",
          serviceLocation: p.serviceLocation || p.city || "",
          experience: p.experience || "",
          additionalServicesStr: (p.additionalServices || []).join(", "),
          categories: (p.categories || []).map((c) => c._id || c),
        });

        // Populate bank form
        if (p.bankDetails) {
          setBankForm({
            accountHolderName: p.bankDetails.accountHolderName || "",
            bankName: p.bankDetails.bankName || "",
            accountNumber: p.bankDetails.accountNumber || "",
            ifscCode: p.bankDetails.ifscCode || "",
            chequeUrl: p.bankDetails.chequeUrl || "",
          });
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load vendor profile.");
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        ...profileForm,
        startingPrice: Number(profileForm.startingPrice) || 0,
        additionalServices: profileForm.additionalServicesStr
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };

      const { data } = await api.put("/api/vendor/profile", payload);
      if (!data.ok) throw new Error(data.error);

      setProfile(data.data.profile);
      setCompletion(data.data.completion);
      setSuccess("Profile information saved successfully!");
    } catch (err) {
      setError(err.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const saveBankDetails = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { data } = await api.put("/api/vendor/bank-details", bankForm);
      if (!data.ok) throw new Error(data.error);

      setProfile((prev) => ({ ...prev, bankDetails: data.data.bankDetails }));
      setCompletion(data.data.completion);
      setSuccess("Bank details saved successfully!");
    } catch (err) {
      setError(err.message || "Failed to save bank details.");
    } finally {
      setSaving(false);
    }
  };

  const handleDocUpload = async (docType, file, side = "front") => {
    setUploadingDoc((prev) => ({ ...prev, [docType]: true }));
    setError("");
    setSuccess("");

    try {
      const url = await uploadFile(file, "flipsaura/documents");
      const currentDoc = (profile?.documents || []).find((d) => d.docType === docType) || {};

      const payload = {
        docType,
        frontUrl: side === "front" ? url : currentDoc.frontUrl || url,
        backUrl: side === "back" ? url : currentDoc.backUrl || "",
        fileUrl: url,
        fileType: file.type === "application/pdf" ? "pdf" : "image",
      };

      const { data } = await api.post("/api/vendor/document", payload);
      if (!data.ok) throw new Error(data.error);

      setProfile((prev) => ({ ...prev, documents: data.data.documents }));
      setCompletion(data.data.completion);
      setSuccess(`${docType.toUpperCase()} uploaded successfully!`);
    } catch (err) {
      setError(`Failed to upload document: ${err.message}`);
    } finally {
      setUploadingDoc((prev) => ({ ...prev, [docType]: false }));
    }
  };

  const savePortfolioItem = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        ...portfolioForm,
        videos: portfolioForm.videoUrl ? [portfolioForm.videoUrl] : [],
      };

      let res;
      if (editingPortfolioId) {
        res = await api.put(`/api/vendor/portfolio/${editingPortfolioId}`, payload);
      } else {
        res = await api.post("/api/vendor/portfolio", payload);
      }

      if (!res.data.ok) throw new Error(res.data.error);

      setProfile((prev) => ({ ...prev, portfolio: res.data.data.portfolio }));
      if (res.data.data.completion) setCompletion(res.data.data.completion);

      setPortfolioModalOpen(false);
      setEditingPortfolioId(null);
      setPortfolioForm({ title: "", category: "Wedding", serviceCategory: "", description: "", images: [], videoUrl: "" });
      setSuccess("Portfolio item saved successfully!");
    } catch (err) {
      setError(err.message || "Failed to save portfolio item.");
    } finally {
      setSaving(false);
    }
  };

  const deletePortfolioItem = async (id) => {
    if (!confirm("Are you sure you want to delete this portfolio item?")) return;
    try {
      const { data } = await api.delete(`/api/vendor/portfolio/${id}`);
      if (!data.ok) throw new Error(data.error);
      setProfile((prev) => ({ ...prev, portfolio: data.data.portfolio }));
      if (data.data.completion) setCompletion(data.data.completion);
      setSuccess("Portfolio item deleted.");
    } catch (err) {
      setError(err.message || "Failed to delete item.");
    }
  };

  const submitForVerification = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { data } = await api.post("/api/vendor/submit-verification");
      if (!data.ok) throw new Error(data.error);

      setCompletion(data.data.completion);
      setProfile((prev) => ({
        ...prev,
        verificationStatus: "under_review",
      }));
      setSuccess("🎉 Profile submitted for admin verification! Your status is now Under Review.");
      router.push("/vendor/dashboard");
    } catch (err) {
      setError(err.message || "Submission failed. Please complete all missing fields.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading" style={{ padding: 60, textAlign: "center" }}>Loading vendor onboarding profile...</div>;
  }

  const isBusiness = String(profileForm.vendorType).toLowerCase() === "business";

  // Document status lookup helper
  const getDoc = (type) => (profile?.documents || []).find((d) => d.docType === type);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26 }}>Vendor Profile & Verification</h1>
          <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 14 }}>
            Complete all profile sections and submit required KYC documents to unlock your vendor account.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={submitForVerification}
          disabled={!completion?.canSubmitForVerification || saving || profile?.verificationStatus === "approved"}
          style={{ padding: "10px 18px", fontSize: 14 }}
        >
          {profile?.verificationStatus === "approved"
            ? "✓ Account Approved"
            : profile?.verificationStatus === "under_review"
            ? "⏳ Under Review"
            : "Submit for Verification →"}
        </button>
      </div>

      {/* Profile Completion Bar Banner */}
      <div className="verification-banner banner-incomplete" style={{ marginBottom: 20, padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: "var(--pink-700)" }}>
            Profile Completion: {completion?.percentage || 0}%
          </span>
          <span className={`badge badge-${completion?.verificationStatus || "incomplete"}`}>
            Status: {completion?.verificationStatus?.replace("_", " ") || "Incomplete"}
          </span>
        </div>
        <div className="progress-container">
          <div className="progress-bar-fill" style={{ width: `${completion?.percentage || 0}%` }} />
        </div>

        {completion?.missingFields?.length > 0 && (
          <div style={{ marginTop: 10, fontSize: 13, color: "#854d0e" }}>
            <b>Pending requirements to unlock: </b>
            {completion.missingFields.slice(0, 5).join(" • ")}
            {completion.missingFields.length > 5 ? ` and ${completion.missingFields.length - 5} more` : ""}
          </div>
        )}
      </div>

      {error && (
        <div className="rejection-box" style={{ marginBottom: 16 }}>
          <b>⚠️ Notice: </b>{error}
        </div>
      )}

      {success && (
        <div style={{ background: "#e8f5e9", color: "#2e7d32", padding: "12px 16px", borderRadius: 8, marginBottom: 16, border: "1px solid #a5d6a7" }}>
          {success}
        </div>
      )}

      {/* Onboarding Navigation Tabs */}
      <div className="onboard-tabs">
        <button
          className={`onboard-tab ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          <span>👤</span> Basic Profile
        </button>
        <button
          className={`onboard-tab ${activeTab === "services" ? "active" : ""}`}
          onClick={() => setActiveTab("services")}
        >
          <span>✨</span> Services & Categories
        </button>
        <button
          className={`onboard-tab ${activeTab === "documents" ? "active" : ""}`}
          onClick={() => setActiveTab("documents")}
        >
          <span>📄</span> KYC Documents
        </button>
        <button
          className={`onboard-tab ${activeTab === "bank" ? "active" : ""}`}
          onClick={() => setActiveTab("bank")}
        >
          <span>🏦</span> Bank Details
        </button>
        <button
          className={`onboard-tab ${activeTab === "portfolio" ? "active" : ""}`}
          onClick={() => setActiveTab("portfolio")}
        >
          <span>🎨</span> Portfolio ({profile?.portfolio?.length || 0})
        </button>
        <button
          className={`onboard-tab ${activeTab === "verification" ? "active" : ""}`}
          onClick={() => setActiveTab("verification")}
        >
          <span>📋</span> Verification Checklist
        </button>
      </div>

      {/* TAB 1: BASIC PROFILE */}
      {activeTab === "profile" && (
        <form onSubmit={saveProfile} className="form-card" style={{ maxWidth: "100%", background: "#fff", padding: 24, borderRadius: 12, border: "1px solid #ebdbe2" }}>
          <h3 style={{ marginTop: 0, color: "var(--pink-700)" }}>Business & Contact Information</h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="field">
              <label>Business / Vendor Name *</label>
              <input
                required
                value={profileForm.businessName}
                onChange={(e) => setProfileForm({ ...profileForm, businessName: e.target.value })}
              />
            </div>

            <div className="field">
              <label>Owner / Contact Person Name *</label>
              <input
                required
                value={profileForm.ownerName}
                onChange={(e) => setProfileForm({ ...profileForm, ownerName: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="field">
              <label>Mobile Number *</label>
              <input
                required
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              />
            </div>

            <div className="field">
              <label>Vendor Type *</label>
              <select
                value={profileForm.vendorType}
                onChange={(e) => setProfileForm({ ...profileForm, vendorType: e.target.value })}
              >
                <option value="Individual">Individual (Freelancer / Sole Proprietor)</option>
                <option value="Business">Business (Registered Company / Agency)</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label>Business Address *</label>
            <input
              required
              value={profileForm.address}
              onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <div className="field">
              <label>City *</label>
              <input
                required
                value={profileForm.city}
                onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
              />
            </div>

            <div className="field">
              <label>State *</label>
              <input
                required
                value={profileForm.state}
                onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
              />
            </div>

            <div className="field">
              <label>PIN Code *</label>
              <input
                required
                value={profileForm.pincode}
                onChange={(e) => setProfileForm({ ...profileForm, pincode: e.target.value })}
              />
            </div>
          </div>

          <div className="field">
            <label>About Business / Bio</label>
            <textarea
              rows={3}
              placeholder="Tell couples about your wedding services, experience, and achievements..."
              value={profileForm.about}
              onChange={(e) => setProfileForm({ ...profileForm, about: e.target.value })}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="field">
              <label>Profile Photo / Business Logo</label>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  if (e.target.files?.[0]) {
                    const url = await uploadFile(e.target.files[0], "flipsaura/profiles");
                    setProfileForm((prev) => ({ ...prev, profilePhoto: url }));
                  }
                }}
              />
              {profileForm.profilePhoto && (
                <img src={profileForm.profilePhoto} alt="Profile" style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", marginTop: 8 }} />
              )}
            </div>

            <div className="field">
              <label>Cover Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  if (e.target.files?.[0]) {
                    const url = await uploadFile(e.target.files[0], "flipsaura/covers");
                    setProfileForm((prev) => ({ ...prev, coverPhoto: url }));
                  }
                }}
              />
              {profileForm.coverPhoto && (
                <img src={profileForm.coverPhoto} alt="Cover" style={{ width: 100, height: 50, borderRadius: 6, objectFit: "cover", marginTop: 8 }} />
              )}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: 12 }}>
            {saving ? "Saving Profile..." : "Save Profile Details"}
          </button>
        </form>
      )}

      {/* TAB 2: SERVICES & CATEGORIES */}
      {activeTab === "services" && (
        <form onSubmit={saveProfile} className="form-card" style={{ maxWidth: "100%", background: "#fff", padding: 24, borderRadius: 12, border: "1px solid #ebdbe2" }}>
          <h3 style={{ marginTop: 0, color: "var(--pink-700)" }}>Service Information & Wedding Category Selection</h3>
          <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 18 }}>
            Select all the wedding categories your business provides services for. FlipsAura offers 20 curated wedding categories.
          </p>

          <div className="field" style={{ marginBottom: 24 }}>
            <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Select Wedding Categories *</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
              {categories.map((cat) => {
                const checked = profileForm.categories.includes(cat._id);
                return (
                  <label
                    key={cat._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: checked ? "1px solid var(--pink-600)" : "1px solid #e5e7eb",
                      background: checked ? "var(--pink-50)" : "#fafafa",
                      cursor: "pointer",
                      fontSize: 14,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setProfileForm({ ...profileForm, categories: [...profileForm.categories, cat._id] });
                        } else {
                          setProfileForm({ ...profileForm, categories: profileForm.categories.filter((id) => id !== cat._id) });
                        }
                      }}
                    />
                    <span style={{ fontWeight: checked ? 600 : 400 }}>{cat.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="field">
            <label>Service Description *</label>
            <textarea
              required
              rows={4}
              placeholder="Detailed description of your wedding services, packages, team size, equipment, and offerings..."
              value={profileForm.serviceDescription}
              onChange={(e) => setProfileForm({ ...profileForm, serviceDescription: e.target.value })}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="field">
              <label>Starting Price (₹) *</label>
              <input
                required
                type="number"
                placeholder="e.g. 25000"
                value={profileForm.startingPrice}
                onChange={(e) => setProfileForm({ ...profileForm, startingPrice: e.target.value })}
              />
            </div>

            <div className="field">
              <label>Price Range / Pricing Model</label>
              <input
                placeholder="e.g. ₹25,000 - ₹1,50,000 per event"
                value={profileForm.priceRange}
                onChange={(e) => setProfileForm({ ...profileForm, priceRange: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="field">
              <label>Service Location / Cities Covered *</label>
              <input
                required
                placeholder="e.g. Jaipur, Udaipur, Delhi NCR, Destination Weddings"
                value={profileForm.serviceLocation}
                onChange={(e) => setProfileForm({ ...profileForm, serviceLocation: e.target.value })}
              />
            </div>

            <div className="field">
              <label>Experience (Years / Background) *</label>
              <input
                required
                placeholder="e.g. 5+ Years, 120+ Weddings handled"
                value={profileForm.experience}
                onChange={(e) => setProfileForm({ ...profileForm, experience: e.target.value })}
              />
            </div>
          </div>

          <div className="field">
            <label>Additional Services / Inclusions (Comma separated)</label>
            <input
              placeholder="e.g. Drone Shoots, Teaser Video, Album Printing, Same Day Edit"
              value={profileForm.additionalServicesStr}
              onChange={(e) => setProfileForm({ ...profileForm, additionalServicesStr: e.target.value })}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving Services..." : "Save Service Information"}
          </button>
        </form>
      )}

      {/* TAB 3: KYC DOCUMENTS */}
      {activeTab === "documents" && (
        <div>
          <div style={{ background: "var(--pink-50)", padding: 18, borderRadius: 10, marginBottom: 24, border: "1px solid var(--pink-200)" }}>
            <h4 style={{ margin: "0 0 6px", color: "var(--pink-700)" }}>Mandatory Verification Documents</h4>
            <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
              Please upload clear images or PDF copies of all mandatory documents. Our admin team verifies each document individually.
            </p>
          </div>

          {/* Document Cards List */}
          {[
            { type: "pan", title: "PAN Card", req: true, desc: "Personal or Company PAN Card" },
            { type: "aadhaar", title: "Aadhaar Card", req: true, desc: "Front and back image of Aadhaar Card" },
            { type: "cancelled_cheque", title: "Cancelled Cheque / Bank Proof", req: true, desc: "Cancelled cheque showing account number and IFSC, or passbook copy" },
            { type: "gst", title: "GST Certificate", req: isBusiness, desc: "Mandatory for registered businesses, optional for individuals" },
            { type: "business_reg", title: "Business Registration Certificate", req: isBusiness, desc: "MSME, Shop Act, Incorporation or Partnership deed (for businesses)" },
          ].map((item) => {
            const doc = getDoc(item.type);
            const status = doc?.status || "pending";
            const isUploading = uploadingDoc[item.type];

            return (
              <div key={item.type} className="doc-card">
                <div className="doc-header">
                  <div>
                    <h4 style={{ margin: 0, fontSize: 16 }}>
                      {item.title} {item.req ? <span style={{ color: "#e11d48" }}>*</span> : <span style={{ fontSize: 12, color: "#888" }}>(Conditional)</span>}
                    </h4>
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>{item.desc}</p>
                  </div>
                  <span className={`badge badge-${status}`}>
                    {status === "verified" ? "🟢 Verified" : status === "under_review" ? "🔵 Under Review" : status === "rejected" ? "🔴 Rejected" : "🟡 Pending"}
                  </span>
                </div>

                {status === "rejected" && doc?.rejectionReason && (
                  <div className="rejection-box">
                    <b>Admin Rejection Reason: </b> {doc.rejectionReason}
                    <div style={{ marginTop: 4, fontSize: 12 }}>Please re-upload a clearer or corrected copy below.</div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", marginTop: 12 }}>
                  {doc?.fileUrl && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-ghost"
                        style={{ fontSize: 13, padding: "6px 12px", border: "1px solid #ddd" }}
                      >
                        👁️ View Uploaded Document
                      </a>
                      {doc.uploadedAt && (
                        <span style={{ fontSize: 12, color: "#888" }}>
                          Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <label className="btn btn-ghost" style={{ cursor: "pointer", fontSize: 13, padding: "6px 14px", border: "1px dashed var(--pink-600)" }}>
                      {isUploading ? "Uploading..." : doc?.fileUrl ? "↻ Re-upload File" : "📤 Upload File (Image/PDF)"}
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        style={{ display: "none" }}
                        disabled={isUploading}
                        onChange={(e) => e.target.files?.[0] && handleDocUpload(item.type, e.target.files[0])}
                      />
                    </label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 4: BANK DETAILS */}
      {activeTab === "bank" && (
        <form onSubmit={saveBankDetails} className="form-card" style={{ maxWidth: "100%", background: "#fff", padding: 24, borderRadius: 12, border: "1px solid #ebdbe2" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: "var(--pink-700)" }}>Bank Account Details</h3>
            <span className={`badge badge-${profile?.bankDetails?.status || "pending"}`}>
              Status: {profile?.bankDetails?.status || "pending"}
            </span>
          </div>

          <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 20 }}>
            Bank account details are required for vendor booking payouts and settlements. Information is securely stored.
          </p>

          {profile?.bankDetails?.status === "rejected" && profile?.bankDetails?.rejectionReason && (
            <div className="rejection-box" style={{ marginBottom: 20 }}>
              <b>Bank Verification Rejected: </b> {profile.bankDetails.rejectionReason}
              <div style={{ marginTop: 4, fontSize: 12 }}>Please update your bank details and re-upload the cancelled cheque.</div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="field">
              <label>Account Holder Name *</label>
              <input
                required
                placeholder="Must match ID/Business Name"
                value={bankForm.accountHolderName}
                onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
              />
            </div>

            <div className="field">
              <label>Bank Name *</label>
              <input
                required
                placeholder="e.g. HDFC Bank, ICICI Bank, SBI"
                value={bankForm.bankName}
                onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="field">
              <label>Bank Account Number *</label>
              <input
                required
                placeholder="Enter complete bank account number"
                value={bankForm.accountNumber}
                onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
              />
            </div>

            <div className="field">
              <label>IFSC Code *</label>
              <input
                required
                placeholder="e.g. HDFC0001234"
                value={bankForm.ifscCode}
                onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value.toUpperCase() })}
              />
            </div>
          </div>

          <div className="field">
            <label>Cancelled Cheque / Bank Proof *</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={async (e) => {
                if (e.target.files?.[0]) {
                  const url = await uploadFile(e.target.files[0], "flipsaura/documents");
                  setBankForm((prev) => ({ ...prev, chequeUrl: url }));
                }
              }}
            />
            {bankForm.chequeUrl && (
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 12 }}>
                <a href={bankForm.chequeUrl} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ fontSize: 13 }}>
                  👁️ View Uploaded Cheque / Proof
                </a>
                <span style={{ fontSize: 12, color: "green" }}>✓ File attached</span>
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: 12 }}>
            {saving ? "Saving Bank Details..." : "Save Bank Details"}
          </button>
        </form>
      )}

      {/* TAB 5: PORTFOLIO */}
      {activeTab === "portfolio" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0 }}>Vendor Portfolio & Previous Work</h3>
              <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 13 }}>
                Upload photos and videos showcasing your wedding work to impress clients.
              </p>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => {
                setEditingPortfolioId(null);
                setPortfolioForm({ title: "", category: "Wedding", serviceCategory: "", description: "", images: [], videoUrl: "" });
                setPortfolioModalOpen(true);
              }}
            >
              + Add Portfolio Item
            </button>
          </div>

          {(!profile?.portfolio || profile.portfolio.length === 0) ? (
            <div style={{ background: "#fff", padding: 40, textAlign: "center", borderRadius: 12, border: "1px dashed #d1c4cb" }}>
              <span style={{ fontSize: 36 }}>📸</span>
              <h4>No Portfolio Items Yet</h4>
              <p style={{ color: "var(--muted)", maxWidth: 460, margin: "8px auto 16px", fontSize: 14 }}>
                Showcase your previous work, wedding shoots, decoration setups, or event highlights.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => setPortfolioModalOpen(true)}
              >
                + Add First Portfolio Project
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18 }}>
              {profile.portfolio.map((item) => (
                <div key={item._id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #ebdbe2", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
                  {item.images?.[0] ? (
                    <img src={item.images[0]} alt={item.title} style={{ width: "100%", height: 180, objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: 180, background: "var(--pink-100)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--pink-700)" }}>
                      🎬 Video Project
                    </div>
                  )}
                  <div style={{ padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <span className="badge" style={{ background: "var(--pink-100)", color: "var(--pink-700)" }}>
                        {item.category || "General"}
                      </span>
                      {item.images?.length > 1 && (
                        <span style={{ fontSize: 12, color: "#888" }}>+{item.images.length - 1} photos</span>
                      )}
                    </div>
                    <h4 style={{ margin: "8px 0 4px", fontSize: 16 }}>{item.title}</h4>
                    {item.description && <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 12px" }}>{item.description}</p>}

                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <button
                        className="btn btn-ghost"
                        style={{ fontSize: 12, padding: "4px 10px" }}
                        onClick={() => {
                          setEditingPortfolioId(item._id);
                          setPortfolioForm({
                            title: item.title,
                            category: item.category,
                            serviceCategory: item.serviceCategory?._id || item.serviceCategory || "",
                            description: item.description,
                            images: item.images || [],
                            videoUrl: item.videos?.[0] || "",
                          });
                          setPortfolioModalOpen(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-ghost"
                        style={{ fontSize: 12, padding: "4px 10px", color: "#c62828" }}
                        onClick={() => deletePortfolioItem(item._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add / Edit Portfolio Modal */}
          {portfolioModalOpen && (
            <div className="admin-modal-overlay" onClick={() => setPortfolioModalOpen(false)}>
              <div className="admin-modal-box" style={{ maxWidth: 580 }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ margin: 0 }}>{editingPortfolioId ? "Edit Portfolio Item" : "Add Portfolio Item"}</h3>
                  <button className="btn btn-ghost" onClick={() => setPortfolioModalOpen(false)}>✕</button>
                </div>

                <form onSubmit={savePortfolioItem}>
                  <div className="field">
                    <label>Project / Event Title *</label>
                    <input
                      required
                      placeholder="e.g. Royal Palace Wedding at Rambagh"
                      value={portfolioForm.title}
                      onChange={(e) => setPortfolioForm({ ...portfolioForm, title: e.target.value })}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div className="field">
                      <label>Category / Event Type</label>
                      <input
                        placeholder="e.g. Wedding, Pre-Wedding, Mehndi, Decor"
                        value={portfolioForm.category}
                        onChange={(e) => setPortfolioForm({ ...portfolioForm, category: e.target.value })}
                      />
                    </div>

                    <div className="field">
                      <label>Associated Service Category</label>
                      <select
                        value={portfolioForm.serviceCategory}
                        onChange={(e) => setPortfolioForm({ ...portfolioForm, serviceCategory: e.target.value })}
                      >
                        <option value="">-- Select Category --</option>
                        {categories.map((c) => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="field">
                    <label>Description</label>
                    <textarea
                      rows={2}
                      placeholder="Brief details about the event, theme, or setup..."
                      value={portfolioForm.description}
                      onChange={(e) => setPortfolioForm({ ...portfolioForm, description: e.target.value })}
                    />
                  </div>

                  <div className="field">
                    <label>Upload Photos (Multiple allowed)</label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        for (const file of files) {
                          const url = await uploadFile(file, "flipsaura/portfolio");
                          setPortfolioForm((prev) => ({ ...prev, images: [...prev.images, url] }));
                        }
                      }}
                    />
                    {portfolioForm.images.length > 0 && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                        {portfolioForm.images.map((imgUrl, idx) => (
                          <div key={idx} style={{ position: "relative" }}>
                            <img src={imgUrl} alt="prev" style={{ width: 60, height: 60, borderRadius: 6, objectFit: "cover" }} />
                            <button
                              type="button"
                              onClick={() => setPortfolioForm({ ...portfolioForm, images: portfolioForm.images.filter((_, i) => i !== idx) })}
                              style={{ position: "absolute", top: -6, right: -6, background: "red", color: "#fff", border: "none", borderRadius: "50%", width: 18, height: 18, fontSize: 10, cursor: "pointer" }}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="field">
                    <label>Video / Reel URL (YouTube, Vimeo, Cloudinary)</label>
                    <input
                      placeholder="https://..."
                      value={portfolioForm.videoUrl}
                      onChange={(e) => setPortfolioForm({ ...portfolioForm, videoUrl: e.target.value })}
                    />
                  </div>

                  <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 20 }}>
                    <button type="button" className="btn btn-ghost" onClick={() => setPortfolioModalOpen(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? "Saving..." : "Save to Portfolio"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: VERIFICATION CHECKLIST & SUBMISSION */}
      {activeTab === "verification" && (
        <div className="form-card" style={{ maxWidth: "100%", background: "#fff", padding: 28, borderRadius: 12, border: "1px solid #ebdbe2" }}>
          <h3 style={{ marginTop: 0, color: "var(--pink-700)" }}>Verification Checklist & Submission</h3>
          <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 20 }}>
            Ensure all requirements below are completed. Once submitted, your profile will be sent to the FlipsAura verification team for final review.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            <div style={{ padding: 16, borderRadius: 10, background: completion?.isProfileComplete ? "#f0fdf4" : "#fff8e1", border: "1px solid #ddd" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>{completion?.isProfileComplete ? "✅" : "⚠️"}</span>
                <div>
                  <h4 style={{ margin: 0 }}>Profile & Services</h4>
                  <span style={{ fontSize: 13, color: "var(--muted)" }}>
                    {completion?.isProfileComplete ? "All required details filled" : "Incomplete information"}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ padding: 16, borderRadius: 10, background: completion?.areDocumentsComplete ? "#f0fdf4" : "#fff8e1", border: "1px solid #ddd" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>{completion?.areDocumentsComplete ? "✅" : "⚠️"}</span>
                <div>
                  <h4 style={{ margin: 0 }}>Mandatory KYC Documents</h4>
                  <span style={{ fontSize: 13, color: "var(--muted)" }}>
                    {completion?.mandatoryUploaded} of {completion?.mandatoryTotal} mandatory documents uploaded
                  </span>
                </div>
              </div>
            </div>

            <div style={{ padding: 16, borderRadius: 10, background: completion?.areBankDetailsComplete ? "#f0fdf4" : "#fff8e1", border: "1px solid #ddd" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>{completion?.areBankDetailsComplete ? "✅" : "⚠️"}</span>
                <div>
                  <h4 style={{ margin: 0 }}>Bank Settlement Details</h4>
                  <span style={{ fontSize: 13, color: "var(--muted)" }}>
                    {completion?.areBankDetailsComplete ? "Account details & cheque attached" : "Incomplete bank details"}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ padding: 16, borderRadius: 10, background: profile?.verificationStatus === "approved" ? "#f0fdf4" : "#f0f7ff", border: "1px solid #ddd" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>{profile?.verificationStatus === "approved" ? "🟢" : "⏳"}</span>
                <div>
                  <h4 style={{ margin: 0 }}>Admin Approval</h4>
                  <span style={{ fontSize: 13, color: "var(--muted)" }}>
                    Status: {profile?.verificationStatus || "Pending"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {completion?.missingFields?.length > 0 ? (
            <div className="rejection-box" style={{ marginBottom: 24 }}>
              <h4 style={{ margin: "0 0 6px", color: "#9f1239" }}>Your profile cannot be submitted yet.</h4>
              <p style={{ margin: "0 0 8px", fontSize: 13 }}>Please provide the following required items:</p>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
                {completion.missingFields.map((f, idx) => (
                  <li key={idx} style={{ marginBottom: 3 }}>{f}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div style={{ background: "#f0fdf4", border: "1px solid #86efac", padding: 18, borderRadius: 10, marginBottom: 24, color: "#166534" }}>
              <h4 style={{ margin: "0 0 6px" }}>🎉 All requirements are complete!</h4>
              <p style={{ margin: 0, fontSize: 14 }}>
                You are ready to submit your application for Admin Verification.
              </p>
            </div>
          )}

          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <button
              className="btn btn-primary"
              onClick={submitForVerification}
              disabled={!completion?.canSubmitForVerification || saving || profile?.verificationStatus === "approved"}
              style={{ padding: "12px 24px", fontSize: 15 }}
            >
              {profile?.verificationStatus === "approved"
                ? "✓ Account Approved & Active"
                : profile?.verificationStatus === "under_review"
                ? "⏳ Submitted — Currently Under Review"
                : "Submit for Admin Verification →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
