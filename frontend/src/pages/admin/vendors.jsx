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

      // Refresh detail & list
      const res = await api.get(`/api/admin/vendors/${vendorId}`);
      if (res.data.ok) setVendorDetail(res.data.data);
      loadVendors();

      setRejectPrompt({ open: false, type: "", docType: "", title: "", reason: "" });
      alert(`Vendor status updated to ${status.toUpperCase()} successfully.`);
    } catch (err) {
      alert("Status update failed: " + err.message);
    } finally {
      setActionBusy(false);
    }
  };

  // Quick 1-click vendor approval from table
  const handleQuickApprove = async (vendorId, businessName = "") => {
    setActionBusy(true);
    try {
      const { data } = await api.put(`/api/admin/vendors/${vendorId}/status`, {
        status: "approved",
      });
      if (!data.ok) throw new Error(data.error);
      await loadVendors();
      alert(`Vendor ${businessName ? `"${businessName}"` : ""} approved and dashboard unlocked successfully.`);
    } catch (err) {
      alert("Approval failed: " + err.message);
    } finally {
      setActionBusy(false);
    }
  };

  const formatAccountNumber = (acc) => {
    if (!acc) return "—";
    if (!showMaskedAccount) return acc;
    if (acc.length <= 4) return acc;
    return "••••••••" + acc.slice(-4);
  };

  const getBadgeStyle = (status) => {
    switch (status) {
      case "verified":
      case "approved":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "rejected":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "under_review":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">Vendor Management</h1>
        <p className="text-sm text-muted mt-0.5">
          Review vendor registrations, verify KYC & bank documents, and approve vendor dashboard access.
        </p>
      </div>

      {/* High-level status cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-brand-100 shadow-sm flex flex-col justify-between">
          <div className="text-xs text-muted font-semibold uppercase tracking-wider">Total Vendors</div>
          <b className="text-2xl sm:text-3xl font-extrabold text-ink mt-2 font-sans">{counts.total}</b>
        </div>
        <div className="bg-blue-50/70 p-4 sm:p-5 rounded-2xl border border-blue-200 shadow-sm flex flex-col justify-between">
          <div className="text-xs text-blue-800 font-semibold uppercase tracking-wider">Under Review</div>
          <b className="text-2xl sm:text-3xl font-extrabold text-blue-700 mt-2 font-sans">{counts.underReview}</b>
        </div>
        <div className="bg-emerald-50/70 p-4 sm:p-5 rounded-2xl border border-emerald-200 shadow-sm flex flex-col justify-between">
          <div className="text-xs text-emerald-800 font-semibold uppercase tracking-wider">Approved</div>
          <b className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-2 font-sans">{counts.approved}</b>
        </div>
        <div className="bg-amber-50/70 p-4 sm:p-5 rounded-2xl border border-amber-200 shadow-sm flex flex-col justify-between">
          <div className="text-xs text-amber-800 font-semibold uppercase tracking-wider">Incomplete</div>
          <b className="text-2xl sm:text-3xl font-extrabold text-amber-700 mt-2 font-sans">{counts.incomplete}</b>
        </div>
        <div className="bg-rose-50/70 p-4 sm:p-5 rounded-2xl border border-rose-200 shadow-sm flex flex-col justify-between">
          <div className="text-xs text-rose-800 font-semibold uppercase tracking-wider">Rejected</div>
          <b className="text-2xl sm:text-3xl font-extrabold text-rose-700 mt-2 font-sans">{counts.rejected}</b>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-brand-100 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "all", label: "All Vendors" },
            { id: "under_review", label: `Under Review (${counts.underReview})` },
            { id: "approved", label: `Approved (${counts.approved})` },
            { id: "profile_incomplete", label: "Incomplete" },
            { id: "rejected", label: "Rejected" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                filterStatus === tab.id
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-surface text-ink/75 hover:bg-brand-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full lg:w-auto">
          <input
            placeholder="Search vendor, city, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 lg:w-64 px-3.5 py-1.5 rounded-xl border border-brand-200 text-xs text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <button
            type="submit"
            className="px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* Vendors Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-brand-100 p-12 text-center text-muted">
          <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm">Loading vendors...</p>
        </div>
      ) : vendors.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-brand-200">
          <p className="text-muted text-sm">No vendors match the current filter.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-brand-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-ink/80">
              <thead className="bg-surface text-[11px] font-bold text-muted uppercase tracking-wider border-b border-brand-100">
                <tr>
                  <th className="px-4 py-3.5">Vendor / Business</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">City</th>
                  <th className="px-4 py-3.5">Categories</th>
                  <th className="px-4 py-3.5">Completion</th>
                  <th className="px-4 py-3.5">KYC Status</th>
                  <th className="px-4 py-3.5">Bank Status</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100/70">
                {vendors.map((v) => (
                  <tr key={v._id} className="hover:bg-brand-50/30 transition-colors">
                    <td className="px-4 py-3.5">
                      <b className="text-ink font-semibold">{v.businessName}</b>
                      <div className="text-[11px] text-muted mt-0.5">
                        {v.ownerName} • {v.phone || v.email}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-surface text-ink/80 border border-brand-100">
                        {v.vendorType}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-ink/75">{v.city}</td>
                    <td className="px-4 py-3.5 text-xs text-brand-700 font-medium">
                      {v.categories?.length > 0
                        ? v.categories.slice(0, 2).join(", ") + (v.categories.length > 2 ? ` +${v.categories.length - 2}` : "")
                        : "—"}
                    </td>
                    <td className="px-4 py-3.5 min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-ink">{v.completionPercentage}%</span>
                        <div className="flex-1 h-1.5 bg-brand-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-600 rounded-full"
                            style={{ width: `${v.completionPercentage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold border ${getBadgeStyle(v.kycStatus)}`}>
                        {v.kycStatus === "verified" ? "🟢 Verified" : v.kycStatus === "rejected" ? "🔴 Rejected" : v.kycStatus === "under_review" ? "🔵 Review" : "🟡 Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold border ${getBadgeStyle(v.bankStatus)}`}>
                        {v.bankStatus === "verified" ? "🟢 Verified" : v.bankStatus === "rejected" ? "🔴 Rejected" : v.bankStatus === "under_review" ? "🔵 Review" : "🟡 Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold border capitalize ${getBadgeStyle(v.approved ? "approved" : v.verificationStatus)}`}>
                        {v.approved ? "🟢 Approved" : v.verificationStatus?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openVendorDetail(v._id)}
                          className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm transition"
                        >
                          Review
                        </button>
                        {!v.approved && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Approve ${v.businessName || v.ownerName}? This will verify all documents and immediately unlock their dashboard.`)) {
                                handleQuickApprove(v._id, v.businessName || v.ownerName);
                              }
                            }}
                            disabled={actionBusy}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50 whitespace-nowrap"
                            title="1-Click Approve Vendor & Unlock Dashboard"
                          >
                            ✓ Approve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VENDOR DETAIL & VERIFICATION MODAL */}
      {selectedVendorId && (
        <div
          className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={closeVendorDetail}
        >
          <div
            className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[92vh] overflow-y-auto border border-brand-100 my-8 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {loadingDetail || !vendorDetail ? (
              <div className="py-16 text-center text-muted">Loading vendor verification file...</div>
            ) : (
              <div>
                {/* Modal Header */}
                <div className="flex flex-wrap justify-between items-start gap-4 mb-5 pb-4 border-b border-brand-100">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink">
                        {vendorDetail.vendor.vendorProfile?.businessName || vendorDetail.vendor.name}
                      </h2>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase ${getBadgeStyle(
                          vendorDetail.vendor.vendorProfile?.approved ? "approved" : vendorDetail.vendor.vendorProfile?.verificationStatus
                        )}`}
                      >
                        {vendorDetail.vendor.vendorProfile?.approved
                          ? "🟢 APPROVED"
                          : vendorDetail.vendor.vendorProfile?.verificationStatus?.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-1">
                      Contact: {vendorDetail.vendor.name} • {vendorDetail.vendor.email} • {vendorDetail.vendor.phone || "No phone"} • Registered on {new Date(vendorDetail.vendor.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {!vendorDetail.vendor.vendorProfile?.approved ? (
                      <button
                        type="button"
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                        disabled={actionBusy}
                        onClick={() => {
                          if (confirm(`Approve ${vendorDetail.vendor.vendorProfile?.businessName || vendorDetail.vendor.name}? This will mark all documents as verified and unlock their dashboard immediately.`)) {
                            handleUpdateVendorStatus("approved");
                          }
                        }}
                      >
                        <span>✓</span> Approve Vendor & Unlock Dashboard
                      </button>
                    ) : (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                        ✓ Dashboard Unlocked
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={closeVendorDetail}
                      className="w-8 h-8 rounded-full bg-surface hover:bg-brand-50 text-muted hover:text-ink flex items-center justify-center text-sm font-bold transition ml-1"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Progress bar inside modal */}
                <div className="bg-brand-50/60 p-4 rounded-xl border border-brand-100 mb-6">
                  <div className="flex justify-between text-xs text-ink mb-1.5">
                    <b>Profile Completion: {vendorDetail.completion?.percentage}%</b>
                    <span className="text-muted">
                      Mandatory KYC: {vendorDetail.completion?.mandatoryUploaded} / {vendorDetail.completion?.mandatoryTotal} uploaded
                    </span>
                  </div>
                  <div className="w-full h-2 bg-brand-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-600 rounded-full"
                      style={{ width: `${vendorDetail.completion?.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Modal Navigation Tabs */}
                <div className="flex flex-wrap gap-1.5 border-b border-brand-100 pb-2 mb-6">
                  {[
                    { id: "profile", label: "👤 Profile & Business" },
                    { id: "services", label: `✨ Services (${vendorDetail.vendor.vendorProfile?.categories?.length || 0})` },
                    { id: "documents", label: `📄 KYC Documents (${vendorDetail.vendor.vendorProfile?.documents?.length || 0})` },
                    { id: "bank", label: "🏦 Bank Details" },
                    { id: "portfolio", label: `🎨 Portfolio (${vendorDetail.vendor.vendorProfile?.portfolio?.length || 0})` },
                    { id: "activity", label: `📦 Items & Bookings (${vendorDetail.items?.length || 0})` },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setDetailTab(tab.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        detailTab === tab.id
                          ? "bg-brand-600 text-white shadow-sm"
                          : "bg-surface text-ink/75 hover:bg-brand-50"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* DETAIL TAB 1: PROFILE */}
                {detailTab === "profile" && (
                  <div className="space-y-4 text-xs sm:text-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-surface p-4 rounded-2xl border border-brand-100">
                      <div><b>Business Name:</b> {vendorDetail.vendor.vendorProfile?.businessName || "—"}</div>
                      <div><b>Owner / Contact:</b> {vendorDetail.vendor.vendorProfile?.ownerName || vendorDetail.vendor.name}</div>
                      <div><b>Vendor Type:</b> {vendorDetail.vendor.vendorProfile?.vendorType || "Individual"}</div>
                      <div><b>Mobile Phone:</b> {vendorDetail.vendor.phone || "—"}</div>
                      <div><b>Email:</b> {vendorDetail.vendor.email}</div>
                      <div><b>Address:</b> {vendorDetail.vendor.vendorProfile?.address || "—"}</div>
                      <div><b>City, State:</b> {vendorDetail.vendor.vendorProfile?.city || "—"}, {vendorDetail.vendor.vendorProfile?.state || "—"}</div>
                      <div><b>PIN Code:</b> {vendorDetail.vendor.vendorProfile?.pincode || "—"}</div>
                    </div>

                    <div>
                      <b className="block text-ink mb-1">About / Bio:</b>
                      <p className="text-muted bg-surface p-4 rounded-xl border border-brand-100 leading-relaxed">
                        {vendorDetail.vendor.vendorProfile?.about || "No bio provided."}
                      </p>
                    </div>

                    {(vendorDetail.vendor.vendorProfile?.profilePhoto || vendorDetail.vendor.vendorProfile?.coverPhoto) && (
                      <div className="flex gap-4 pt-2">
                        {vendorDetail.vendor.vendorProfile?.profilePhoto && (
                          <div>
                            <div className="text-xs font-bold text-ink mb-1">Logo / Profile Photo</div>
                            <img
                              src={vendorDetail.vendor.vendorProfile.profilePhoto}
                              alt="Logo"
                              className="w-20 h-20 rounded-full object-cover border border-brand-200"
                            />
                          </div>
                        )}
                        {vendorDetail.vendor.vendorProfile?.coverPhoto && (
                          <div>
                            <div className="text-xs font-bold text-ink mb-1">Cover Photo</div>
                            <img
                              src={vendorDetail.vendor.vendorProfile.coverPhoto}
                              alt="Cover"
                              className="w-40 h-20 rounded-xl object-cover border border-brand-200"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* DETAIL TAB 2: SERVICES */}
                {detailTab === "services" && (
                  <div className="space-y-4 text-xs sm:text-sm">
                    <div>
                      <b className="block text-ink mb-2">Selected Wedding Categories:</b>
                      <div className="flex gap-2 flex-wrap">
                        {(vendorDetail.vendor.vendorProfile?.categories || []).map((cat) => (
                          <span key={cat._id || cat} className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                            {cat.name || cat}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-surface p-4 rounded-2xl border border-brand-100">
                      <div><b>Starting Price:</b> ₹{Number(vendorDetail.vendor.vendorProfile?.startingPrice || 0).toLocaleString("en-IN")}</div>
                      <div><b>Price Range:</b> {vendorDetail.vendor.vendorProfile?.priceRange || "—"}</div>
                      <div><b>Service Location:</b> {vendorDetail.vendor.vendorProfile?.serviceLocation || "—"}</div>
                      <div><b>Experience:</b> {vendorDetail.vendor.vendorProfile?.experience || "—"}</div>
                    </div>

                    <div>
                      <b className="block text-ink mb-1">Service Description:</b>
                      <p className="text-muted bg-surface p-4 rounded-xl border border-brand-100 leading-relaxed">
                        {vendorDetail.vendor.vendorProfile?.serviceDescription || "—"}
                      </p>
                    </div>

                    {vendorDetail.vendor.vendorProfile?.additionalServices?.length > 0 && (
                      <div>
                        <b className="block text-ink mb-2">Additional Services / Inclusions:</b>
                        <div className="flex gap-2 flex-wrap">
                          {vendorDetail.vendor.vendorProfile.additionalServices.map((s, idx) => (
                            <span key={idx} className="px-2.5 py-1 rounded-lg text-xs bg-surface text-ink border border-brand-100">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* DETAIL TAB 3: KYC DOCUMENTS */}
                {detailTab === "documents" && (
                  <div className="space-y-4 text-xs sm:text-sm">
                    <div className="bg-emerald-50/70 border border-emerald-200 text-emerald-950 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <p className="font-bold text-xs flex items-center gap-1.5">
                          <span>📋</span> Document Verification Overview
                        </p>
                        <p className="text-[12px] text-emerald-800">
                          Inspect the uploaded documents below. You do <b>not</b> need to verify documents one by one — click <b>"Approve Vendor & Unlock Dashboard"</b> to approve all documents and grant dashboard access at once.
                        </p>
                      </div>
                      {!vendorDetail.vendor.vendorProfile?.approved && (
                        <button
                          type="button"
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50 shrink-0"
                          disabled={actionBusy}
                          onClick={() => {
                            if (confirm(`Approve ${vendorDetail.vendor.vendorProfile?.businessName || vendorDetail.vendor.name}? This will mark all documents as verified and unlock their dashboard immediately.`)) {
                              handleUpdateVendorStatus("approved");
                            }
                          }}
                        >
                          ✓ Approve Vendor & Unlock Dashboard
                        </button>
                      )}
                    </div>

                    {(!vendorDetail.vendor.vendorProfile?.documents || vendorDetail.vendor.vendorProfile.documents.length === 0) ? (
                      <p className="text-muted py-6 text-center">No documents have been uploaded yet.</p>
                    ) : (
                      vendorDetail.vendor.vendorProfile.documents.map((doc) => (
                        <div key={doc.docType} className="bg-surface p-4 sm:p-5 rounded-2xl border border-brand-100 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-sm text-ink">{doc.name} ({doc.docType?.toUpperCase()})</h4>
                              <span className="text-[11px] text-muted">
                                Uploaded on {new Date(doc.uploadedAt).toLocaleDateString()}
                              </span>
                            </div>
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${getBadgeStyle(doc.status)}`}>
                              {doc.status === "verified" ? "🟢 Verified" : doc.status === "rejected" ? "🔴 Rejected" : "🔵 Under Review"}
                            </span>
                          </div>

                          {doc.rejectionReason && (
                            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-2.5 rounded-xl text-xs">
                              <b>Rejection Reason:</b> {doc.rejectionReason}
                            </div>
                          )}

                          <div className="flex justify-between items-center flex-wrap gap-2 pt-2 border-t border-brand-100">
                            <div className="flex gap-2">
                              {doc.fileUrl && (
                                <a
                                  href={doc.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-3 py-1 rounded-lg border border-brand-200 text-ink hover:bg-brand-50 text-xs font-semibold transition"
                                >
                                  👁️ View File
                                </a>
                              )}
                              {doc.frontUrl && doc.frontUrl !== doc.fileUrl && (
                                <a
                                  href={doc.frontUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-3 py-1 rounded-lg border border-brand-200 text-ink hover:bg-brand-50 text-xs font-semibold transition"
                                >
                                  Front Image
                                </a>
                              )}
                              {doc.backUrl && (
                                <a
                                  href={doc.backUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-3 py-1 rounded-lg border border-brand-200 text-ink hover:bg-brand-50 text-xs font-semibold transition"
                                >
                                  Back Image
                                </a>
                              )}
                            </div>

                            <div className="flex gap-2">
                              {doc.status !== "rejected" && (
                                <button
                                  type="button"
                                  className="px-3 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition disabled:opacity-50"
                                  disabled={actionBusy}
                                  onClick={() =>
                                    setRejectPrompt({
                                      open: true,
                                      type: "document",
                                      docType: doc.docType,
                                      title: `Reject Document: ${doc.name}`,
                                      reason: "",
                                    })
                                  }
                                >
                                  ✕ Reject with Reason
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* DETAIL TAB 4: BANK DETAILS */}
                {detailTab === "bank" && (
                  <div className="bg-surface p-5 rounded-2xl border border-brand-100 space-y-4 text-xs sm:text-sm">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-sm text-ink">Vendor Settlement Bank Account</h4>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${getBadgeStyle(vendorDetail.vendor.vendorProfile?.bankDetails?.status)}`}>
                        {vendorDetail.vendor.vendorProfile?.bankDetails?.status || "Pending"}
                      </span>
                    </div>

                    {vendorDetail.vendor.vendorProfile?.bankDetails?.rejectionReason && (
                      <div className="bg-rose-50 border border-rose-200 text-rose-800 p-2.5 rounded-xl text-xs">
                        <b>Bank Rejection Reason:</b> {vendorDetail.vendor.vendorProfile.bankDetails.rejectionReason}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-xl border border-brand-100">
                      <div><b>Account Holder:</b> {vendorDetail.vendor.vendorProfile?.bankDetails?.accountHolderName || "—"}</div>
                      <div><b>Bank Name:</b> {vendorDetail.vendor.vendorProfile?.bankDetails?.bankName || "—"}</div>
                      <div className="flex items-center gap-2">
                        <b>Account No:</b> {formatAccountNumber(vendorDetail.vendor.vendorProfile?.bankDetails?.accountNumber)}
                        <button
                          type="button"
                          className="px-2 py-0.5 rounded border border-brand-200 text-[10px] font-semibold text-muted hover:text-ink"
                          onClick={() => setShowMaskedAccount(!showMaskedAccount)}
                        >
                          {showMaskedAccount ? "👁️ Reveal" : "🔒 Mask"}
                        </button>
                      </div>
                      <div><b>IFSC Code:</b> {vendorDetail.vendor.vendorProfile?.bankDetails?.ifscCode || "—"}</div>
                    </div>

                    {vendorDetail.vendor.vendorProfile?.bankDetails?.chequeUrl && (
                      <div>
                        <b>Cancelled Cheque / Bank Proof: </b>
                        <a
                          href={vendorDetail.vendor.vendorProfile.bankDetails.chequeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 rounded-lg border border-brand-200 text-ink hover:bg-brand-50 text-xs font-semibold ml-2 transition"
                        >
                          👁️ View Cheque Proof
                        </a>
                      </div>
                    )}

                    <div className="flex justify-between items-center flex-wrap gap-2 pt-2 border-t border-brand-100">
                      <p className="text-xs text-muted">
                        Bank details are verified automatically when you click <b>"Approve Vendor & Unlock Dashboard"</b>.
                      </p>
                      <div className="flex gap-2">
                        {vendorDetail.vendor.vendorProfile?.bankDetails?.status !== "rejected" && (
                          <button
                            type="button"
                            className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition disabled:opacity-50"
                            disabled={actionBusy}
                            onClick={() =>
                              setRejectPrompt({
                                open: true,
                                type: "bank",
                                docType: "",
                                title: "Reject Bank Details",
                                reason: "",
                              })
                            }
                          >
                            ✕ Reject Bank Details
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* DETAIL TAB 5: PORTFOLIO */}
                {detailTab === "portfolio" && (
                  <div>
                    {(!vendorDetail.vendor.vendorProfile?.portfolio || vendorDetail.vendor.vendorProfile.portfolio.length === 0) ? (
                      <p className="text-muted py-6 text-center text-sm">No portfolio projects uploaded by this vendor.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                        {vendorDetail.vendor.vendorProfile.portfolio.map((item) => (
                          <div key={item._id} className="border border-brand-100 rounded-xl overflow-hidden bg-white shadow-sm">
                            {item.images?.[0] ? (
                              <img src={item.images[0]} alt={item.title} className="w-full h-32 object-cover" />
                            ) : (
                              <div className="h-32 bg-surface flex items-center justify-center text-muted text-sm">
                                🎬 Video
                              </div>
                            )}
                            <div className="p-3">
                              <b className="text-sm text-ink">{item.title}</b>
                              <div className="text-xs text-brand-600 font-semibold">{item.category}</div>
                              {item.description && <p className="text-xs text-muted mt-1">{item.description}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* DETAIL TAB 6: ITEMS & BOOKINGS */}
                {detailTab === "activity" && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-bold text-sm text-ink mb-2">Listed Items / Services ({vendorDetail.items?.length || 0})</h4>
                      {vendorDetail.items?.length === 0 ? (
                        <p className="text-muted text-xs">No items created yet.</p>
                      ) : (
                        <table className="w-full text-left text-xs border border-brand-100 rounded-xl overflow-hidden">
                          <thead className="bg-surface text-muted font-bold border-b border-brand-100">
                            <tr><th className="p-2.5">Title</th><th className="p-2.5">Category</th><th className="p-2.5">Price</th><th className="p-2.5">City</th><th className="p-2.5">Active</th></tr>
                          </thead>
                          <tbody className="divide-y divide-brand-100">
                            {vendorDetail.items.map((it) => (
                              <tr key={it._id}>
                                <td className="p-2.5 font-semibold text-ink">{it.title}</td>
                                <td className="p-2.5">{it.category?.name || "—"}</td>
                                <td className="p-2.5 font-bold">₹{it.price?.toLocaleString("en-IN")}</td>
                                <td className="p-2.5">{it.city}</td>
                                <td className="p-2.5">{it.active ? "Yes" : "No"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-ink mb-2">Recent Bookings ({vendorDetail.bookings?.length || 0})</h4>
                      {vendorDetail.bookings?.length === 0 ? (
                        <p className="text-muted text-xs">No bookings recorded yet.</p>
                      ) : (
                        <table className="w-full text-left text-xs border border-brand-100 rounded-xl overflow-hidden">
                          <thead className="bg-surface text-muted font-bold border-b border-brand-100">
                            <tr><th className="p-2.5">Customer</th><th className="p-2.5">Event Date</th><th className="p-2.5">Amount</th><th className="p-2.5">Status</th></tr>
                          </thead>
                          <tbody className="divide-y divide-brand-100">
                            {vendorDetail.bookings.map((b) => (
                              <tr key={b._id}>
                                <td className="p-2.5 font-semibold text-ink">{b.name} ({b.phone})</td>
                                <td className="p-2.5">{b.eventDate}</td>
                                <td className="p-2.5 font-bold">₹{b.amount?.toLocaleString("en-IN")}</td>
                                <td className="p-2.5"><span className="capitalize font-bold">{b.status}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                )}

                {/* FINAL ADMIN APPROVAL / DECISION ACTION BAR */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-6 mt-6 border-t border-brand-100 bg-surface/50 p-4 rounded-2xl">
                  <div className="text-xs text-muted">
                    Vendor Status: <b className="text-ink capitalize">{vendorDetail.vendor.vendorProfile?.approved ? "Approved" : vendorDetail.vendor.vendorProfile?.verificationStatus?.replace("_", " ")}</b>
                  </div>

                  <div className="flex items-center gap-2">
                    {!vendorDetail.vendor.vendorProfile?.approved ? (
                      <button
                        type="button"
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition disabled:opacity-50 flex items-center gap-2"
                        disabled={actionBusy}
                        onClick={() => {
                          if (confirm(`Approve ${vendorDetail.vendor.vendorProfile?.businessName || vendorDetail.vendor.name}? This will immediately verify all documents and unlock all vendor dashboard features.`)) {
                            handleUpdateVendorStatus("approved");
                          }
                        }}
                      >
                        <span>✓</span> Approve Vendor & Unlock Dashboard
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="px-4 py-2 rounded-xl border border-amber-300 text-amber-700 hover:bg-amber-50 font-bold text-xs sm:text-sm transition disabled:opacity-50"
                        disabled={actionBusy}
                        onClick={() => handleUpdateVendorStatus("suspended")}
                      >
                        Suspend Vendor
                      </button>
                    )}

                    <button
                      type="button"
                      className="px-4 py-2 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs sm:text-sm transition disabled:opacity-50"
                      disabled={actionBusy}
                      onClick={() =>
                        setRejectPrompt({
                          open: true,
                          type: "vendor",
                          docType: "",
                          title: "Reject Vendor Application",
                          reason: "",
                        })
                      }
                    >
                      ✕ Reject Application
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REJECTION REASON PROMPT MODAL */}
      {rejectPrompt.open && (
        <div
          className="fixed inset-0 bg-ink/75 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={() => setRejectPrompt({ open: false, type: "", docType: "", title: "", reason: "" })}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-100 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif text-lg font-bold text-rose-700">{rejectPrompt.title}</h3>
            <p className="text-xs text-muted leading-relaxed">
              Please state clearly why this item is being rejected. The vendor will see this exact message on their dashboard to re-upload.
            </p>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Rejection Reason *</label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Uploaded document is blurred. Please upload a clear original copy."
                value={rejectPrompt.reason}
                onChange={(e) => setRejectPrompt({ ...rejectPrompt, reason: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="px-4 py-2 rounded-xl border border-brand-200 text-ink hover:bg-brand-50 text-xs font-semibold"
                onClick={() => setRejectPrompt({ open: false, type: "", docType: "", title: "", reason: "" })}
              >
                Cancel
              </button>

              <button
                type="button"
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm disabled:opacity-50"
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
