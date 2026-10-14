"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams } from "@/compat/navigation";
import Link from "@/compat/Link";
import api from "@/api/axios";

export default function AccountPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const [sp] = useSearchParams();
  const isVerifiedBanner = sp?.get("verified") === "true";
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: j } = await api.get("/api/bookings");
        if (j.ok) setBookings(j.data.bookings || []);
      } catch (err) {
        console.warn("Failed to load bookings:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (authLoading) {
    return (
      <div className="max-w-container mx-auto px-4 py-20 text-center text-brand-600 font-semibold animate-pulse">
        Loading account details…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-2xl border border-line p-8 shadow-sm">
          <div className="text-4xl mb-3">🔒</div>
          <h2 className="font-serif text-2xl font-bold text-ink mb-2">Sign in required</h2>
          <p className="text-muted text-sm mb-6">
            Please sign in to view your bookings and account profile.
          </p>
          <Link
            href="/login?next=/account"
            className="inline-block w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition"
          >
            Sign In →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className="py-12 md:py-16 bg-white min-h-[75vh]">
      <div className="max-w-container mx-auto px-4 sm:px-6">
        {isVerifiedBanner && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 shadow-sm flex items-start gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <h3 className="font-bold text-emerald-950 text-base">
                WhatsApp Number Verified Successfully!
              </h3>
              <p className="text-xs sm:text-sm text-emerald-800 mt-0.5">
                Welcome to FlipsAura, <strong>{user.name}</strong>! Your account is active and you are signed in.
              </p>
            </div>
          </div>
        )}

        <div className="bg-brand-50/70 p-6 sm:p-8 rounded-2xl border border-brand-100 mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-3xl font-bold text-ink">Hi, {user.name}</h1>
              <span className="capitalize font-semibold text-xs px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800 border border-brand-200">
                {user.role}
              </span>
            </div>
            <div className="text-muted text-sm mt-2 flex flex-wrap items-center gap-y-1 gap-x-3">
              <span>📧 {user.email}</span>
              {user.phone && (
                <span className="inline-flex items-center gap-1.5 font-mono text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-xs">
                  <span>💬 +91 {user.phone}</span>
                  <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded-full uppercase">Verified ✓</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={logout}
              className="px-4 py-2 rounded-xl border border-rose-200 bg-white text-rose-700 hover:bg-rose-50 text-xs font-semibold transition cursor-pointer"
            >
              Sign Out
            </button>
          </div>
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

