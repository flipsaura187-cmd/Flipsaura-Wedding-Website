"use client";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Link from "@/compat/Link";
import api from "@/api/axios";

export default function AdminEventRegistrationsPage() {
  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters and Search
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (statusFilter !== "ALL") {
        if (["PAID", "FAILED"].includes(statusFilter)) {
          params.append("paymentStatus", statusFilter);
        } else if (statusFilter === "PENDING") {
          params.append("registrationStatus", "PENDING_PAYMENT");
        }
      }
      if (typeFilter !== "ALL") {
        params.append("participationType", typeFilter);
      }
      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }

      const res = await api.get(`/api/events/admin/${id}/registrations?${params.toString()}`);
      if (res.data?.ok) {
        setEvent(res.data.data.event);
        setRegistrations(res.data.data.registrations || []);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to load registrations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchRegistrations();
  }, [id, statusFilter, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRegistrations();
  };

  const handleExportCsv = async () => {
    try {
      const res = await api.get(`/api/events/admin/${id}/export`, {
        responseType: "blob",
      });
      const blobUrl = window.URL.createObjectURL(
        new Blob([res.data], { type: "text/csv;charset=utf-8;" })
      );
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", `registrations-${event?.slug || "event"}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Failed to export CSV: " + (err.response?.data?.error || err.message));
    }
  };

  // Metrics summary
  const totalCount = registrations.length;
  const paidCount = registrations.filter((r) => r.paymentStatus === "PAID").length;
  const pendingCount = registrations.filter((r) => r.paymentStatus !== "PAID" && r.registrationStatus !== "CONFIRMED").length;
  const totalRevenue = registrations
    .filter((r) => r.paymentStatus === "PAID")
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <Link
          href="/admin/events"
          to="/admin/events"
          style={{ color: "var(--wine, #8B1E3F)", fontSize: "0.88rem", fontWeight: 600, textDecoration: "none" }}
        >
          ← Back to Events List
        </Link>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            marginTop: "8px",
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "1.8rem",
                margin: "0 0 4px",
                color: "var(--wine, #8B1E3F)",
              }}
            >
              Registrations: {event?.title || "Event Dashboard"}
            </h1>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.95rem" }}>
              Live registration records, payment verification IDs, and CSV data export.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={registrations.length === 0}
              className="btn btn-outline"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "9px 18px",
                fontSize: "0.9rem",
                fontWeight: 600,
                borderRadius: "8px",
                cursor: registrations.length === 0 ? "not-allowed" : "pointer",
              }}
            >
              📊 Export to CSV / Excel
            </button>

            <Link
              href={`/events/${event?.slug}`}
              to={`/events/${event?.slug}`}
              target="_blank"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "9px 16px",
                fontSize: "0.9rem",
                fontWeight: 600,
                borderRadius: "8px",
                background: "#f3f4f6",
                color: "#374151",
                textDecoration: "none",
              }}
            >
              🔗 View Public Page
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div style={metricCardStyle}>
          <div style={metricLabelStyle}>Total Records</div>
          <div style={metricValueStyle}>{totalCount}</div>
        </div>
        <div style={metricCardStyle}>
          <div style={metricLabelStyle}>Paid / Confirmed</div>
          <div style={{ ...metricValueStyle, color: "#16a34a" }}>{paidCount}</div>
        </div>
        <div style={metricCardStyle}>
          <div style={metricLabelStyle}>Pending / Incomplete</div>
          <div style={{ ...metricValueStyle, color: "#ea580c" }}>{pendingCount}</div>
        </div>
        <div style={metricCardStyle}>
          <div style={metricLabelStyle}>Revenue Collected</div>
          <div style={{ ...metricValueStyle, color: "var(--wine, #8B1E3F)" }}>
            ₹{totalRevenue.toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "14px",
          border: "1px solid var(--line, #f3d9e4)",
          padding: "16px 20px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        {/* Filters */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--muted)", fontWeight: 600 }}>Filter:</span>
          {["ALL", "PAID", "PENDING", "FAILED"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                fontSize: "0.8rem",
                fontWeight: 600,
                border: statusFilter === s ? "none" : "1px solid #e5d8de",
                background: statusFilter === s ? "var(--pink-600, #e63f87)" : "#ffffff",
                color: statusFilter === s ? "#ffffff" : "var(--ink)",
                cursor: "pointer",
              }}
            >
              {s}
            </button>
          ))}

          <span style={{ color: "#ccc", margin: "0 4px" }}>|</span>

          {["ALL", "Individual", "Team of 3"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                fontSize: "0.8rem",
                fontWeight: 600,
                border: typeFilter === t ? "none" : "1px solid #e5d8de",
                background: typeFilter === t ? "#4a1936" : "#ffffff",
                color: typeFilter === t ? "#ffffff" : "var(--ink)",
                cursor: "pointer",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            placeholder="Search by ID, name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              border: "1.5px solid #d5ccd1",
              fontSize: "0.88rem",
              width: "260px",
              outline: "none",
            }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: "8px 16px", fontSize: "0.85rem", borderRadius: "8px" }}
          >
            Search
          </button>
        </form>
      </div>

      {error && (
        <div style={{ background: "#fee2e2", color: "#991b1b", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px" }}>
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--muted)" }}>
          <p>Loading registrations...</p>
        </div>
      ) : registrations.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            border: "1px solid var(--line, #f3d9e4)",
            padding: "60px 20px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>👥</div>
          <h3 style={{ margin: "0 0 6px" }}>No Registrations Found</h3>
          <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.92rem" }}>
            No participant records matched your filter or search query.
          </p>
        </div>
      ) : (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            border: "1px solid var(--line, #f3d9e4)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
            overflowX: "auto",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
            <thead>
              <tr style={{ background: "#faf7f9", borderBottom: "1px solid #f3d9e4" }}>
                <th style={thStyle}>Reg ID</th>
                <th style={thStyle}>Participation & Team</th>
                <th style={thStyle}>Primary Contact / Leader</th>
                <th style={thStyle}>College & City</th>
                <th style={thStyle}>Participants</th>
                <th style={thStyle}>Payment</th>
                <th style={thStyle}>Razorpay Info</th>
                <th style={thStyle}>Registered At</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((r) => {
                const isPaid = r.paymentStatus === "PAID";
                const isConfirmed = r.registrationStatus === "CONFIRMED";

                const dateStr = r.createdAt
                  ? new Date(r.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "–";

                return (
                  <tr key={r._id} style={{ borderBottom: "1px solid #f5edf1" }}>
                    {/* Reg ID */}
                    <td style={tdStyle}>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontWeight: 700,
                          fontSize: "0.92rem",
                          color: r.registrationId ? "var(--pink-700)" : "#999",
                        }}
                      >
                        {r.registrationId || "PENDING"}
                      </span>
                    </td>

                    {/* Participation & Team */}
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600 }}>{r.participationType}</div>
                      {r.teamName && (
                        <div style={{ fontSize: "0.8rem", color: "var(--pink-600)", fontWeight: 600 }}>
                          Team: {r.teamName}
                        </div>
                      )}
                    </td>

                    {/* Primary Contact / Leader */}
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 700, color: "var(--ink)" }}>{r.primaryName}</div>
                      <div style={{ fontSize: "0.8rem", color: "#555" }}>{r.primaryPhone}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{r.primaryEmail}</div>
                    </td>

                    {/* College & City */}
                    <td style={tdStyle}>
                      <div>{r.primaryCollege || "–"}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{r.city || "–"}</div>
                    </td>

                    {/* Participants list */}
                    <td style={tdStyle}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        {Array.isArray(r.participants) &&
                          r.participants.map((p, idx) => (
                            <div key={idx} style={{ fontSize: "0.8rem" }}>
                              • <strong>{p.name || p.fullName}</strong>
                              {p.isLeader && " (Leader)"}
                            </div>
                          ))}
                      </div>
                    </td>

                    {/* Payment Status */}
                    <td style={tdStyle}>
                      <span
                        style={{
                          background: isPaid ? "#dcfce7" : isConfirmed ? "#e0e7ff" : "#fee2e2",
                          color: isPaid ? "#15803d" : isConfirmed ? "#3730a3" : "#b91c1c",
                          fontSize: "0.76rem",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "10px",
                          display: "inline-block",
                          marginBottom: "4px",
                        }}
                      >
                        {r.paymentStatus}
                      </span>
                      <div style={{ fontSize: "0.82rem", fontWeight: 700 }}>
                        ₹{Number(r.amount).toLocaleString("en-IN")}
                      </div>
                    </td>

                    {/* Razorpay Info */}
                    <td style={tdStyle}>
                      <div style={{ fontSize: "0.78rem", fontFamily: "monospace", color: "#555" }}>
                        Pay ID: {r.payment?.paymentId || "–"}
                      </div>
                      <div style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "#888" }}>
                        Ord ID: {r.payment?.orderId || "–"}
                      </div>
                      {r.payment?.failureReason && (
                        <div style={{ fontSize: "0.75rem", color: "#dc2626" }}>
                          Fail: {r.payment.failureReason}
                        </div>
                      )}
                    </td>

                    {/* Date */}
                    <td style={{ ...tdStyle, fontSize: "0.8rem", color: "var(--muted)" }}>
                      {dateStr}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const metricCardStyle = {
  background: "#ffffff",
  borderRadius: "12px",
  padding: "18px 20px",
  border: "1px solid var(--line, #f3d9e4)",
  boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
};

const metricLabelStyle = {
  fontSize: "0.82rem",
  color: "var(--muted)",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  fontWeight: 600,
};

const metricValueStyle = {
  fontSize: "1.7rem",
  fontWeight: 800,
  color: "var(--ink)",
  marginTop: "4px",
};

const thStyle = {
  padding: "12px 14px",
  color: "var(--ink)",
  fontWeight: 700,
  fontSize: "0.82rem",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const tdStyle = {
  padding: "12px 14px",
  verticalAlign: "top",
};
