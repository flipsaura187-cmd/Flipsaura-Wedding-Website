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
        return { badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200", label: "● Published" };
      case "CLOSED":
        return { badgeClass: "bg-rose-100 text-rose-800 border-rose-200", label: "● Closed" };
      case "COMPLETED":
        return { badgeClass: "bg-indigo-100 text-indigo-800 border-indigo-200", label: "● Completed" };
      default:
        return { badgeClass: "bg-slate-100 text-slate-700 border-slate-200", label: "○ Draft" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">Events & Competitions</h1>
          <p className="text-sm text-muted mt-0.5">
            Create and manage competitions, exhibitions, workshops, and view live registrations.
          </p>
        </div>

        <Link
          href="/admin/events/new"
          to="/admin/events/new"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-sm transition"
        >
          <span>+</span> Create Event
        </Link>
      </div>

      {actionError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-sm font-medium">
          {actionError}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-brand-100 p-12 text-center text-muted">
          <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm">Loading events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="py-16 px-6 text-center bg-white rounded-3xl border-2 border-dashed border-brand-200">
          <div className="text-5xl mb-3">🏆</div>
          <h3 className="font-serif text-xl font-bold text-ink mb-1.5">No Events Created Yet</h3>
          <p className="text-muted max-w-md mx-auto mb-6 text-sm">
            Start by creating your first event such as a quiz cup, wedding summit, or workshop.
          </p>
          <Link
            href="/admin/events/new"
            to="/admin/events/new"
            className="inline-flex items-center px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-sm transition"
          >
            + Create First Event
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-brand-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-ink/80">
              <thead className="bg-surface text-xs font-semibold text-muted uppercase tracking-wider border-b border-brand-100">
                <tr>
                  <th className="px-5 py-4">Event</th>
                  <th className="px-5 py-4">Type & City</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Fee</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100/70">
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
                    <tr key={ev._id} className="hover:bg-brand-50/30 transition-colors">
                      {/* Event Title & Thumbnail */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {ev.bannerImage ? (
                            <img
                              src={ev.bannerImage}
                              alt=""
                              className="w-12 h-12 rounded-xl object-cover border border-brand-100 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-xl flex-shrink-0">
                              🏆
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-ink">{ev.title}</div>
                            <div className="text-xs text-muted">
                              slug: <code className="font-mono">{ev.slug}</code>{" "}
                              {ev.featured && <span className="text-brand-600 font-bold">• Featured</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Type & City */}
                      <td className="px-5 py-4">
                        <div className="font-medium text-ink">{ev.type || "Competition"}</div>
                        <div className="text-xs text-muted">
                          {ev.city ? `${ev.city}` : "Online / TBA"}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 text-xs text-ink/80 whitespace-nowrap">
                        {eventDate}
                      </td>

                      {/* Registration Fee */}
                      <td className="px-5 py-4 font-bold text-ink font-sans whitespace-nowrap">
                        {ev.registrationFee > 0 ? `₹${Number(ev.registrationFee).toLocaleString("en-IN")}` : "Free"}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.badgeClass}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                          <Link
                            href={`/admin/events/${ev._id}/registrations`}
                            to={`/admin/events/${ev._id}/registrations`}
                            className="px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200 text-xs font-semibold transition"
                          >
                            👥 Registrations
                          </Link>

                          <Link
                            href={`/admin/events/${ev._id}/edit`}
                            to={`/admin/events/${ev._id}/edit`}
                            className="px-2.5 py-1 rounded-lg bg-surface hover:bg-brand-50 text-ink border border-brand-200 text-xs font-semibold transition"
                          >
                            ✏️ Edit
                          </Link>

                          {/* Quick Status Toggles */}
                          {ev.status !== "PUBLISHED" ? (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(ev, "PUBLISHED")}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition"
                              title="Publish event to public"
                            >
                              Publish
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(ev, "CLOSED")}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold transition"
                              title="Close registration"
                            >
                              Close Reg
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDelete(ev._id, ev.title)}
                            className="px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-semibold transition"
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
        </div>
      )}
    </div>
  );
}
