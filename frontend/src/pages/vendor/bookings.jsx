"use client";
import { useEffect, useState } from "react";
import Link from "@/compat/Link";
import api from "@/api/axios";

export default function VendorBookings() {
  const [list, setList] = useState([]);
  const [vendorStatus, setVendorStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () =>
    api
      .get("/api/bookings")
      .then((r) => r.data)
      .then((j) => j.ok && setList(j.data.bookings))
      .catch(() => {});

  const checkStatus = () =>
    api
      .get("/api/vendor/status")
      .then((r) => r.data)
      .then((j) => j.ok && setVendorStatus(j.data))
      .catch(() => {});

  useEffect(() => {
    Promise.all([load(), checkStatus()]).finally(() => setLoading(false));
  }, []);

  const isApproved = Boolean(vendorStatus?.isApproved);

  const setStatus = async (id, status) => {
    if (!isApproved) {
      alert("Feature locked until admin approval.");
      return;
    }
    await api.put(`/api/bookings/${id}`, { status });
    load();
  };

  if (loading) {
    return <div className="loading" style={{ padding: 40, textAlign: "center" }}>Loading bookings...</div>;
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Client Bookings</h1>
      </div>

      {!isApproved && (
        <div className="locked-card" style={{ marginBottom: 24, textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
          <div>
            <div className="locked-overlay-tag">
              <span>🔒</span> Feature Locked
            </div>
            <h4 style={{ margin: "4px 0" }}>Booking Management is Locked</h4>
            <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
              Complete your profile and verification to unlock booking management and receive couple inquiries.
            </p>
          </div>
          <Link href="/vendor/onboarding" className="btn btn-primary" style={{ fontSize: 13 }}>
            Complete Verification →
          </Link>
        </div>
      )}

      {list.length === 0 ? (
        <div style={{ background: "#fff", padding: 36, textAlign: "center", borderRadius: 12, border: "1px dashed #d1c4cb" }}>
          <p style={{ color: "var(--muted)", margin: 0 }}>
            {isApproved ? "No bookings received yet." : "Bookings will appear here once your vendor account is verified and public."}
          </p>
        </div>
      ) : (
        <table className="data">
          <thead>
            <tr><th>Item</th><th>Customer</th><th>Date</th><th>Amount</th><th>Status</th><th>Update</th></tr>
          </thead>
          <tbody>
            {list.map((b) => (
              <tr key={b._id}>
                <td>{b.item?.title || "—"}</td>
                <td>{b.name}<br /><small>{b.phone}</small></td>
                <td>{b.eventDate || "—"}</td>
                <td>₹{b.amount?.toLocaleString("en-IN")}</td>
                <td><span className={`tag ${b.status}`}>{b.status}</span></td>
                <td>
                  <select
                    disabled={!isApproved}
                    value={b.status}
                    onChange={(e) => setStatus(b._id, e.target.value)}
                  >
                    <option value="pending">pending</option>
                    <option value="confirmed">confirmed</option>
                    <option value="completed">completed</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
