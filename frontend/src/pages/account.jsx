"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "@/compat/Link";
import api from "@/api/axios";

export default function AccountPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("vehicles"); // "vehicles" | "services"
  const [bookings, setBookings] = useState([]);
  const [vehicleBookings, setVehicleBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);

  const loadGeneralBookings = async () => {
    try {
      setLoading(true);
      const { data: j } = await api.get("/api/bookings");
      if (j.ok) setBookings(j.data.bookings || []);
    } catch (err) {
      console.error("Failed to load general bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadVehicleBookings = async () => {
    try {
      setLoadingVehicles(true);
      const { data: j } = await api.get("/api/vehicles/customer/bookings");
      if (j.ok) setVehicleBookings(j.data.bookings || []);
    } catch (err) {
      console.error("Failed to load vehicle bookings:", err);
    } finally {
      setLoadingVehicles(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadGeneralBookings();
      loadVehicleBookings();
    }
  }, [user]);

  // Handle Cancel Booking
  const handleCancelBooking = async (bookingId) => {
    const reason = prompt("Please provide a cancellation reason:");
    if (!reason) return;

    try {
      setActionBusy(true);
      const { data } = await api.patch(`/api/vehicles/customer/bookings/${bookingId}/cancel`, {
        reason,
      });
      if (data.ok) {
        alert("Booking cancelled successfully.");
        loadVehicleBookings();
      } else {
        alert(data.error || "Failed to cancel booking.");
      }
    } catch (err) {
      alert(err.response?.data?.error || err.message || "Failed to cancel.");
    } finally {
      setActionBusy(false);
    }
  };

  // Handle Accept Quote
  const handleAcceptQuote = async (bookingId) => {
    if (!confirm("Are you sure you want to accept this provider's quote?")) return;

    try {
      setActionBusy(true);
      const { data } = await api.patch(`/api/vehicles/customer/bookings/${bookingId}/accept-quote`);
      if (data.ok) {
        alert("Quote accepted! Your vehicle booking is now confirmed.");
        loadVehicleBookings();
      } else {
        alert(data.error || "Failed to accept quote.");
      }
    } catch (err) {
      alert(err.response?.data?.error || err.message || "Failed to accept quote.");
    } finally {
      setActionBusy(false);
    }
  };

  if (!user) return <div className="container loading">Loading user account…</div>;

  const getStatusBadge = (status) => {
    const s = String(status).toUpperCase();
    if (s === "CONFIRMED") return { bg: "#ECFDF5", text: "#065F46", label: "🟢 Confirmed" };
    if (s === "QUOTED") return { bg: "#EFF6FF", text: "#1E40AF", label: "💬 Quote Received" };
    if (s === "IN_PROGRESS") return { bg: "#FEF3C7", text: "#92400E", label: "🟡 In Progress" };
    if (s === "COMPLETED") return { bg: "#F3F4F6", text: "#374151", label: "✓ Completed" };
    if (s === "CANCELLED") return { bg: "#FEE2E2", text: "#991B1B", label: "🔴 Cancelled" };
    if (s === "REJECTED") return { bg: "#FEE2E2", text: "#991B1B", label: "✕ Rejected" };
    return { bg: "#FFFBEB", text: "#854D0E", label: "⏳ Pending Review" };
  };

  return (
    <section className="section" style={{ minHeight: "80vh", background: "#F9FAFB", padding: "40px 0 80px" }}>
      <div className="container" style={{ maxWidth: 1100 }}>
        {/* Profile Header */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: "24px",
            border: "1px solid #E5E7EB",
            marginBottom: 32,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <h1 style={{ margin: "0 0 6px", fontSize: 26, color: "#111827" }}>Hi, {user.name}</h1>
            <p style={{ margin: 0, color: "#6B7280", fontSize: 14 }}>
              {user.email} · <span style={{ textTransform: "capitalize", fontWeight: 600 }}>{user.role}</span>
            </p>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <Link href="/vehicles" to="/vehicles" className="btn btn-outline" style={{ fontSize: 13 }}>
              Explore Fleet 🚗
            </Link>
            {user.role === "vendor" && (
              <Link href="/vendor/dashboard" to="/vendor/dashboard" className="btn btn-primary" style={{ fontSize: 13 }}>
                Vendor Dashboard →
              </Link>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24, borderBottom: "1px solid #E5E7EB", paddingBottom: 12 }}>
          <button
            type="button"
            onClick={() => setActiveTab("vehicles")}
            style={{
              padding: "10px 20px",
              borderRadius: 30,
              border: "none",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              background: activeTab === "vehicles" ? "var(--pink-700, #8B1E3F)" : "#E5E7EB",
              color: activeTab === "vehicles" ? "#fff" : "#4B5563",
              transition: "all 0.15s ease",
            }}
          >
            🚗 Vehicle Rentals & Transport ({vehicleBookings.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("services")}
            style={{
              padding: "10px 20px",
              borderRadius: 30,
              border: "none",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              background: activeTab === "services" ? "var(--pink-700, #8B1E3F)" : "#E5E7EB",
              color: activeTab === "services" ? "#fff" : "#4B5563",
              transition: "all 0.15s ease",
            }}
          >
            💍 Wedding Services Bookings ({bookings.length})
          </button>
        </div>

        {/* ============================================================ */}
        {/* VEHICLE BOOKINGS TAB */}
        {/* ============================================================ */}
        {activeTab === "vehicles" && (
          <div>
            {loadingVehicles ? (
              <div className="loading" style={{ padding: "60px 0", textAlign: "center" }}>
                Loading your vehicle bookings...
              </div>
            ) : vehicleBookings.length === 0 ? (
              <div
                style={{
                  background: "#fff",
                  padding: "60px 20px",
                  borderRadius: 16,
                  textAlign: "center",
                  border: "1px dashed #D1D5DB",
                }}
              >
                <div style={{ fontSize: 44, marginBottom: 12 }}>🚘</div>
                <h3 style={{ margin: "0 0 8px", color: "#374151" }}>No vehicle bookings yet</h3>
                <p style={{ color: "#6B7280", margin: "0 0 20px", fontSize: 14 }}>
                  Reserve self-drive luxury cars or book wedding guest transport and buses in minutes.
                </p>
                <Link href="/vehicles" to="/vehicles" className="btn btn-primary">
                  Browse Available Vehicles →
                </Link>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 20 }}>
                {vehicleBookings.map((b) => {
                  const badge = getStatusBadge(b.status);
                  const isRental = b.serviceType === "RENTAL";
                  const v = b.vehicle || {};
                  const owner = b.owner || {};

                  return (
                    <div
                      key={b._id}
                      style={{
                        background: "#fff",
                        borderRadius: 16,
                        border: "1px solid #E5E7EB",
                        padding: "24px",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 16,
                          flexWrap: "wrap",
                          gap: 10,
                          borderBottom: "1px solid #F3F4F6",
                          paddingBottom: 14,
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
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            >
                              {isRental ? "⏱️ SELF-DRIVE RENTAL" : "🚌 CHAUFFEUR TRANSPORT"}
                            </span>
                            <span style={{ fontSize: 13, color: "#6B7280", fontWeight: 600 }}>
                              Ref: <b>{b.bookingRef}</b>
                            </span>
                          </div>
                          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}>
                            {v.name || "Vehicle"}
                          </h3>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
                      </div>

                      {/* Details Grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 18 }}>
                        {isRental ? (
                          <>
                            <div>
                              <span style={{ fontSize: 12, color: "#9CA3AF", display: "block" }}>Rental Period</span>
                              <span style={{ fontSize: 14, fontWeight: 600, color: "#1F2937" }}>
                                {b.rentalDetails?.startDate ? new Date(b.rentalDetails.startDate).toLocaleDateString() : "—"} to{" "}
                                {b.rentalDetails?.endDate ? new Date(b.rentalDetails.endDate).toLocaleDateString() : "—"}
                              </span>
                              <div style={{ fontSize: 12, color: "#6B7280" }}>
                                {b.rentalDetails?.durationDays || 1} Days ({b.rentalDetails?.durationHours || 24} hrs)
                              </div>
                            </div>

                            <div>
                              <span style={{ fontSize: 12, color: "#9CA3AF", display: "block" }}>Pickup & Return</span>
                              <span style={{ fontSize: 14, fontWeight: 600, color: "#1F2937" }}>
                                {b.rentalDetails?.pickupLocation || v.pickupLocation || v.city || "Patna"}
                              </span>
                              <div style={{ fontSize: 12, color: "#6B7280" }}>
                                {b.rentalDetails?.selfDrive ? "Self-Drive Rental" : "With Chauffeur"}
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <span style={{ fontSize: 12, color: "#9CA3AF", display: "block" }}>Travel Date & Time</span>
                              <span style={{ fontSize: 14, fontWeight: 600, color: "#1F2937" }}>
                                {b.transportDetails?.travelDate ? new Date(b.transportDetails.travelDate).toLocaleDateString() : "—"} @ {b.transportDetails?.pickupTime || "10:00 AM"}
                              </span>
                              <div style={{ fontSize: 12, color: "#6B7280", textTransform: "capitalize" }}>
                                {b.transportDetails?.tripType?.replace("_", " ")} ({b.transportDetails?.passengers || 1} Passengers)
                              </div>
                            </div>

                            <div>
                              <span style={{ fontSize: 12, color: "#9CA3AF", display: "block" }}>Route</span>
                              <span style={{ fontSize: 14, fontWeight: 600, color: "#1F2937" }}>
                                {b.transportDetails?.pickupAddress} → {b.transportDetails?.destinationAddress}
                              </span>
                            </div>
                          </>
                        )}

                        <div>
                          <span style={{ fontSize: 12, color: "#9CA3AF", display: "block" }}>Total Amount</span>
                          <span style={{ fontSize: 18, fontWeight: 800, color: "var(--pink-700, #8B1E3F)" }}>
                            ₹{b.priceBreakdown?.totalAmount?.toLocaleString("en-IN") || "Quote Pending"}
                          </span>
                          {b.priceBreakdown?.securityDeposit > 0 && (
                            <div style={{ fontSize: 11, color: "#6B7280" }}>
                              (Includes ₹{b.priceBreakdown.securityDeposit} refundable deposit)
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quoted state actions */}
                      {b.status === "QUOTED" && (
                        <div
                          style={{
                            background: "#EFF6FF",
                            padding: "14px 18px",
                            borderRadius: 10,
                            border: "1px solid #BFDBFE",
                            marginBottom: 16,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 12,
                          }}
                        >
                          <div>
                            <b style={{ color: "#1E40AF", fontSize: 14 }}>Provider Quoted: ₹{b.priceBreakdown?.quotedAmount?.toLocaleString("en-IN")}</b>
                            {b.ownerResponseNotes && (
                              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#3B82F6" }}>
                                Note: {b.ownerResponseNotes}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            disabled={actionBusy}
                            onClick={() => handleAcceptQuote(b._id)}
                            className="btn btn-primary"
                            style={{ fontSize: 13, padding: "8px 18px" }}
                          >
                            ✓ Accept Quote & Confirm
                          </button>
                        </div>
                      )}

                      {/* Confirmed Provider Info */}
                      {b.status === "CONFIRMED" && (
                        <div
                          style={{
                            background: "#F0FDF4",
                            padding: "12px 16px",
                            borderRadius: 10,
                            border: "1px solid #BBF7D0",
                            marginBottom: 16,
                            fontSize: 13,
                            color: "#166534",
                            display: "flex",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: 8,
                          }}
                        >
                          <div>
                            <b>Provider Confirmed!</b> Contact: {owner.vendorProfile?.businessName || owner.name || "Provider"} ({owner.phone || "Available on request"})
                          </div>
                          <div>Status: Ready for Pickup / Departure</div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                        {["PENDING", "CONFIRMED"].includes(b.status) && (
                          <button
                            type="button"
                            disabled={actionBusy}
                            onClick={() => handleCancelBooking(b._id)}
                            style={{
                              padding: "6px 14px",
                              borderRadius: 6,
                              border: "1px solid #FCA5A5",
                              background: "#FFF",
                              color: "#DC2626",
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Cancel Request
                          </button>
                        )}
                        <Link
                          href={`/vehicles/${v._id}`}
                          to={`/vehicles/${v._id}`}
                          style={{
                            padding: "6px 14px",
                            borderRadius: 6,
                            border: "1px solid #E5E7EB",
                            background: "#F9FAFB",
                            color: "#374151",
                            fontSize: 12,
                            fontWeight: 600,
                            textDecoration: "none",
                          }}
                        >
                          View Vehicle Listing →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* WEDDING SERVICES BOOKINGS TAB */}
        {/* ============================================================ */}
        {activeTab === "services" && (
          <div>
            {loading ? (
              <div className="loading">Loading…</div>
            ) : bookings.length === 0 ? (
              <div className="empty">You haven't booked any wedding services yet.</div>
            ) : (
              <table className="data" style={{ marginTop: 16, background: "#fff", borderRadius: 12, overflow: "hidden" }}>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Event date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b._id}>
                      <td>{b.item?.title || "—"}</td>
                      <td>{b.eventDate || "—"}</td>
                      <td>₹{b.amount?.toLocaleString("en-IN")}</td>
                      <td>
                        <span className={`tag ${b.status}`}>{b.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
