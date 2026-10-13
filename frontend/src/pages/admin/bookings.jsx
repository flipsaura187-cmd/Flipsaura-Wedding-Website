"use client";
import { useEffect, useState } from "react";
import api from "@/api/axios";

export default function AdminBookings() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .get("/api/bookings")
      .then((r) => r.data)
      .then((j) => {
        if (j.ok) setList(j.data.bookings || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const setStatus = async (id, status) => {
    await api.put(`/api/bookings/${id}`, { status });
    load();
  };

  const statusBadge = (st) => {
    switch (st) {
      case "paid":
      case "confirmed":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "cancelled":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">Bookings Management</h1>
          <p className="text-sm text-muted mt-0.5">View and update customer booking statuses</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-brand-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-ink/80">
            <thead className="bg-surface text-xs font-semibold text-muted uppercase tracking-wider border-b border-brand-100">
              <tr>
                <th className="px-5 py-4">ID</th>
                <th className="px-5 py-4">Item</th>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Event Date</th>
                <th className="px-5 py-4">Amount</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100/70">
              {loading && list.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-10 text-center text-muted">
                    Loading bookings...
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-10 text-center text-muted">
                    No bookings found.
                  </td>
                </tr>
              ) : (
                list.map((b) => (
                  <tr key={b._id} className="hover:bg-brand-50/30 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs text-muted">
                      #{String(b._id).slice(-6)}
                    </td>
                    <td className="px-5 py-4 font-semibold text-ink">
                      {b.item?.title || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-ink">{b.name}</div>
                      <div className="text-xs text-muted truncate max-w-[180px]">{b.email}</div>
                    </td>
                    <td className="px-5 py-4 text-ink/75 whitespace-nowrap">
                      {b.eventDate || "—"}
                    </td>
                    <td className="px-5 py-4 font-bold text-ink font-sans whitespace-nowrap">
                      ₹{b.amount?.toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${statusBadge(
                          b.status
                        )}`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <select
                        value={b.status}
                        onChange={(e) => setStatus(b._id, e.target.value)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-brand-200 bg-white text-ink hover:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-500 transition capitalize"
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
