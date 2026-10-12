"use client";
import { useEffect, useState } from "react";
import api from "@/api/axios";

export default function AdminVendors() {
  const [vendors, setVendors] = useState([]);
  const [counts, setCounts] = useState({ total: 0, underReview: 0, approved: 0, incomplete: 0, rejected: 0 });
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Detail Modal State
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [vendorDetail, setVendorDetail] = useState(null);
  const [detailTab, setDetailTab] = useState("profile");
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [showMaskedAccount, setShowMaskedAccount] = useState(true);

  // Rejection modal prompt state
  const [rejectPrompt, setRejectPrompt] = useState({
    open: false,
    type: "", // "vendor", "document", "bank"
    docType: "",
    title: "",
    reason: "",
  });

  const loadVendors = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus && filterStatus !== "all") params.append("status", filterStatus);
      if (search.trim()) params.append("search", search.trim());

      const { data } = await api.get(`/api/admin/vendors?${params.toString()}`);
      if (data.ok) {
        setVendors(data.data.vendors);
        if (data.data.counts) setCounts(data.data.counts);
      }
    } catch (err) {
      console.error("Failed to load vendors:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, [filterStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadVendors();
  };

  const openVendorDetail = async (id) => {
    setSelectedVendorId(id);
    setDetailTab("profile");
    setLoadingDetail(true);
    try {
      const { data } = await api.get(`/api/admin/vendors/${id}`);
      if (data.ok) {
        setVendorDetail(data.data);
      }
    } catch (err) {
      alert("Failed to load vendor details: " + err.message);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeVendorDetail = () => {
    setSelectedVendorId(null);
    setVendorDetail(null);
    loadVendors();
  };

  // Document verification action
  const handleReviewDocument = async (docType, action, rejectionReason = "") => {
    if (!selectedVendorId) return;
    setActionBusy(true);
    try {
      const { data } = await api.put(`/api/admin/vendors/${selectedVendorId}/documents/${docType}`, {
        action,
        rejectionReason,
      });
      if (!data.ok) throw new Error(data.error);

      // Refresh detail
      const res = await api.get(`/api/admin/vendors/${selectedVendorId}`);
      if (res.data.ok) setVendorDetail(res.data.data);

      setRejectPrompt({ open: false, type: "", docType: "", title: "", reason: "" });
    } catch (err) {
      alert("Action failed: " + err.message);
    } finally {
      setActionBusy(false);
    }
  };

  // Bank verification action
  const handleReviewBank = async (action, rejectionReason = "") => {
    if (!selectedVendorId) return;
    setActionBusy(true);
    try {
      const { data } = await api.put(`/api/admin/vendors/${selectedVendorId}/bank-details`, {
        action,
        rejectionReason,
      });
      if (!data.ok) throw new Error(data.error);

      const res = await api.get(`/api/admin/vendors/${selectedVendorId}`);
      if (res.data.ok) setVendorDetail(res.data.data);

      setRejectPrompt({ open: false, type: "", docType: "", title: "", reason: "" });
    } catch (err) {
      alert("Action failed: " + err.message);
    } finally {
      setActionBusy(false);
    }
  };

  // Final vendor status update
  const handleUpdateVendorStatus = async (status, rejectionReason = "") => {
    const vendorId = selectedVendorId;
    if (!vendorId) return;
    setActionBusy(true);
    try {
      const { data } = await api.put(`/api/admin/vendors/${vendorId}/status`, {
        status,
        rejectionReason,
      });
      if (!data.ok) throw new Error(data.error);

      // Refresh detail
      const res = await api.get(`/api/admin/vendors/${vendorId}`);
      if (res.data.ok) setVendorDetail(res.data.data);

      setRejectPrompt({ open: false, type: "", docType: "", title: "", reason: "" });
      alert(`Vendor status updated to ${status.toUpperCase()} successfully.`);
    } catch (err) {
      alert("Status update failed: " + err.message);
    } finally {
      setActionBusy(false);
    }
  };

  // Mask bank account number
  const formatAccountNumber = (acc) => {
    if (!acc) return "—";
    if (!showMaskedAccount) return acc;
    if (acc.length <= 4) return acc;
    return "••••••••" + acc.slice(-4);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0 }}>Vendor Management</h1>
          <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 14 }}>
            Review vendor registrations, verify KYC & bank documents, and approve vendor dashboard access.
          </p>
        </div>
      </div>

      {/* High-level status cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, marginBottom: 24 }}>
        <div style={{ background: "#fff", padding: 16, borderRadius: 10, border: "1px solid #ebdbe2" }}>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>Total Vendors</div>
          <b style={{ fontSize: 24, color: "var(--ink)" }}>{counts.total}</b>
        </div>
        <div style={{ background: "#eff6ff", padding: 16, borderRadius: 10, border: "1px solid #bfdbfe" }}>
          <div style={{ fontSize: 13, color: "#1e40af" }}>Under Review</div>
          <b style={{ fontSize: 24, color: "#1d4ed8" }}>{counts.underReview}</b>
        </div>
        <div style={{ background: "#f0fdf4", padding: 16, borderRadius: 10, border: "1px solid #bbf7d0" }}>
          <div style={{ fontSize: 13, color: "#166534" }}>Approved Vendors</div>
          <b style={{ fontSize: 24, color: "#15803d" }}>{counts.approved}</b>
        </div>
        <div style={{ background: "#fffbeb", padding: 16, borderRadius: 10, border: "1px solid #fef08a" }}>
          <div style={{ fontSize: 13, color: "#854d0e" }}>Incomplete Profiles</div>
          <b style={{ fontSize: 24, color: "#b45309" }}>{counts.incomplete}</b>
        </div>
        <div style={{ background: "#fff1f2", padding: 16, borderRadius: 10, border: "1px solid #fecdd3" }}>
          <div style={{ fontSize: 13, color: "#9f1239" }}>Rejected</div>
          <b style={{ fontSize: 24, color: "#be123c" }}>{counts.rejected}</b>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
          {[
            { id: "all", label: "All Vendors" },
            { id: "under_review", label: `Under Review (${counts.underReview})` },
            { id: "approved", label: `Approved (${counts.approved})` },
            { id: "profile_incomplete", label: "Incomplete" },
            { id: "rejected", label: "Rejected" },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`btn ${filterStatus === tab.id ? "btn-primary" : "btn-ghost"}`}
              style={{ fontSize: 13, padding: "7px 14px" }}
              onClick={() => setFilterStatus(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: 8 }}>
          <input
            placeholder="Search vendor, city, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, minWidth: 220 }}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: "8px 14px", fontSize: 13 }}>
            Search
          </button>
        </form>
      </div>

      {/* Vendors Table */}
      {loading ? (
        <div className="loading" style={{ padding: 40, textAlign: "center" }}>Loading vendors...</div>
      ) : vendors.length === 0 ? (
        <div style={{ background: "#fff", padding: 40, textAlign: "center", borderRadius: 12, border: "1px dashed #d1c4cb" }}>
          <p style={{ color: "var(--muted)", margin: 0 }}>No vendors match the current filter.</p>
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #ebdbe2", overflow: "hidden" }}>
          <table className="data" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Vendor / Business</th>
                <th>Type</th>
                <th>City</th>
                <th>Categories</th>
                <th>Completion</th>
                <th>KYC Status</th>
                <th>Bank Status</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((v) => (
                <tr key={v._id}>
                  <td>
                    <b>{v.businessName}</b>
                    <br />
                    <small style={{ color: "#666" }}>{v.ownerName} • {v.phone || v.email}</small>
                  </td>
                  <td>
                    <span className="badge" style={{ background: "#f3f4f6", color: "#374151" }}>
                      {v.vendorType}
                    </span>
                  </td>
                  <td>{v.city}</td>
                  <td>
                    <small style={{ color: "var(--pink-700)", fontWeight: 500 }}>
                      {v.categories?.length > 0 ? v.categories.slice(0, 2).join(", ") + (v.categories.length > 2 ? ` +${v.categories.length - 2}` : "") : "—"}
                    </small>
                  </td>
                  <td style={{ minWidth: 110 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{v.completionPercentage}%</span>
                      <div style={{ flex: 1, height: 6, background: "#f0e6eb", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${v.completionPercentage}%`, background: "var(--pink-600)" }} />
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${v.kycStatus}`}>
                      {v.kycStatus === "verified" ? "🟢 Verified" : v.kycStatus === "rejected" ? "🔴 Rejected" : v.kycStatus === "under_review" ? "🔵 Review" : "🟡 Pending"}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${v.bankStatus}`}>
                      {v.bankStatus === "verified" ? "🟢 Verified" : v.bankStatus === "rejected" ? "🔴 Rejected" : v.bankStatus === "under_review" ? "🔵 Review" : "🟡 Pending"}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${v.verificationStatus}`}>
                      {v.approved ? "🟢 Approved" : v.verificationStatus?.replace("_", " ")}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        className="btn btn-primary"
                        style={{ fontSize: 12, padding: "5px 10px" }}
                        onClick={() => openVendorDetail(v._id)}
                      >
                        Review
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================= */}
      {/* VENDOR DETAIL & VERIFICATION MODAL                        */}
      {/* ========================================================= */}
      {selectedVendorId && (
        <div className="admin-modal-overlay" onClick={closeVendorDetail}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            {loadingDetail || !vendorDetail ? (
              <div style={{ padding: 40, textAlign: "center" }}>Loading vendor verification file...</div>
            ) : (
              <div>
                {/* Modal Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <h2 style={{ margin: 0, fontSize: 22 }}>
                        {vendorDetail.vendor.vendorProfile?.businessName || vendorDetail.vendor.name}
                      </h2>
                      <span className={`badge badge-${vendorDetail.vendor.vendorProfile?.verificationStatus || "incomplete"}`}>
                        {vendorDetail.vendor.vendorProfile?.approved ? "🟢 APPROVED" : vendorDetail.vendor.vendorProfile?.verificationStatus?.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                    <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 13 }}>
                      Contact: {vendorDetail.vendor.name} • {vendorDetail.vendor.email} • {vendorDetail.vendor.phone || "No phone"} • Registered on {new Date(vendorDetail.vendor.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button className="btn btn-ghost" onClick={closeVendorDetail} style={{ fontSize: 18 }}>✕</button>
                </div>

                {/* Progress bar inside modal */}
                <div style={{ background: "var(--pink-50)", padding: 14, borderRadius: 8, marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                    <b>Profile Completion Score: {vendorDetail.completion?.percentage}%</b>
                    <span>Mandatory KYC: {vendorDetail.completion?.mandatoryUploaded} / {vendorDetail.completion?.mandatoryTotal} uploaded</span>
                  </div>
                  <div className="progress-container" style={{ height: 8, margin: 0 }}>
                    <div className="progress-bar-fill" style={{ width: `${vendorDetail.completion?.percentage}%` }} />
                  </div>
                </div>

                {/* Modal Navigation Tabs */}
                <div className="onboard-tabs" style={{ marginBottom: 20 }}>
                  <button className={`onboard-tab ${detailTab === "profile" ? "active" : ""}`} onClick={() => setDetailTab("profile")}>
                    👤 Profile & Business
                  </button>
                  <button className={`onboard-tab ${detailTab === "services" ? "active" : ""}`} onClick={() => setDetailTab("services")}>
                    ✨ Services ({vendorDetail.vendor.vendorProfile?.categories?.length || 0})
                  </button>
                  <button className={`onboard-tab ${detailTab === "documents" ? "active" : ""}`} onClick={() => setDetailTab("documents")}>
                    📄 KYC Documents ({vendorDetail.vendor.vendorProfile?.documents?.length || 0})
                  </button>
                  <button className={`onboard-tab ${detailTab === "bank" ? "active" : ""}`} onClick={() => setDetailTab("bank")}>
                    🏦 Bank Details
                  </button>
                  <button className={`onboard-tab ${detailTab === "portfolio" ? "active" : ""}`} onClick={() => setDetailTab("portfolio")}>
                    🎨 Portfolio ({vendorDetail.vendor.vendorProfile?.portfolio?.length || 0})
                  </button>
                  <button className={`onboard-tab ${detailTab === "activity" ? "active" : ""}`} onClick={() => setDetailTab("activity")}>
                    📦 Items & Bookings ({vendorDetail.items?.length || 0})
                  </button>
                </div>

                {/* DETAIL TAB 1: PROFILE */}
                {detailTab === "profile" && (
                  <div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div><b>Business Name:</b> {vendorDetail.vendor.vendorProfile?.businessName || "—"}</div>
                      <div><b>Owner / Contact:</b> {vendorDetail.vendor.vendorProfile?.ownerName || vendorDetail.vendor.name}</div>
                      <div><b>Vendor Type:</b> {vendorDetail.vendor.vendorProfile?.vendorType || "Individual"}</div>
                      <div><b>Mobile Phone:</b> {vendorDetail.vendor.phone || "—"}</div>
                      <div><b>Email:</b> {vendorDetail.vendor.email}</div>
                      <div><b>Address:</b> {vendorDetail.vendor.vendorProfile?.address || "—"}</div>
                      <div><b>City, State:</b> {vendorDetail.vendor.vendorProfile?.city || "—"}, {vendorDetail.vendor.vendorProfile?.state || "—"}</div>
                      <div><b>PIN Code:</b> {vendorDetail.vendor.vendorProfile?.pincode || "—"}</div>
                    </div>

                    <div style={{ marginTop: 16 }}>
                      <b>About / Bio:</b>
                      <p style={{ marginTop: 4, color: "var(--muted)", background: "#fafafa", padding: 12, borderRadius: 8 }}>
                        {vendorDetail.vendor.vendorProfile?.about || "No bio provided."}
                      </p>
                    </div>

                    {(vendorDetail.vendor.vendorProfile?.profilePhoto || vendorDetail.vendor.vendorProfile?.coverPhoto) && (
                      <div style={{ display: "flex", gap: 20, marginTop: 16 }}>
                        {vendorDetail.vendor.vendorProfile?.profilePhoto && (
                          <div>
                            <div style={{ fontSize: 12, marginBottom: 4 }}><b>Logo / Profile Photo</b></div>
                            <img src={vendorDetail.vendor.vendorProfile.profilePhoto} alt="Logo" style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover" }} />
                          </div>
                        )}
                        {vendorDetail.vendor.vendorProfile?.coverPhoto && (
                          <div>
                            <div style={{ fontSize: 12, marginBottom: 4 }}><b>Cover Photo</b></div>
                            <img src={vendorDetail.vendor.vendorProfile.coverPhoto} alt="Cover" style={{ width: 160, height: 80, borderRadius: 8, objectFit: "cover" }} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* DETAIL TAB 2: SERVICES */}
                {detailTab === "services" && (
                  <div>
                    <div style={{ marginBottom: 16 }}>
                      <b>Selected Wedding Categories:</b>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                        {(vendorDetail.vendor.vendorProfile?.categories || []).map((cat) => (
                          <span key={cat._id || cat} className="badge" style={{ background: "var(--pink-100)", color: "var(--pink-700)" }}>
                            {cat.name || cat}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                      <div><b>Starting Price:</b> ₹{Number(vendorDetail.vendor.vendorProfile?.startingPrice || 0).toLocaleString("en-IN")}</div>
                      <div><b>Price Range:</b> {vendorDetail.vendor.vendorProfile?.priceRange || "—"}</div>
                      <div><b>Service Location:</b> {vendorDetail.vendor.vendorProfile?.serviceLocation || "—"}</div>
                      <div><b>Experience:</b> {vendorDetail.vendor.vendorProfile?.experience || "—"}</div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <b>Service Description:</b>
                      <p style={{ marginTop: 4, color: "var(--muted)", background: "#fafafa", padding: 12, borderRadius: 8 }}>
                        {vendorDetail.vendor.vendorProfile?.serviceDescription || "—"}
                      </p>
                    </div>

                    {vendorDetail.vendor.vendorProfile?.additionalServices?.length > 0 && (
                      <div>
                        <b>Additional Services / Inclusions:</b>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                          {vendorDetail.vendor.vendorProfile.additionalServices.map((s, idx) => (
                            <span key={idx} className="badge" style={{ background: "#f3f4f6", color: "#374151" }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* DETAIL TAB 3: KYC DOCUMENTS (VERIFY / REJECT INDIVIDUALLY) */}
                {detailTab === "documents" && (
                  <div>
                    <div style={{ marginBottom: 14, fontSize: 13, color: "var(--muted)" }}>
                      Review each mandatory and conditional document uploaded by the vendor. You can verify or reject them individually.
                    </div>

                    {(!vendorDetail.vendor.vendorProfile?.documents || vendorDetail.vendor.vendorProfile.documents.length === 0) ? (
                      <p style={{ color: "var(--muted)" }}>No documents have been uploaded yet.</p>
                    ) : (
                      vendorDetail.vendor.vendorProfile.documents.map((doc) => (
                        <div key={doc.docType} className="doc-card">
                          <div className="doc-header">
                            <div>
                              <h4 style={{ margin: 0 }}>{doc.name} ({doc.docType?.toUpperCase()})</h4>
                              <span style={{ fontSize: 12, color: "#888" }}>
                                Uploaded on {new Date(doc.uploadedAt).toLocaleDateString()}
                              </span>
                            </div>
                            <span className={`badge badge-${doc.status}`}>
                              {doc.status === "verified" ? "🟢 Verified" : doc.status === "rejected" ? "🔴 Rejected" : "🔵 Under Review"}
                            </span>
                          </div>

                          {doc.rejectionReason && (
                            <div className="rejection-box">
                              <b>Rejection Reason:</b> {doc.rejectionReason}
                            </div>
                          )}

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, flexWrap: "wrap", gap: 10 }}>
                            <div style={{ display: "flex", gap: 10 }}>
                              {doc.fileUrl && (
                                <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ fontSize: 13 }}>
                                  👁️ View File Preview
                                </a>
                              )}
                              {doc.frontUrl && doc.frontUrl !== doc.fileUrl && (
                                <a href={doc.frontUrl} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ fontSize: 13 }}>
                                  Front Image
                                </a>
                              )}
                              {doc.backUrl && (
                                <a href={doc.backUrl} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ fontSize: 13 }}>
                                  Back Image
                                </a>
                              )}
                            </div>

                            {/* Verification Actions */}
                            <div style={{ display: "flex", gap: 8 }}>
                              <button
                                className="btn btn-primary"
                                style={{ background: "#16a34a", fontSize: 12, padding: "6px 14px" }}
                                disabled={actionBusy || doc.status === "verified"}
                                onClick={() => handleReviewDocument(doc.docType, "verify")}
                              >
                                ✓ Verify Document
                              </button>
                              <button
                                className="btn btn-ghost"
                                style={{ color: "#dc2626", border: "1px solid #fca5a5", fontSize: 12, padding: "6px 14px" }}
                                disabled={actionBusy}
                                onClick={() => setRejectPrompt({
                                  open: true,
                                  type: "document",
                                  docType: doc.docType,
                                  title: `Reject Document: ${doc.name}`,
                                  reason: "",
                                })}
                              >
                                ✕ Reject with Reason
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* DETAIL TAB 4: BANK DETAILS */}
                {detailTab === "bank" && (
                  <div style={{ background: "#fafafa", padding: 20, borderRadius: 10, border: "1px solid #ebdbe2" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <h4 style={{ margin: 0 }}>Vendor Settlement Bank Account</h4>
                      <span className={`badge badge-${vendorDetail.vendor.vendorProfile?.bankDetails?.status || "pending"}`}>
                        {vendorDetail.vendor.vendorProfile?.bankDetails?.status || "pending"}
                      </span>
                    </div>

                    {vendorDetail.vendor.vendorProfile?.bankDetails?.rejectionReason && (
                      <div className="rejection-box" style={{ marginBottom: 16 }}>
                        <b>Bank Rejection Reason:</b> {vendorDetail.vendor.vendorProfile.bankDetails.rejectionReason}
                      </div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                      <div><b>Account Holder Name:</b> {vendorDetail.vendor.vendorProfile?.bankDetails?.accountHolderName || "—"}</div>
                      <div><b>Bank Name:</b> {vendorDetail.vendor.vendorProfile?.bankDetails?.bankName || "—"}</div>
                      <div>
                        <b>Account Number:</b> {formatAccountNumber(vendorDetail.vendor.vendorProfile?.bankDetails?.accountNumber)}
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ fontSize: 11, padding: "2px 6px", marginLeft: 8 }}
                          onClick={() => setShowMaskedAccount(!showMaskedAccount)}
                        >
                          {showMaskedAccount ? "👁️ Reveal" : "🔒 Mask"}
                        </button>
                      </div>
                      <div><b>IFSC Code:</b> {vendorDetail.vendor.vendorProfile?.bankDetails?.ifscCode || "—"}</div>
                    </div>

                    {vendorDetail.vendor.vendorProfile?.bankDetails?.chequeUrl && (
                      <div style={{ marginBottom: 18 }}>
                        <b>Cancelled Cheque / Bank Proof: </b>
                        <a href={vendorDetail.vendor.vendorProfile.bankDetails.chequeUrl} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ fontSize: 13, marginLeft: 8 }}>
                          👁️ View Cheque Proof
                        </a>
                      </div>
                    )}

                    {/* Bank Verification Action Buttons */}
                    <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                      <button
                        className="btn btn-primary"
                        style={{ background: "#16a34a", fontSize: 12, padding: "6px 14px" }}
                        disabled={actionBusy || vendorDetail.vendor.vendorProfile?.bankDetails?.status === "verified"}
                        onClick={() => handleReviewBank("verify")}
                      >
                        ✓ Verify Bank Details
                      </button>
                      <button
                        className="btn btn-ghost"
                        style={{ color: "#dc2626", border: "1px solid #fca5a5", fontSize: 12, padding: "6px 14px" }}
                        disabled={actionBusy}
                        onClick={() => setRejectPrompt({
                          open: true,
                          type: "bank",
                          docType: "",
                          title: "Reject Bank Details",
                          reason: "",
                        })}
                      >
                        ✕ Reject Bank Details
                      </button>
                    </div>
                  </div>
                )}

                {/* DETAIL TAB 5: PORTFOLIO */}
                {detailTab === "portfolio" && (
                  <div>
                    {(!vendorDetail.vendor.vendorProfile?.portfolio || vendorDetail.vendor.vendorProfile.portfolio.length === 0) ? (
                      <p style={{ color: "var(--muted)" }}>No portfolio projects uploaded by this vendor.</p>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
                        {vendorDetail.vendor.vendorProfile.portfolio.map((item) => (
                          <div key={item._id} style={{ border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}>
                            {item.images?.[0] ? (
                              <img src={item.images[0]} alt={item.title} style={{ width: "100%", height: 130, objectFit: "cover" }} />
                            ) : (
                              <div style={{ height: 130, background: "#eee", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                🎬 Video
                              </div>
                            )}
                            <div style={{ padding: 10 }}>
                              <b style={{ fontSize: 14 }}>{item.title}</b>
                              <div style={{ fontSize: 12, color: "var(--pink-700)" }}>{item.category}</div>
                              {item.description && <p style={{ fontSize: 12, color: "#666", margin: "4px 0" }}>{item.description}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* DETAIL TAB 6: ITEMS & BOOKINGS */}
                {detailTab === "activity" && (
                  <div>
                    <h4>Listed Items / Services ({vendorDetail.items?.length || 0})</h4>
                    {vendorDetail.items?.length === 0 ? (
                      <p style={{ color: "var(--muted)", fontSize: 13 }}>No items created yet.</p>
                    ) : (
                      <table className="data" style={{ marginBottom: 20 }}>
                        <thead><tr><th>Title</th><th>Category</th><th>Price</th><th>City</th><th>Active</th></tr></thead>
                        <tbody>
                          {vendorDetail.items.map((it) => (
                            <tr key={it._id}>
                              <td>{it.title}</td>
                              <td>{it.category?.name || "—"}</td>
                              <td>₹{it.price?.toLocaleString("en-IN")}</td>
                              <td>{it.city}</td>
                              <td>{it.active ? "Yes" : "No"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    <h4>Recent Bookings ({vendorDetail.bookings?.length || 0})</h4>
                    {vendorDetail.bookings?.length === 0 ? (
                      <p style={{ color: "var(--muted)", fontSize: 13 }}>No bookings recorded yet.</p>
                    ) : (
                      <table className="data">
                        <thead><tr><th>Customer</th><th>Event Date</th><th>Amount</th><th>Status</th></tr></thead>
                        <tbody>
                          {vendorDetail.bookings.map((b) => (
                            <tr key={b._id}>
                              <td>{b.name} ({b.phone})</td>
                              <td>{b.eventDate}</td>
                              <td>₹{b.amount?.toLocaleString("en-IN")}</td>
                              <td><span className={`tag ${b.status}`}>{b.status}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {/* ========================================================= */}
                {/* FINAL ADMIN APPROVAL / DECISION ACTION BAR                */}
                {/* ========================================================= */}
                <div className="admin-action-bar">
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, color: "var(--muted)" }}>
                      Vendor Status: <b>{vendorDetail.vendor.vendorProfile?.approved ? "Approved" : vendorDetail.vendor.vendorProfile?.verificationStatus}</b>
                    </span>
                  </div>

                  {!vendorDetail.vendor.vendorProfile?.approved ? (
                    <button
                      className="btn btn-primary"
                      style={{ background: "#16a34a", padding: "10px 20px", fontSize: 14 }}
                      disabled={actionBusy}
                      onClick={() => {
                        if (confirm(`Approve ${vendorDetail.vendor.vendorProfile?.businessName || vendorDetail.vendor.name}? This will immediately unlock all vendor dashboard features.`)) {
                          handleUpdateVendorStatus("approved");
                        }
                      }}
                    >
                      ✓ Approve Vendor & Unlock Dashboard
                    </button>
                  ) : (
                    <button
                      className="btn btn-ghost"
                      style={{ color: "#d97706", border: "1px solid #fcd34d", padding: "8px 16px" }}
                      disabled={actionBusy}
                      onClick={() => handleUpdateVendorStatus("suspended")}
                    >
                      Suspend Vendor
                    </button>
                  )}

                  <button
                    className="btn btn-ghost"
                    style={{ color: "#dc2626", border: "1px solid #fca5a5", padding: "8px 16px" }}
                    disabled={actionBusy}
                    onClick={() => setRejectPrompt({
                      open: true,
                      type: "vendor",
                      docType: "",
                      title: "Reject Vendor Application",
                      reason: "",
                    })}
                  >
                    ✕ Reject Application
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* REJECTION REASON PROMPT MODAL (MANDATORY REJECTION REASON) */}
      {/* ========================================================= */}
      {rejectPrompt.open && (
        <div className="admin-modal-overlay" style={{ zIndex: 10000 }}>
          <div className="admin-modal-box" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 8px", color: "#b91c1c" }}>{rejectPrompt.title}</h3>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 16px" }}>
              Please state clearly why this item is being rejected. The vendor will see this exact message on their dashboard to re-upload.
            </p>

            <div className="field">
              <label>Rejection Reason *</label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Uploaded document is blurred. Please upload a clear original copy."
                value={rejectPrompt.reason}
                onChange={(e) => setRejectPrompt({ ...rejectPrompt, reason: e.target.value })}
              />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 18 }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setRejectPrompt({ open: false, type: "", docType: "", title: "", reason: "" })}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn btn-primary"
                style={{ background: "#dc2626" }}
                disabled={!rejectPrompt.reason.trim() || actionBusy}
                onClick={() => {
                  if (rejectPrompt.type === "document") {
                    handleReviewDocument(rejectPrompt.docType, "reject", rejectPrompt.reason);
                  } else if (rejectPrompt.type === "bank") {
                    handleReviewBank("reject", rejectPrompt.reason);
                  } else if (rejectPrompt.type === "vendor") {
                    handleUpdateVendorStatus("rejected", rejectPrompt.reason);
                  }
                }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
