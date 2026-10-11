"use client";
import React, { useState, useEffect } from "react";
import api from "@/api/axios";

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [counts, setCounts] = useState({ total: 0, pending: 0, verified: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filterVerification, setFilterVerification] = useState("all");
  const [actionBusy, setActionBusy] = useState(false);
  const [toast, setToast] = useState(null);

  // Inspection modal state
  const [inspectVehicle, setInspectVehicle] = useState(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // Reject modal state
  const [rejectModal, setRejectModal] = useState({
    open: false,
    vehicleId: null,
    vehicleName: "",
    reason: "",
  });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterVerification !== "all") params.append("verificationStatus", filterVerification);
      if (q.trim()) params.append("q", q.trim());

      const res = await api.get(`/api/vehicles/admin/all?${params.toString()}`);
      if (res.data?.ok) {
        setVehicles(res.data.data.vehicles || []);
        if (res.data.data.counts) {
          setCounts(res.data.data.counts);
        }
      }
    } catch (err) {
      console.error("Failed to load admin vehicles:", err);
      showToast("Failed to load vehicles from server.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, [filterVerification]);

  const handleVerify = async (id, status, reason = "") => {
    try {
      setActionBusy(true);
      const res = await api.patch(`/api/vehicles/admin/${id}/verify`, {
        verificationStatus: status,
        rejectionReason: reason,
      });
      if (res.data?.ok) {
        showToast(
          status === "verified"
            ? "✓ Vehicle listing approved! Listing is now active on the public marketplace."
            : "✕ Vehicle listing marked as rejected. Provider notified."
        );
        if (inspectVehicle && inspectVehicle._id === id) {
          setInspectVehicle(res.data.data.vehicle);
        }
        setRejectModal({ open: false, vehicleId: null, vehicleName: "", reason: "" });
        loadVehicles();
      } else {
        showToast(res.data?.error || "Action failed.", "error");
      }
    } catch (err) {
      showToast(err.response?.data?.error || err.message || "Failed to update verification.", "error");
    } finally {
      setActionBusy(false);
    }
  };

  const openInspection = (v) => {
    setInspectVehicle(v);
    setActivePhotoIdx(0);
  };

  const openRejectPrompt = (v) => {
    setRejectModal({
      open: true,
      vehicleId: v._id,
      vehicleName: `${v.brand} ${v.model} (${v.name})`,
      reason: "Registration documents or vehicle pictures require verification.",
    });
  };

  return (
    <div>
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 24,
            right: 24,
            zIndex: 99999,
            padding: "12px 20px",
            borderRadius: 8,
            boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
            background: toast.type === "error" ? "#EF4444" : "#10B981",
            color: "#fff",
            fontWeight: 600,
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span>{toast.type === "error" ? "⚠️" : "✓"}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: 24, color: "#111827" }}>
            🚗 Vehicle Fleet Moderation & Approvals
          </h1>
          <p style={{ margin: 0, color: "#6B7280", fontSize: 14 }}>
            Review registered vehicle listings, inspect registration details and pricing, and grant marketplace approval.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
        <div style={{ background: "#fff", padding: "16px 20px", borderRadius: 12, border: "1px solid #E5E7EB" }}>
          <div style={{ fontSize: 13, color: "#6B7280", fontWeight: 500 }}>Total Fleet</div>
          <b style={{ fontSize: 26, color: "#111827" }}>{counts.total}</b>
          <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>Cars, 4x4s, Autos, Buses</div>
        </div>

        <div style={{ background: "#FFFBEB", padding: "16px 20px", borderRadius: 12, border: "1px solid #FDE68A" }}>
          <div style={{ fontSize: 13, color: "#92400E", fontWeight: 600 }}>⏳ Pending Approvals</div>
          <b style={{ fontSize: 26, color: "#B45309" }}>{counts.pending}</b>
          <div style={{ fontSize: 11, color: "#92400E", marginTop: 2 }}>Awaiting verification</div>
        </div>

        <div style={{ background: "#ECFDF5", padding: "16px 20px", borderRadius: 12, border: "1px solid #A7F3D0" }}>
          <div style={{ fontSize: 13, color: "#065F46", fontWeight: 600 }}>🟢 Verified & Active</div>
          <b style={{ fontSize: 26, color: "#047857" }}>{counts.verified}</b>
          <div style={{ fontSize: 11, color: "#065F46", marginTop: 2 }}>Live on marketplace</div>
        </div>

        <div style={{ background: "#FEF2F2", padding: "16px 20px", borderRadius: 12, border: "1px solid #FECACA" }}>
          <div style={{ fontSize: 13, color: "#991B1B", fontWeight: 600 }}>🔴 Rejected / Inactive</div>
          <b style={{ fontSize: 26, color: "#B91C1C" }}>{counts.rejected}</b>
          <div style={{ fontSize: 11, color: "#991B1B", marginTop: 2 }}>Action required by owner</div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div
        style={{
          background: "#fff",
          padding: "16px 20px",
          borderRadius: 12,
          border: "1px solid #E5E7EB",
          marginBottom: 20,
          display: "flex",
          gap: 14,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 8, flex: 1, minWidth: 260 }}>
          <input
            type="text"
            placeholder="Search make, model, registration plate, city..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadVehicles()}
            style={{
              padding: "9px 14px",
              borderRadius: 8,
              border: "1px solid #D1D5DB",
              width: "100%",
              fontSize: 13,
            }}
          />
          <button
            type="button"
            onClick={loadVehicles}
            className="btn btn-primary"
            style={{ padding: "8px 18px", fontSize: 13 }}
          >
            Search
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { id: "all", label: `All (${counts.total})` },
            { id: "pending", label: `⏳ Pending (${counts.pending})` },
            { id: "verified", label: `🟢 Verified (${counts.verified})` },
            { id: "rejected", label: `🔴 Rejected (${counts.rejected})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterVerification(tab.id)}
              style={{
                padding: "7px 16px",
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                border: filterVerification === tab.id ? "1px solid var(--pink-700, #8B1E3F)" : "1px solid #D1D5DB",
                background: filterVerification === tab.id ? "var(--pink-50, #FDF2F4)" : "#fff",
                color: filterVerification === tab.id ? "var(--pink-700, #8B1E3F)" : "#4B5563",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Vehicles Table */}
      {loading ? (
        <div style={{ padding: "60px 0", textAlign: "center", color: "#666" }}>
          Loading vehicle listings...
        </div>
      ) : vehicles.length === 0 ? (
        <div style={{ background: "#fff", padding: "60px 20px", borderRadius: 12, textAlign: "center", border: "1px dashed #D1D5DB" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🚗</div>
          <h3 style={{ margin: "0 0 6px", color: "#374151" }}>No vehicles found</h3>
          <p style={{ color: "#6B7280", margin: 0, fontSize: 14 }}>
            No vehicle listings match the current status filter.
          </p>
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", overflowX: "auto" }}>
          <table className="data" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Vehicle & Make</th>
                <th>Owner / Provider</th>
                <th>Registration Plate</th>
                <th>Category & Seats</th>
                <th>City & Location</th>
                <th>Rates</th>
                <th>Moderation Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v._id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <img
                        src={v.images?.[0] || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=150"}
                        alt={v.name}
                        style={{ width: 64, height: 46, borderRadius: 8, objectFit: "cover", background: "#f3f4f6" }}
                      />
                      <div>
                        <b style={{ color: "#111827", fontSize: 14 }}>{v.name}</b>
                        <div style={{ fontSize: 12, color: "#6B7280" }}>
                          {v.brand} {v.model} · <span style={{ textTransform: "capitalize" }}>{v.fuelType}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      {v.owner?.vendorProfile?.businessName || v.owner?.name || "—"}
                    </div>
                    <div style={{ fontSize: 11, color: "#6B7280" }}>
                      📞 {v.owner?.phone || "—"}
                    </div>
                    <div style={{ fontSize: 11, color: "#9CA3AF" }}>
                      {v.owner?.email}
                    </div>
                  </td>
                  <td>
                    <code
                      style={{
                        background: "#F3F4F6",
                        padding: "4px 8px",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#1F2937",
                        letterSpacing: "0.5px",
                        border: "1px solid #E5E7EB",
                      }}
                    >
                      {v.registrationNumber}
                    </code>
                  </td>
                  <td>
                    <span style={{ textTransform: "capitalize", fontSize: 13, fontWeight: 600 }}>
                      {v.vehicleType}
                    </span>
                    <div style={{ fontSize: 11, color: "#6B7280" }}>
                      👥 {v.seatingCapacity} Passengers · {v.transmission}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>📍 {v.city}</div>
                    {v.pickupLocation && (
                      <div style={{ fontSize: 11, color: "#6B7280" }}>{v.pickupLocation}</div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: 12 }}>
                      {v.rentalPricing?.pricePerDay > 0 && (
                        <div style={{ color: "var(--pink-700, #8B1E3F)", fontWeight: 600 }}>
                          ₹{v.rentalPricing.pricePerDay.toLocaleString("en-IN")}/day
                        </div>
                      )}
                      {v.transportPricing?.baseTripPrice > 0 && (
                        <div style={{ color: "#4B5563" }}>
                          ₹{v.transportPricing.baseTripPrice.toLocaleString("en-IN")}/trip
                        </div>
                      )}
                      {(!v.rentalPricing?.pricePerDay && !v.transportPricing?.baseTripPrice) && (
                        <span style={{ color: "#9CA3AF" }}>Quote required</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: 11,
                        padding: "4px 10px",
                        borderRadius: 12,
                        fontWeight: 700,
                        display: "inline-block",
                        background:
                          v.verificationStatus === "verified"
                            ? "#ECFDF5"
                            : v.verificationStatus === "rejected"
                            ? "#FEE2E2"
                            : "#FEF3C7",
                        color:
                          v.verificationStatus === "verified"
                            ? "#065F46"
                            : v.verificationStatus === "rejected"
                            ? "#991B1B"
                            : "#92400E",
                      }}
                    >
                      {v.verificationStatus === "verified"
                        ? "🟢 Verified & Live"
                        : v.verificationStatus === "rejected"
                        ? "🔴 Rejected"
                        : "⏳ Pending Approval"}
                    </span>
                    {v.rejectionReason && (
                      <div style={{ fontSize: 10, color: "#DC2626", marginTop: 2, maxWidth: 140 }}>
                        {v.rejectionReason}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", alignItems: "center" }}>
                      {v.verificationStatus !== "verified" ? (
                        <button
                          type="button"
                          disabled={actionBusy}
                          onClick={() => handleVerify(v._id, "verified")}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 6,
                            border: "none",
                            background: "#059669",
                            color: "#fff",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          ✓ Approve
                        </button>
                      ) : (
                        <span style={{ fontSize: 11, color: "#059669", fontWeight: 700, padding: "4px 8px", background: "#ecfdf5", borderRadius: 4 }}>
                          ✓ Live
                        </span>
                      )}

                      {v.verificationStatus !== "rejected" && (
                        <button
                          type="button"
                          disabled={actionBusy}
                          onClick={() => openRejectPrompt(v)}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 6,
                            border: "1px solid #DC2626",
                            background: "#fff",
                            color: "#DC2626",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          ✕ Reject
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openInspection(v)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 6,
                          border: "1px solid #D1D5DB",
                          background: "#F9FAFB",
                          color: "#374151",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        👁️ Inspect
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
      {/* 1. VEHICLE DETAIL & RC INSPECTION MODAL                   */}
      {/* ========================================================= */}
      {inspectVehicle && (
        <div
          className="admin-modal-overlay"
          onClick={() => setInspectVehicle(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            className="admin-modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 16,
              maxWidth: 720,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 24,
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <h2 style={{ margin: 0, fontSize: 20, color: "#111827" }}>
                    {inspectVehicle.name}
                  </h2>
                  <span
                    style={{
                      fontSize: 11,
                      padding: "4px 10px",
                      borderRadius: 12,
                      fontWeight: 700,
                      background:
                        inspectVehicle.verificationStatus === "verified"
                          ? "#ECFDF5"
                          : inspectVehicle.verificationStatus === "rejected"
                          ? "#FEE2E2"
                          : "#FEF3C7",
                      color:
                        inspectVehicle.verificationStatus === "verified"
                          ? "#065F46"
                          : inspectVehicle.verificationStatus === "rejected"
                          ? "#991B1B"
                          : "#92400E",
                    }}
                  >
                    {inspectVehicle.verificationStatus?.toUpperCase()}
                  </span>
                </div>
                <p style={{ margin: "4px 0 0", color: "#6B7280", fontSize: 13 }}>
                  {inspectVehicle.brand} {inspectVehicle.model} · {inspectVehicle.vehicleType} · {inspectVehicle.city}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectVehicle(null)}
                style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9CA3AF" }}
              >
                ✕
              </button>
            </div>

            {/* Photo Gallery Viewer */}
            {inspectVehicle.images && inspectVehicle.images.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <img
                  src={inspectVehicle.images[activePhotoIdx] || inspectVehicle.images[0]}
                  alt="Vehicle View"
                  style={{ width: "100%", height: 260, objectFit: "cover", borderRadius: 12, background: "#f3f4f6" }}
                />
                {inspectVehicle.images.length > 1 && (
                  <div style={{ display: "flex", gap: 8, marginTop: 10, overflowX: "auto" }}>
                    {inspectVehicle.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt="Thumbnail"
                        onClick={() => setActivePhotoIdx(idx)}
                        style={{
                          width: 60,
                          height: 45,
                          borderRadius: 6,
                          objectFit: "cover",
                          cursor: "pointer",
                          border: activePhotoIdx === idx ? "2px solid var(--pink-700, #8B1E3F)" : "1px solid #E5E7EB",
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Key Information Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
              <div style={{ background: "#F9FAFB", padding: 14, borderRadius: 10, border: "1px solid #E5E7EB" }}>
                <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 700, textTransform: "uppercase" }}>
                  Official Registration Plate
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginTop: 4 }}>
                  {inspectVehicle.registrationNumber}
                </div>
                <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                  Fuel: {inspectVehicle.fuelType} · Transmission: {inspectVehicle.transmission}
                </div>
              </div>

              <div style={{ background: "#F9FAFB", padding: 14, borderRadius: 10, border: "1px solid #E5E7EB" }}>
                <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 700, textTransform: "uppercase" }}>
                  Vehicle Provider / Owner
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginTop: 4 }}>
                  {inspectVehicle.owner?.vendorProfile?.businessName || inspectVehicle.owner?.name || "—"}
                </div>
                <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                  📞 {inspectVehicle.owner?.phone || "No phone"} · ✉️ {inspectVehicle.owner?.email}
                </div>
              </div>
            </div>

            {/* Pricing Details */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
              {/* Rental Details */}
              <div style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: 14 }}>
                <b style={{ fontSize: 13, color: "#111827" }}>Service A: Rental Pricing</b>
                <div style={{ marginTop: 8, fontSize: 13, display: "grid", gap: 4 }}>
                  <div>Per Day: <b>₹{inspectVehicle.rentalPricing?.pricePerDay || 0}</b></div>
                  <div>Per Hour: <b>₹{inspectVehicle.rentalPricing?.pricePerHour || 0}</b></div>
                  <div>Security Deposit: <b>₹{inspectVehicle.rentalPricing?.securityDeposit || 0}</b></div>
                  <div>Included Km/Day: <b>{inspectVehicle.rentalPricing?.includedKmPerDay || 0} km</b></div>
                  <div>Extra Km Rate: <b>₹{inspectVehicle.rentalPricing?.extraKmRate || 0}/km</b></div>
                </div>
              </div>

              {/* Transport Details */}
              <div style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: 14 }}>
                <b style={{ fontSize: 13, color: "#111827" }}>Service B: Transport Pricing</b>
                <div style={{ marginTop: 8, fontSize: 13, display: "grid", gap: 4 }}>
                  <div>Pricing Model: <b style={{ textTransform: "uppercase" }}>{inspectVehicle.transportPricing?.pricingType || "fixed"}</b></div>
                  <div>Base Trip Price: <b>₹{inspectVehicle.transportPricing?.baseTripPrice || 0}</b></div>
                  <div>Per Km Rate: <b>₹{inspectVehicle.transportPricing?.perKmRate || 0}/km</b></div>
                  <div>Driver Allowance: <b>₹{inspectVehicle.transportPricing?.driverAllowance || 0}</b></div>
                </div>
              </div>
            </div>

            {/* Description & Features */}
            {inspectVehicle.description && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280" }}>Description</div>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#374151" }}>{inspectVehicle.description}</p>
              </div>
            )}

            {inspectVehicle.features && inspectVehicle.features.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", marginBottom: 6 }}>Features & Amenities</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {inspectVehicle.features.map((f, i) => (
                    <span key={i} style={{ background: "#F3F4F6", padding: "3px 8px", borderRadius: 4, fontSize: 12 }}>
                      ✓ {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Bottom Action Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #E5E7EB", paddingTop: 18, marginTop: 18 }}>
              <button
                type="button"
                onClick={() => setInspectVehicle(null)}
                className="btn btn-ghost"
              >
                Close
              </button>

              <div style={{ display: "flex", gap: 10 }}>
                {inspectVehicle.verificationStatus !== "verified" && (
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => handleVerify(inspectVehicle._id, "verified")}
                    className="btn btn-primary"
                    style={{ background: "#059669", padding: "10px 20px" }}
                  >
                    ✓ Approve Vehicle Listing & Activate
                  </button>
                )}

                {inspectVehicle.verificationStatus !== "rejected" && (
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => {
                      setInspectVehicle(null);
                      openRejectPrompt(inspectVehicle);
                    }}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 8,
                      border: "1px solid #DC2626",
                      background: "#fff",
                      color: "#DC2626",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    ✕ Reject Vehicle
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. REJECT REASON MODAL                                    */}
      {/* ========================================================= */}
      {rejectModal.open && (
        <div
          className="admin-modal-overlay"
          onClick={() => setRejectModal({ open: false, vehicleId: null, vehicleName: "", reason: "" })}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            className="admin-modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 14,
              maxWidth: 480,
              width: "100%",
              padding: 24,
            }}
          >
            <h3 style={{ margin: "0 0 8px", color: "#DC2626", fontSize: 18 }}>
              Reject Vehicle Listing
            </h3>
            <p style={{ margin: "0 0 16px", color: "#6B7280", fontSize: 13 }}>
              Please specify the reason for declining <b>{rejectModal.vehicleName}</b>. The vehicle owner will receive an email and see this reason in their fleet dashboard.
            </p>

            {/* Quick Reason Presets */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
              {[
                "RC document unreadable or expired",
                "Registration plate does not match vehicle",
                "Photos blurry or not real vehicle",
                "Pricing / deposit unrealistic",
              ].map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRejectModal({ ...rejectModal, reason: preset })}
                  style={{
                    padding: "4px 8px",
                    borderRadius: 4,
                    border: "1px solid #E5E7EB",
                    background: rejectModal.reason === preset ? "#FEE2E2" : "#F9FAFB",
                    color: rejectModal.reason === preset ? "#991B1B" : "#4B5563",
                    fontSize: 11,
                    cursor: "pointer",
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>

            <div className="field">
              <label style={{ fontSize: 13, fontWeight: 600 }}>Rejection Reason *</label>
              <textarea
                rows={3}
                required
                value={rejectModal.reason}
                onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                placeholder="State the reason clearly for the vehicle provider..."
                style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13 }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setRejectModal({ open: false, vehicleId: null, vehicleName: "", reason: "" })}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn btn-primary"
                style={{ background: "#DC2626" }}
                disabled={!rejectModal.reason.trim() || actionBusy}
                onClick={() => handleVerify(rejectModal.vehicleId, "rejected", rejectModal.reason)}
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
