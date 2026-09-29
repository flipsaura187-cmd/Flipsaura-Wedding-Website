"use client";
import { useEffect, useState } from "react";
import Link from "@/compat/Link";
import api from "@/api/axios";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api
      .get("/api/admin/stats")
      .then((r) => r.data)
      .then((j) => j.ok && setStats(j.data.stats));
  }, []);

  if (!stats) return <div className="loading">Loading…</div>;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
        <Link href="/admin/vendors" className="btn btn-primary" style={{ fontSize: 13 }}>
          Manage Vendors →
        </Link>
      </div>

      <div className="stat-grid" style={{ marginBottom: 28 }}>
        <div className="stat"><b>{stats.users}</b><span>Total Users</span></div>
        <div className="stat"><b>{stats.vendors || 0}</b><span>Vendors</span></div>
        <div className="stat" style={{ background: stats.pendingVendors > 0 ? "#eff6ff" : undefined }}>
          <b style={{ color: stats.pendingVendors > 0 ? "#1d4ed8" : undefined }}>{stats.pendingVendors || 0}</b>
          <span>Pending Verifications</span>
        </div>
        <div className="stat"><b>{stats.items}</b><span>Active Items</span></div>
        <div className="stat"><b>{stats.bookings}</b><span>Bookings</span></div>
        <div className="stat"><b>₹{stats.revenue?.toLocaleString("en-IN")}</b><span>Revenue</span></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        <div style={{ background: "#fff", padding: 20, borderRadius: 12, border: "1px solid #ebdbe2" }}>
          <h4 style={{ margin: "0 0 6px" }}>🏪 Vendor Verification Queue</h4>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 14px" }}>
            {stats.pendingVendors || 0} vendor applications awaiting KYC document review.
          </p>
          <Link href="/admin/vendors?status=under_review" className="btn btn-primary" style={{ fontSize: 12, padding: "6px 14px" }}>
            Open Review Queue →
          </Link>
        </div>

        <div style={{ background: "#fff", padding: 20, borderRadius: 12, border: "1px solid #ebdbe2" }}>
          <h4 style={{ margin: "0 0 6px" }}>🏷️ Wedding Categories</h4>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 14px" }}>
            Manage all 20 FlipsAura wedding categories and images.
          </p>
          <Link href="/admin/categories" className="btn btn-ghost" style={{ fontSize: 12, padding: "6px 14px", border: "1px solid #ddd" }}>
            Manage Categories →
          </Link>
        </div>

        <div style={{ background: "#fff", padding: 20, borderRadius: 12, border: "1px solid #ebdbe2" }}>
          <h4 style={{ margin: "0 0 6px" }}>📦 Listed Services & Packages</h4>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 14px" }}>
            Review vendor items, pricing packages, and active marketplace listings.
          </p>
          <Link href="/admin/items" className="btn btn-ghost" style={{ fontSize: 12, padding: "6px 14px", border: "1px solid #ddd" }}>
            Manage Items →
          </Link>
        </div>
      </div>
    </>
  );
}
