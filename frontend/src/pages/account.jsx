"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

import api from "@/api/axios";
export default function AccountPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: j } = await api.get("/api/bookings");
      if (j.ok) setBookings(j.data.bookings);
      setLoading(false);
    })();
  }, []);

  if (!user) {
    return (
      <div className="max-w-container mx-auto px-4 py-20 text-center text-brand-600 font-semibold animate-pulse">
        Loading account details…
      </div>
    );
  }

  return (
    <section className="py-12 md:py-16 bg-white min-h-[75vh]">
      <div className="max-w-container mx-auto px-4 sm:px-6">
        <div className="bg-brand-50/70 p-6 sm:p-8 rounded-2xl border border-brand-100 mb-10">
          <h1 className="font-serif text-3xl font-bold text-ink">Hi, {user.name}</h1>
          <p className="text-muted text-sm mt-1">
            {user.email} · <span className="capitalize font-semibold text-brand-700">{user.role}</span>
          </p>
        </div>

        <h2 className="font-serif text-2xl font-bold text-ink mb-6">Your Bookings</h2>

        {loading ? (
          <div className="py-12 text-center text-brand-600 font-semibold animate-pulse">
            Loading bookings…
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center bg-brand-50/50 rounded-2xl border border-brand-100 text-muted">
            You haven't booked anything yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-brand-100 shadow-sm">
            <table className="w-full text-left border-collapse bg-white">
              <thead>
                <tr className="bg-brand-50/80 border-b border-brand-100 text-xs font-bold uppercase tracking-wider text-muted">
                  <th className="py-3.5 px-5">Item</th>
                  <th className="py-3.5 px-5">Event Date</th>
                  <th className="py-3.5 px-5">Amount</th>
                  <th className="py-3.5 px-5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-50 text-sm">
                {bookings.map((b) => (
                  <tr key={b._id} className="hover:bg-brand-50/30 transition-colors">
                    <td className="py-4 px-5 font-semibold text-ink">{b.item?.title || "—"}</td>
                    <td className="py-4 px-5 text-muted">{b.eventDate || "—"}</td>
                    <td className="py-4 px-5 font-bold text-brand-700">
                      ₹{b.amount?.toLocaleString("en-IN")}
                    </td>
                    <td className="py-4 px-5">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          b.status === "CONFIRMED" || b.status === "PAID"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : b.status === "PENDING"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

