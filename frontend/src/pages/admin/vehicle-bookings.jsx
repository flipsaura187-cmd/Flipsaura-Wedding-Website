"use client";
import React, { useState, useEffect } from "react";
import api from "@/api/axios";

export default function AdminVehicleBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");

  const loadBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (serviceFilter) params.append("serviceType", serviceFilter);

      const res = await api.get(`/api/vehicles/admin/bookings?${params.toString()}`);
      if (res.data?.ok) {
        setBookings(res.data.data.bookings || []);
      }
    } catch (err) {
      console.error("Failed to load admin vehicle bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [statusFilter, serviceFilter]);

  const updateStatus = async (id, status) => {
    try {
      const res = await api.patch(`/api/vehicles/admin/bookings/${id}/status`, { status });
      if (res.data?.ok) {
        loadBookings();
      } else {
        alert(res.data?.error || "Failed to update status.");
      }
    } catch (err) {
      alert(err.response?.data?.error || err.message || "Failed to update status.");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: 24, color: "#111827" }}>Vehicle Bookings Oversight</h1>
          <p style={{ margin: 0, color: "#6B7280", fontSize: 14 }}>
            Monitor and manage customer vehicle rentals, transport trips, and provider fulfillment.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", background: "#fff", padding: "14px 18px", borderRadius: 10, border: "1px solid #E5E7EB" }}>
        <select
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
          style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 13 }}
        >
          <option value="">All Services</option>
          <option value="RENTAL">Rental Only</option>
          <option value="TRANSPORT">Transport Only</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 13 }}
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="QUOTED">Quoted</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div style={{ padding: "60px 0", textAlign: "center", color: "#666" }}>
          Loading vehicle bookings...
        </div>
      ) : bookings.length === 0 ? (
        <div style={{ background: "#fff", padding: "40px", borderRadius: 12, textAlign: "center", border: "1px dashed #D1D5DB" }}>
          No vehicle bookings found matching filters.
        </div>
      ) : (
        <table className="data" style={{ background: "#fff", borderRadius: 12, overflow: "hidden" }}>
          <thead>
            <tr>
              <th>Ref / Service</th>
              <th>Vehicle</th>
              <th>Customer</th>
              <th>Owner / Provider</th>
              <th>Dates / Route</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Override</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b._id}>
                <td>
                  <b style={{ color: "var(--pink-700, #8B1E3F)", fontSize: 13 }}>{b.bookingRef}</b>
                  <div style={{ fontSize: 11, color: "#6B7280" }}>{b.serviceType}</div>
                </td>
                <td>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{b.vehicle?.name || "—"}</div>
                  <div style={{ fontSize: 11, color: "#6B7280" }}>{b.vehicle?.registrationNumber}</div>
                </td>
                <td>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{b.customerName}</div>
                  <div style={{ fontSize: 11, color: "#6B7280" }}>📞 {b.customerPhone}</div>
                </td>
                <td>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {b.owner?.vendorProfile?.businessName || b.owner?.name || "—"}
                  </div>
                  <div style={{ fontSize: 11, color: "#6B7280" }}>📞 {b.owner?.phone}</div>
                </td>
                <td>
                  <div style={{ fontSize: 12 }}>
                    {b.serviceType === "RENTAL" ? (
                      <>
                        {new Date(b.rentalDetails?.startDate).toLocaleDateString()} -{" "}
                        {new Date(b.rentalDetails?.endDate).toLocaleDateString()}
                      </>
                    ) : (
                      <>
                        {new Date(b.transportDetails?.travelDate).toLocaleDateString()}
                        <div style={{ fontSize: 11, color: "#6B7280" }}>
                          {b.transportDetails?.pickupAddress?.slice(0, 20)}... → {b.transportDetails?.destinationAddress?.slice(0, 20)}...
                        </div>
                      </>
                    )}
                  </div>
                </td>
                <td>
                  <b style={{ color: "#111827", fontSize: 14 }}>
                    ₹{b.priceBreakdown?.totalAmount?.toLocaleString("en-IN") || "—"}
                  </b>
                </td>
                <td>
                  <span className={`tag ${b.status?.toLowerCase()}`}>{b.status}</span>
                </td>
                <td>
                  <select
                    value={b.status}
                    onChange={(e) => updateStatus(b._id, e.target.value)}
                    style={{ padding: "4px 6px", borderRadius: 4, border: "1px solid #ccc", fontSize: 12 }}
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="QUOTED">QUOTED</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
