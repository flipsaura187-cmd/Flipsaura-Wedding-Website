"use client";
import React, { useState, useEffect } from "react";
import api from "@/api/axios";

export default function VendorVehicleBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");

  // Modal response state
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [actionType, setActionType] = useState(""); // "CONFIRM" | "REJECT" | "QUOTE" | "COMPLETE"
  const [responseNotes, setResponseNotes] = useState("");
  const [quotedAmount, setQuotedAmount] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const loadBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/vehicles/my-bookings");
      if (res.data?.ok) {
        setBookings(res.data.data.bookings || []);
        setStats(res.data.data.stats || null);
      }
    } catch (err) {
      console.error("Failed to load owner vehicle bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const openRespondModal = (b, action) => {
    setSelectedBooking(b);
    setActionType(action);
    setResponseNotes("");
    setQuotedAmount(b.priceBreakdown?.quotedAmount || b.priceBreakdown?.totalAmount || "");
    setActionError("");
  };

  const closeRespondModal = () => {
    setSelectedBooking(null);
    setActionType("");
    setActionError("");
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;

    try {
      setActionBusy(true);
      setActionError("");

      const payload = {
        action: actionType,
        notes: responseNotes,
        quotedAmount: actionType === "QUOTE" ? Number(quotedAmount) : undefined,
      };

      const res = await api.patch(
        `/api/vehicles/bookings/${selectedBooking._id}/respond`,
        payload
      );

      if (res.data?.ok) {
        closeRespondModal();
        loadBookings();
      } else {
        setActionError(res.data?.error || "Action failed.");
      }
    } catch (err) {
      setActionError(err.response?.data?.error || err.message || "Action failed.");
    } finally {
      setActionBusy(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filterStatus === "all") return true;
    return b.status?.toLowerCase() === filterStatus.toLowerCase();
  });

  const getStatusBadge = (status) => {
    const s = String(status).toUpperCase();
    if (s === "CONFIRMED") return { bg: "#ECFDF5", text: "#065F46", label: "🟢 Confirmed" };
    if (s === "QUOTED") return { bg: "#EFF6FF", text: "#1E40AF", label: "💬 Quoted" };
    if (s === "IN_PROGRESS") return { bg: "#FEF3C7", text: "#92400E", label: "🟡 In Progress" };
    if (s === "COMPLETED") return { bg: "#F3F4F6", text: "#374151", label: "✓ Completed" };
    if (s === "CANCELLED") return { bg: "#FEE2E2", text: "#991B1B", label: "🔴 Cancelled" };
    if (s === "REJECTED") return { bg: "#FEE2E2", text: "#991B1B", label: "✕ Rejected" };
    return { bg: "#FFFBEB", text: "#854D0E", label: "⏳ Pending" };
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: 24, color: "#111827" }}>
            Incoming Vehicle Bookings & Trips
          </h1>
          <p style={{ margin: 0, color: "#6B7280", fontSize: 14 }}>
            Review customer rental requests, provide trip quotes, and manage confirmed departures.
          </p>
        </div>
      </div>

      {/* KPI Stats Cards */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
          <div style={{ background: "#fff", padding: "18px 20px", borderRadius: 12, border: "1px solid #E5E7EB" }}>
            <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 700, textTransform: "uppercase" }}>Total Requests</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#111827", marginTop: 4 }}>{stats.totalBookings}</div>
          </div>

          <div style={{ background: "#fff", padding: "18px 20px", borderRadius: 12, border: "1px solid #E5E7EB" }}>
            <div style={{ fontSize: 12, color: "#854D0E", fontWeight: 700, textTransform: "uppercase" }}>Pending Actions</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#D97706", marginTop: 4 }}>{stats.pendingCount}</div>
          </div>

          <div style={{ background: "#fff", padding: "18px 20px", borderRadius: 12, border: "1px solid #E5E7EB" }}>
            <div style={{ fontSize: 12, color: "#065F46", fontWeight: 700, textTransform: "uppercase" }}>Confirmed Trips</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#059669", marginTop: 4 }}>{stats.confirmedCount}</div>
          </div>

          <div style={{ background: "#fff", padding: "18px 20px", borderRadius: 12, border: "1px solid #E5E7EB" }}>
            <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 700, textTransform: "uppercase" }}>Total Earnings</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "var(--pink-700, #8B1E3F)", marginTop: 4 }}>
              ₹{stats.totalEarnings?.toLocaleString("en-IN") || 0}
            </div>
          </div>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { id: "all", label: "All Requests" },
          { id: "pending", label: "Pending" },
          { id: "confirmed", label: "Confirmed" },
          { id: "completed", label: "Completed" },
          { id: "cancelled", label: "Cancelled / Rejected" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterStatus(tab.id)}
            style={{
              padding: "6px 16px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              border: filterStatus === tab.id ? "1px solid var(--pink-700, #8B1E3F)" : "1px solid #D1D5DB",
              background: filterStatus === tab.id ? "var(--pink-50, #FDF2F4)" : "#fff",
              color: filterStatus === tab.id ? "var(--pink-700, #8B1E3F)" : "#4B5563",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {loading ? (
        <div style={{ padding: "60px 0", textAlign: "center", color: "#666" }}>
          Loading vehicle bookings...
        </div>
      ) : filteredBookings.length === 0 ? (
        <div
          style={{
            background: "#fff",
            padding: "60px 20px",
            borderRadius: 16,
            textAlign: "center",
            border: "1px dashed #D1D5DB",
          }}
        >
          <div style={{ fontSize: 44, marginBottom: 12 }}>📋</div>
          <h3 style={{ margin: "0 0 6px", color: "#374151" }}>No requests in this category</h3>
          <p style={{ color: "#6B7280", margin: 0, fontSize: 14 }}>
            Incoming client rental and transport booking requests will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {filteredBookings.map((b) => {
            const badge = getStatusBadge(b.status);
            const isRental = b.serviceType === "RENTAL";
            const v = b.vehicle || {};

            return (
              <div
                key={b._id}
                style={{
                  background: "#fff",
                  borderRadius: 14,
                  border: "1px solid #E5E7EB",
                  padding: "20px 24px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 14,
                    flexWrap: "wrap",
                    gap: 10,
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <span
                        style={{
                          background: isRental ? "#EEF2FF" : "#FEF3C7",
                          color: isRental ? "#3730A3" : "#92400E",
                          padding: "2px 8px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {isRental ? "⏱️ RENTAL (PERIOD)" : "🚌 TRANSPORT (TRIP)"}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
                        Ref: {b.bookingRef}
                      </span>
                      <span style={{ fontSize: 12, color: "#6B7280" }}>
                        {new Date(b.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 style={{ margin: "2px 0 0", fontSize: 18, color: "#111827" }}>
                      {v.name} ({v.registrationNumber})
                    </h3>
                  </div>

                  <span
                    style={{
                      background: badge.bg,
                      color: badge.text,
                      padding: "4px 12px",
                      borderRadius: 20,
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {badge.label}
                  </span>
                </div>

                {/* Details Breakdown */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 16 }}>
                  <div>
                    <span style={{ fontSize: 11, color: "#9CA3AF", textTransform: "uppercase", display: "block" }}>
                      Customer Contact
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#111827", display: "block" }}>
                      {b.customerName}
                    </span>
                    <span style={{ fontSize: 13, color: "#4B5563" }}>
                      📞 {b.customerPhone} · {b.customerEmail}
                    </span>
                  </div>

                  {isRental ? (
                    <div>
                      <span style={{ fontSize: 11, color: "#9CA3AF", textTransform: "uppercase", display: "block" }}>
                        Rental Timing & Route
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#111827", display: "block" }}>
                        {b.rentalDetails?.startDate ? new Date(b.rentalDetails.startDate).toLocaleString() : "—"} to{" "}
                        {b.rentalDetails?.endDate ? new Date(b.rentalDetails.endDate).toLocaleString() : "—"}
                      </span>
                      <span style={{ fontSize: 12, color: "#6B7280" }}>
                        Pickup: {b.rentalDetails?.pickupLocation || "Base"} · {b.rentalDetails?.selfDrive ? "Self-Drive" : "With Chauffeur"}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span style={{ fontSize: 11, color: "#9CA3AF", textTransform: "uppercase", display: "block" }}>
                        Trip Route & Schedule
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#111827", display: "block" }}>
                        {b.transportDetails?.travelDate ? new Date(b.transportDetails.travelDate).toLocaleDateString() : "—"} @ {b.transportDetails?.pickupTime}
                      </span>
                      <span style={{ fontSize: 12, color: "#4B5563" }}>
                        {b.transportDetails?.pickupAddress} → {b.transportDetails?.destinationAddress}
                      </span>
                      <span style={{ fontSize: 11, color: "#6B7280", display: "block" }}>
                        ({b.transportDetails?.passengers} Passengers · {b.transportDetails?.tripType})
                      </span>
                    </div>
                  )}

                  <div>
                    <span style={{ fontSize: 11, color: "#9CA3AF", textTransform: "uppercase", display: "block" }}>
                      Price Estimate / Quote
                    </span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: "var(--pink-700, #8B1E3F)" }}>
                      ₹{b.priceBreakdown?.totalAmount?.toLocaleString("en-IN") || "Quote Pending"}
                    </span>
                    {b.priceBreakdown?.quotedAmount && (
                      <div style={{ fontSize: 12, color: "#1E40AF" }}>
                        Quote: ₹{b.priceBreakdown.quotedAmount.toLocaleString("en-IN")}
                      </div>
                    )}
                  </div>
                </div>

                {/* Special Notes if any */}
                {(b.transportDetails?.specialNotes || b.ownerResponseNotes) && (
                  <div style={{ background: "#F9FAFB", padding: "10px 14px", borderRadius: 8, fontSize: 12, color: "#4B5563", marginBottom: 14 }}>
                    {b.transportDetails?.specialNotes && (
                      <div>
                        <b>Client Instructions:</b> {b.transportDetails.specialNotes}
                      </div>
                    )}
                    {b.ownerResponseNotes && (
                      <div>
                        <b>Provider Response:</b> {b.ownerResponseNotes}
                      </div>
                    )}
                  </div>
                )}

                {/* Response Action Buttons */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap", borderTop: "1px solid #F3F4F6", paddingTop: 12 }}>
                  {b.status === "PENDING" && (
                    <>
                      <button
                        type="button"
                        onClick={() => openRespondModal(b, "CONFIRM")}
                        className="btn btn-primary"
                        style={{ fontSize: 12, padding: "6px 14px" }}
                      >
                        ✓ Accept & Confirm
                      </button>

                      <button
                        type="button"
                        onClick={() => openRespondModal(b, "QUOTE")}
                        style={{
                          fontSize: 12,
                          padding: "6px 14px",
                          borderRadius: 6,
                          border: "1px solid #3B82F6",
                          background: "#EFF6FF",
                          color: "#1D4ED8",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        💬 Submit Quote
                      </button>

                      <button
                        type="button"
                        onClick={() => openRespondModal(b, "REJECT")}
                        style={{
                          fontSize: 12,
                          padding: "6px 12px",
                          borderRadius: 6,
                          border: "1px solid #FCA5A5",
                          background: "#fff",
                          color: "#DC2626",
                          cursor: "pointer",
                        }}
                      >
                        ✕ Decline
                      </button>
                    </>
                  )}

                  {b.status === "CONFIRMED" && (
                    <>
                      <button
                        type="button"
                        onClick={() => openRespondModal(b, "COMPLETE")}
                        style={{
                          fontSize: 12,
                          padding: "6px 14px",
                          borderRadius: 6,
                          border: "1px solid #10B981",
                          background: "#ECFDF5",
                          color: "#065F46",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        ✓ Mark Trip Completed
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* ACTION MODAL (CONFIRM / QUOTE / REJECT / COMPLETE) */}
      {/* ============================================================ */}
      {selectedBooking && actionType && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              width: "100%",
              maxWidth: 500,
              padding: "24px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ margin: "0 0 8px", fontSize: 18, color: "#111827" }}>
              {actionType === "CONFIRM" && "Confirm Vehicle Booking"}
              {actionType === "QUOTE" && "Submit Price Quote to Client"}
              {actionType === "REJECT" && "Decline Booking Request"}
              {actionType === "COMPLETE" && "Mark Booking Completed"}
            </h3>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "#6B7280" }}>
              Booking Ref: <b>{selectedBooking.bookingRef}</b> · {selectedBooking.vehicle?.name}
            </p>

            {actionError && (
              <div style={{ background: "#FEE2E2", color: "#991B1B", padding: "8px 12px", borderRadius: 6, fontSize: 13, marginBottom: 14 }}>
                {actionError}
              </div>
            )}

            <form onSubmit={handleActionSubmit}>
              {actionType === "QUOTE" && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4 }}>
                    Custom Quote Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={quotedAmount}
                    onChange={(e) => setQuotedAmount(e.target.value)}
                    placeholder="Enter total quote for this trip"
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #D1D5DB" }}
                  />
                </div>
              )}

              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4 }}>
                  {actionType === "REJECT" ? "Reason for Declining *" : "Message for Customer (Optional)"}
                </label>
                <textarea
                  rows={3}
                  required={actionType === "REJECT"}
                  value={responseNotes}
                  onChange={(e) => setResponseNotes(e.target.value)}
                  placeholder={
                    actionType === "REJECT"
                      ? "e.g. Vehicle undergoing routine servicing on requested date."
                      : "e.g. Chauffeur details will be shared 2 hours before pickup."
                  }
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #D1D5DB", resize: "none" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button type="button" onClick={closeRespondModal} className="btn btn-ghost" style={{ padding: "8px 16px" }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionBusy}
                  className="btn btn-primary"
                  style={{
                    padding: "8px 20px",
                    background: actionType === "REJECT" ? "#DC2626" : undefined,
                  }}
                >
                  {actionBusy ? "Processing..." : "Submit Response"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
