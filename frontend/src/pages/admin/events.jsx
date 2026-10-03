"use client";
import { useEffect, useState } from "react";
import Link from "@/compat/Link";
import api from "@/api/axios";

export default function AdminEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");

  const loadEvents = async () => {
    try {
      setLoading(true);
      setActionError("");
      const res = await api.get("/api/events/admin/all");
      if (res.data?.ok && Array.isArray(res.data.data?.events)) {
        setEvents(res.data.data.events);
      }
    } catch (err) {
      setActionError(err.response?.data?.error || err.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleToggleStatus = async (event, newStatus) => {
    try {
      setActionError("");
      const res = await api.put(`/api/events/admin/${event._id}`, { status: newStatus });
      if (res.data?.ok) {
        setEvents((prev) =>
          prev.map((e) => (e._id === event._id ? { ...e, status: newStatus } : e))
        );
      }
    } catch (err) {
      setActionError(err.response?.data?.error || err.message || "Failed to update status");
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return;
    }
    try {
      setActionError("");
      const res = await api.delete(`/api/events/admin/${id}`);
      if (res.data?.ok) {
        setEvents((prev) => prev.filter((e) => e._id !== id));
      }
    } catch (err) {
      setActionError(err.response?.data?.error || err.message || "Failed to delete event");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "PUBLISHED":
        return { bg: "#dcfce7", color: "#15803d", label: "● Published" };
      case "CLOSED":
        return { bg: "#fee2e2", color: "#b91c1c", label: "● Closed" };
      case "COMPLETED":
        return { bg: "#e0e7ff", color: "#3730a3", label: "● Completed" };
      default:
        return { bg: "#f3f4f6", color: "#4b5563", label: "○ Draft" };
    }
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "1.8rem",
              margin: "0 0 6px",
              color: "var(--wine, #8B1E3F)",
            }}
          >
            Events & Competitions
          </h1>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.95rem" }}>
            Create and manage competitions, exhibitions, workshops, and view live registrations.
          </p>
        </div>

        <Link
          href="/admin/events/new"
          to="/admin/events/new"
          className="btn btn-primary"
          style={{
            padding: "10px 22px",
            fontSize: "0.95rem",
            fontWeight: 700,
            borderRadius: "8px",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>+</span> Create Event
        </Link>
      </div>

      {actionError && (
        <div
          style={{
            background: "#fee2e2",
            border: "1px solid #ef4444",
            color: "#991b1b",
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "20px",
            fontSize: "0.9rem",
          }}
        >
          {actionError}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--muted)" }}>
          <p>Loading events...</p>
        </div>
      ) : events.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            border: "1px solid var(--line, #f3d9e4)",
            padding: "60px 20px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🏆</div>
          <h3 style={{ margin: "0 0 8px" }}>No Events Created Yet</h3>
          <p style={{ color: "var(--muted)", margin: "0 0 20px", fontSize: "0.95rem" }}>
            Start by creating your first event such as a quiz cup, wedding summit, or workshop.
          </p>
          <Link href="/admin/events/new" to="/admin/events/new" className="btn btn-primary">
            + Create First Event
          </Link>
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
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.92rem" }}>
            <thead>
              <tr style={{ background: "#faf7f9", borderBottom: "1px solid #f3d9e4" }}>
                <th style={{ padding: "14px 18px", color: "var(--ink)", fontWeight: 700 }}>Event</th>
                <th style={{ padding: "14px 18px", color: "var(--ink)", fontWeight: 700 }}>Type & City</th>
                <th style={{ padding: "14px 18px", color: "var(--ink)", fontWeight: 700 }}>Date</th>
                <th style={{ padding: "14px 18px", color: "var(--ink)", fontWeight: 700 }}>Fee</th>
                <th style={{ padding: "14px 18px", color: "var(--ink)", fontWeight: 700 }}>Status</th>
                <th style={{ padding: "14px 18px", color: "var(--ink)", fontWeight: 700, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => {
                const badge = getStatusBadge(ev.status);
                const eventDate = ev.date
                  ? new Date(ev.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "TBA";

                return (
                  <tr
                    key={ev._id}
                    style={{
                      borderBottom: "1px solid #f7eff3",
                      transition: "background 0.15s ease",
                    }}
                  >
                    {/* Event Title & Thumbnail */}
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {ev.bannerImage ? (
                          <img
                            src={ev.bannerImage}
                            alt=""
                            style={{
                              width: "48px",
                              height: "48px",
                              borderRadius: "8px",
                              objectFit: "cover",
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "48px",
                              height: "48px",
                              borderRadius: "8px",
                              background: "#f3d9e4",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "1.2rem",
                              flexShrink: 0,
                            }}
                          >
                            🏆
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 700, color: "var(--ink)" }}>{ev.title}</div>
                          <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                            slug: <code>{ev.slug}</code> {ev.featured && <span style={{ color: "var(--pink-600)" }}>• Featured</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Type & City */}
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ fontWeight: 600 }}>{ev.type || "Competition"}</div>
                      <div style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
                        {ev.city ? `${ev.city}` : "Online / TBA"}
                      </div>
                    </td>

                    {/* Date */}
                    <td style={{ padding: "14px 18px", color: "var(--ink)" }}>{eventDate}</td>

                    {/* Registration Fee */}
                    <td style={{ padding: "14px 18px", fontWeight: 700, color: "var(--ink)" }}>
                      {ev.registrationFee > 0 ? `₹${Number(ev.registrationFee).toLocaleString("en-IN")}` : "Free"}
                    </td>

                    {/* Status */}
                    <td style={{ padding: "14px 18px" }}>
                      <span
                        style={{
                          background: badge.bg,
                          color: badge.color,
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          padding: "4px 10px",
                          borderRadius: "12px",
                          display: "inline-block",
                        }}
                      >
                        {badge.label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "14px 18px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                        <Link
                          href={`/admin/events/${ev._id}/registrations`}
                          to={`/admin/events/${ev._id}/registrations`}
                          style={{
                            padding: "6px 12px",
                            fontSize: "0.82rem",
                            fontWeight: 600,
                            borderRadius: "6px",
                            background: "var(--pink-50, #fff5f9)",
                            color: "var(--pink-700, #b32a68)",
                            border: "1px solid var(--pink-200, #ffd0e2)",
                            textDecoration: "none",
                          }}
                        >
                          👥 Registrations
                        </Link>

                        <Link
                          href={`/admin/events/${ev._id}/edit`}
                          to={`/admin/events/${ev._id}/edit`}
                          style={{
                            padding: "6px 12px",
                            fontSize: "0.82rem",
                            fontWeight: 600,
                            borderRadius: "6px",
                            background: "#f3f4f6",
                            color: "#374151",
                            border: "1px solid #e5e7eb",
                            textDecoration: "none",
                          }}
                        >
                          ✏️ Edit
                        </Link>

                        {/* Quick Status Toggles */}
                        {ev.status !== "PUBLISHED" ? (
                          <button
                            onClick={() => handleToggleStatus(ev, "PUBLISHED")}
                            style={{
                              padding: "6px 10px",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              borderRadius: "6px",
                              background: "#dcfce7",
                              color: "#15803d",
                              border: "1px solid #bbf7d0",
                              cursor: "pointer",
                            }}
                            title="Publish event to public"
                          >
                            Publish
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(ev, "CLOSED")}
                            style={{
                              padding: "6px 10px",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              borderRadius: "6px",
                              background: "#fee2e2",
                              color: "#b91c1c",
                              border: "1px solid #fecaca",
                              cursor: "pointer",
                            }}
                            title="Close registration"
                          >
                            Close Reg
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(ev._id, ev.title)}
                          style={{
                            padding: "6px 10px",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            borderRadius: "6px",
                            background: "transparent",
                            color: "#991b1b",
                            border: "1px solid #fecaca",
                            cursor: "pointer",
                          }}
                          title="Delete event"
                        >
                          🗑️
                        </button>
                      </div>
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
