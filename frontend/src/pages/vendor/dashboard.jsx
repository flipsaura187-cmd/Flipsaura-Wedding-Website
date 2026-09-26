"use client";
import { useEffect, useState } from "react";

export default function VendorDashboard() {
  const [stats, setStats] = useState(null);
  useEffect(() => { fetch("/api/vendor/stats").then(r => r.json()).then(j => j.ok && setStats(j.data.stats)); }, []);
  if (!stats) return <div className="loading">Loading…</div>;
  return (
    <>
      <h1>Vendor Dashboard</h1>
      <div className="stat-grid">
        <div className="stat"><b>{stats.items}</b><span>My Items</span></div>
        <div className="stat"><b>{stats.bookings}</b><span>Bookings</span></div>
        <div className="stat"><b>₹{stats.revenue?.toLocaleString("en-IN")}</b><span>Revenue</span></div>
      </div>
    </>
  );
}
