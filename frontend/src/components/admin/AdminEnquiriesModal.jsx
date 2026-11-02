"use client";
import { useState, useEffect } from "react";
import api from "@/api/axios";

export default function AdminEnquiriesModal({ isOpen, onClose }) {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState("");

  const loadEnquiries = async () => {
    try {
      setLoading(true);
      setError("");
      const params = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const res = await api.get("/api/admin/enquiries", { params });
      if (res.data?.ok) {
        setEnquiries(res.data.data.enquiries || []);
      }
    } catch (err) {
      console.error("Load enquiries error:", err);
      setError(err.response?.data?.error || "Failed to load booking enquiries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadEnquiries();
    }
  }, [isOpen, statusFilter]);

  if (!isOpen) return null;

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      setActionMsg("");
      const res = await api.put(`/api/admin/enquiries/${id}/status`, { status: newStatus });
      if (res.data?.ok) {
        setActionMsg(`Enquiry status updated to ${newStatus}.`);
        loadEnquiries();
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update enquiry status");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-brand-100 flex flex-col max-h-[90vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-brand-700 to-rose-700 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📋</span>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold">Customer Booking Enquiries</h2>
              <p className="text-xs text-brand-100">
                Review dates, guest counts, packages and update lead statuses
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            ✕
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-sand-50/70 border-b border-brand-100">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-ink-muted">Status:</span>
            {["all", "pending", "contacted", "confirmed", "cancelled"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                  statusFilter === st
                    ? "bg-brand-600 text-white shadow-xs"
                    : "bg-white text-ink-muted border border-brand-200 hover:border-brand-400"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search by customer name, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadEnquiries()}
              className="px-3.5 py-1.5 rounded-xl border border-brand-200 text-xs w-full sm:w-60 bg-white"
            />
            <button
              type="button"
              onClick={loadEnquiries}
              className="px-3 py-1.5 bg-brand-600 text-white rounded-xl text-xs font-bold"
            >
              Search
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {actionMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
              <span>✓</span> {actionMsg}
            </div>
          )}
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          {loading ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-brand-600 font-semibold">Loading enquiries...</p>
            </div>
          ) : enquiries.length === 0 ? (
            <div className="py-20 text-center bg-sand-50 rounded-2xl border border-dashed border-brand-200">
              <span className="text-4xl block mb-2">📬</span>
              <p className="text-sm font-semibold text-ink">No booking enquiries found</p>
              <p className="text-xs text-ink-muted mt-1">
                When customers submit an enquiry on venue profile pages, they appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {enquiries.map((enq) => (
                <div
                  key={enq._id}
                  className="p-4 bg-white rounded-2xl border border-brand-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-ink">{enq.customerName}</span>
                      <a
                        href={`tel:${enq.customerPhone}`}
                        className="text-xs font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md hover:underline"
                      >
                        📞 {enq.customerPhone}
                      </a>
                      {enq.customerEmail && (
                        <span className="text-xs text-ink-muted">✉️ {enq.customerEmail}</span>
                      )}
                    </div>

                    <div className="text-xs text-ink">
                      <span className="font-semibold text-brand-800">Venue: </span>
                      <span className="font-medium">{enq.item?.title || "Venue/Service"}</span>
                      {enq.item?.city && <span className="text-ink-muted"> ({enq.item.city})</span>}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted">
                      {enq.eventDate && (
                        <span className="font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                          📅 Event Date: {enq.eventDate}
                        </span>
                      )}
                      {enq.guestCount > 0 && (
                        <span>👥 {enq.guestCount} Guests</span>
                      )}
                      {enq.selectedPackage && (
                        <span className="bg-sand-100 text-ink px-2 py-0.5 rounded-md font-medium">
                          🎁 Package: {enq.selectedPackage}
                        </span>
                      )}
                    </div>

                    {enq.notes && (
                      <p className="text-xs bg-sand-50 p-2 rounded-xl text-ink-muted border border-brand-100 italic">
                        "{enq.notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex md:flex-col items-center md:items-end justify-between gap-2 shrink-0">
                    <select
                      value={enq.status}
                      onChange={(e) => handleUpdateStatus(enq._id, e.target.value)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold capitalize bg-white cursor-pointer ${
                        enq.status === "confirmed"
                          ? "border-emerald-300 text-emerald-800 bg-emerald-50"
                          : enq.status === "contacted"
                          ? "border-blue-300 text-blue-800 bg-blue-50"
                          : enq.status === "cancelled"
                          ? "border-rose-300 text-rose-800 bg-rose-50"
                          : "border-amber-300 text-amber-800 bg-amber-50"
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="contacted">Contacted</option>
                      <option value="confirmed">Confirmed (Blackouts Date)</option>
                      <option value="cancelled">Cancelled</option>
                    </select>

                    <span className="text-[10px] text-ink-muted">
                      {new Date(enq.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-brand-100 bg-sand-50/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-brand-600 text-white font-semibold rounded-xl text-xs hover:bg-brand-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

