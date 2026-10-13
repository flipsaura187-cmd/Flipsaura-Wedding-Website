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
  const pendingCount = registrations.filter(
    (r) => r.paymentStatus !== "PAID" && r.registrationStatus !== "CONFIRMED"
  ).length;
  const totalRevenue = registrations
    .filter((r) => r.paymentStatus === "PAID")
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/events"
          to="/admin/events"
          className="text-brand-600 hover:text-brand-700 text-sm font-semibold inline-flex items-center gap-1 transition"
        >
          ← Back to Events List
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
              Registrations: {event?.title || "Event Dashboard"}
            </h1>
            <p className="text-sm text-muted mt-0.5">
              Live registration records, payment verification IDs, and CSV data export.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={registrations.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-brand-200 text-ink hover:bg-brand-50 text-xs sm:text-sm font-semibold transition disabled:opacity-50"
            >
              📊 Export CSV
            </button>

            {event?.slug && (
              <Link
                href={`/events/${event.slug}`}
                to={`/events/${event.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface hover:bg-brand-50 text-ink border border-brand-200 text-xs sm:text-sm font-semibold transition"
              >
                🔗 View Public Page
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-brand-100 shadow-sm flex flex-col justify-between">
          <div className="text-xs text-muted font-semibold uppercase tracking-wider">Total Records</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-ink mt-2 font-sans">{totalCount}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-brand-100 shadow-sm flex flex-col justify-between">
          <div className="text-xs text-muted font-semibold uppercase tracking-wider">Paid / Confirmed</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-2 font-sans">{paidCount}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-brand-100 shadow-sm flex flex-col justify-between">
          <div className="text-xs text-muted font-semibold uppercase tracking-wider">Pending / Incomplete</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-2 font-sans">{pendingCount}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-brand-100 shadow-sm flex flex-col justify-between">
          <div className="text-xs text-muted font-semibold uppercase tracking-wider">Revenue Collected</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-brand-700 mt-2 font-sans truncate">
            ₹{totalRevenue.toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-brand-100 p-4 sm:p-5 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted font-bold uppercase tracking-wider mr-1">Status:</span>
          {["ALL", "PAID", "PENDING", "FAILED"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                statusFilter === s
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-surface text-ink/75 hover:bg-brand-50"
              }`}
            >
              {s}
            </button>
          ))}

          <span className="text-brand-200 mx-1">|</span>

          <span className="text-xs text-muted font-bold uppercase tracking-wider mr-1">Type:</span>
          {["ALL", "Individual", "Team of 3"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                typeFilter === t
                  ? "bg-ink text-white shadow-sm"
                  : "bg-surface text-ink/75 hover:bg-brand-50"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full lg:w-auto">
          <input
            type="text"
            placeholder="Search by ID, name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 lg:w-64 px-3.5 py-1.5 rounded-xl border border-brand-200 text-xs text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <button
            type="submit"
            className="px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm transition"
          >
            Search
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-brand-100 p-12 text-center text-muted">
          <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm">Loading registrations...</p>
        </div>
      ) : registrations.length === 0 ? (
        <div className="py-16 px-6 text-center bg-white rounded-3xl border border-brand-100">
          <div className="text-4xl mb-2">👥</div>
          <h3 className="font-serif text-lg font-bold text-ink mb-1">No Registrations Found</h3>
          <p className="text-muted text-xs">
            No participant records matched your filter or search query.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-brand-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-ink/80">
              <thead className="bg-surface text-[11px] font-bold text-muted uppercase tracking-wider border-b border-brand-100">
                <tr>
                  <th className="px-4 py-3.5">Reg ID</th>
                  <th className="px-4 py-3.5">Participation</th>
                  <th className="px-4 py-3.5">Primary Contact / Leader</th>
                  <th className="px-4 py-3.5">College & City</th>
                  <th className="px-4 py-3.5">Participants</th>
                  <th className="px-4 py-3.5">Payment</th>
                  <th className="px-4 py-3.5">Razorpay Info</th>
                  <th className="px-4 py-3.5">Registered At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100/70">
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
                    <tr key={r._id} className="hover:bg-brand-50/30 transition-colors">
                      {/* Reg ID */}
                      <td className="px-4 py-3.5 align-top">
                        <span
                          className={`font-mono font-bold text-xs ${
                            r.registrationId ? "text-brand-700" : "text-muted"
                          }`}
                        >
                          {r.registrationId || "PENDING"}
                        </span>
                      </td>

                      {/* Participation & Team */}
                      <td className="px-4 py-3.5 align-top">
                        <div className="font-semibold text-ink">{r.participationType}</div>
                        {r.teamName && (
                          <div className="text-[11px] text-brand-600 font-bold mt-0.5">
                            Team: {r.teamName}
                          </div>
                        )}
                      </td>

                      {/* Primary Contact / Leader */}
                      <td className="px-4 py-3.5 align-top">
                        <div className="font-bold text-ink">{r.primaryName}</div>
                        <div className="text-xs text-ink/70">{r.primaryPhone}</div>
                        <div className="text-xs text-muted truncate max-w-[160px]">{r.primaryEmail}</div>
                      </td>

                      {/* College & City */}
                      <td className="px-4 py-3.5 align-top">
                        <div className="text-ink">{r.primaryCollege || "–"}</div>
                        <div className="text-xs text-muted">{r.city || "–"}</div>
                      </td>

                      {/* Participants list */}
                      <td className="px-4 py-3.5 align-top">
                        <div className="space-y-0.5 text-xs">
                          {Array.isArray(r.participants) &&
                            r.participants.map((p, idx) => (
                              <div key={idx}>
                                • <strong>{p.name || p.fullName}</strong>
                                {p.isLeader && " (Leader)"}
                              </div>
                            ))}
                        </div>
                      </td>

                      {/* Payment Status */}
                      <td className="px-4 py-3.5 align-top">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold border mb-1 ${
                            isPaid
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : isConfirmed
                              ? "bg-indigo-100 text-indigo-800 border-indigo-200"
                              : "bg-rose-100 text-rose-800 border-rose-200"
                          }`}
                        >
                          {r.paymentStatus}
                        </span>
                        <div className="font-extrabold text-ink font-sans text-xs sm:text-sm">
                          ₹{Number(r.amount).toLocaleString("en-IN")}
                        </div>
                      </td>

                      {/* Razorpay Info */}
                      <td className="px-4 py-3.5 align-top text-[11px] font-mono text-muted space-y-0.5">
                        <div>Pay ID: {r.payment?.paymentId || "–"}</div>
                        <div>Ord ID: {r.payment?.orderId || "–"}</div>
                        {r.payment?.failureReason && (
                          <div className="text-rose-600 font-sans">
                            Fail: {r.payment.failureReason}
                          </div>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 align-top text-xs text-muted whitespace-nowrap">
                        {dateStr}
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
