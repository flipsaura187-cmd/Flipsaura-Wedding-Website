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
    return (
      <div className="py-24 text-center">
        <div className="inline-block w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4" />
        <p className="text-muted text-base font-medium">Loading bookings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-wine tracking-tight">
            Client Bookings
          </h1>
          <p className="mt-1 text-xs md:text-sm text-muted">
            Track inquiries, confirmed wedding events, and customer reservations.
          </p>
        </div>
      </div>

      {/* Locked Notice Banner */}
      {!isApproved && (
        <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl mt-0.5">🔒</span>
            <div>
              <h4 className="font-bold text-amber-950 text-sm">Booking Management is Locked</h4>
              <p className="mt-0.5 text-xs sm:text-sm text-amber-900/80 max-w-xl">
                Complete your profile and KYC verification to unlock booking management and receive couple inquiries.
              </p>
            </div>
          </div>
          <Link
            href="/vendor/onboarding"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs transition-colors shadow-2xs flex-shrink-0"
          >
            Complete Verification →
          </Link>
        </div>
      )}

      {/* Bookings Table / Empty State */}
      {list.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-line shadow-2xs">
          <div className="w-14 h-14 mx-auto rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-2xl mb-4">
            📅
          </div>
          <h3 className="font-serif text-lg font-bold text-ink mb-1">No bookings received yet</h3>
          <p className="text-muted text-xs sm:text-sm max-w-md mx-auto">
            {isApproved
              ? "New bookings and client inquiries will appear here as couples book your wedding services."
              : "Bookings will appear here once your vendor account is verified and public on FlipsAura."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-line shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-line bg-surface/60 text-xs font-semibold text-muted uppercase tracking-wider">
                  <th className="py-3.5 px-4 md:px-6">Service Item</th>
                  <th className="py-3.5 px-4 md:px-6">Customer</th>
                  <th className="py-3.5 px-4 md:px-6">Event Date</th>
                  <th className="py-3.5 px-4 md:px-6">Amount</th>
                  <th className="py-3.5 px-4 md:px-6">Status</th>
                  <th className="py-3.5 px-4 md:px-6 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-sm text-ink">
                {list.map((b) => (
                  <tr key={b._id} className="hover:bg-brand-50/30 transition-colors">
                    <td className="py-3.5 px-4 md:px-6 font-semibold text-ink">
                      {b.item?.title || "—"}
                    </td>
                    <td className="py-3.5 px-4 md:px-6">
                      <div className="font-medium text-ink">{b.name}</div>
                      <div className="text-xs text-muted font-mono">{b.phone}</div>
                    </td>
                    <td className="py-3.5 px-4 md:px-6 text-muted">
                      {b.eventDate || "—"}
                    </td>
                    <td className="py-3.5 px-4 md:px-6 font-semibold text-brand-700">
                      ₹{b.amount?.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 md:px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                          b.status === "confirmed"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : b.status === "completed"
                            ? "bg-sky-50 text-sky-700 border border-sky-200"
                            : b.status === "cancelled"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 md:px-6 text-right">
                      <select
                        disabled={!isApproved}
                        value={b.status}
                        onChange={(e) => setStatus(b._id, e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-line bg-white text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
