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
  const newBookingId = sp?.get("booking");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const confirmedBooking = bookings.find((b) => b._id === newBookingId);

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
      <div className="w-full px-4 sm:px-6 lg:px-10 py-20 text-center text-brand-600 font-semibold animate-pulse">
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
    <section className="py-10 md:py-14 bg-white min-h-[75vh] w-full">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-12">
        {/* Booking Confirmed Banner upon successful checkout */}
        {newBookingId && (
          <div className="mb-8 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 text-emerald-950 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <span className="text-3xl shrink-0">🎉</span>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wider">
                    Payment Successful
                  </span>
                  <span className="text-xs font-semibold text-emerald-800">
                    Booking ID: #{newBookingId}
                  </span>
                </div>
                <h3 className="font-serif font-bold text-emerald-950 text-lg md:text-xl">
                  Booking Confirmed!
                </h3>
                <p className="text-xs sm:text-sm text-emerald-900/90 mt-1 leading-relaxed">
                  {confirmedBooking?.item?.title ? (
                    <>
                      Your reservation for <strong>{confirmedBooking.item.title}</strong> scheduled for{" "}
                      <strong className="underline decoration-emerald-500 underline-offset-2">
                        📅 {confirmedBooking.eventDate || "your requested date"}
                      </strong>{" "}
                      has been received and confirmed.
                    </>
                  ) : (
                    <>
                      Your payment was received and your booking is confirmed! Details have been sent to your email.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {(() => {
                const vendorPhone =
                  confirmedBooking?.item?.contactPhone ||
                  confirmedBooking?.vendor?.phone ||
                  confirmedBooking?.item?.vendor?.phone ||
                  "";
                const cleanVendorPhone = String(vendorPhone).replace(/\D/g, "").slice(-10);
                if (!cleanVendorPhone) return null;
                return (
                  <a
                    href={`https://wa.me/91${cleanVendorPhone}?text=${encodeURIComponent(
                      `Hi ${confirmedBooking?.item?.title || "Hotel/Vendor"}! I just paid and confirmed booking #${newBookingId} on FlipsAura for date ${
                        confirmedBooking?.eventDate || "my event date"
                      }.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-teal-700/20 transition inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                  >
                    <span>🏨</span>
                    <span>WhatsApp Vendor ({cleanVendorPhone})</span>
                  </a>
                );
              })()}

              <a
                href={`https://wa.me/916202442499?text=${encodeURIComponent(
                  `Hi FlipsAura! I just paid and confirmed booking #${newBookingId} for ${
                    confirmedBooking?.item?.title || "service"
                  } on date ${confirmedBooking?.eventDate || "my event date"}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <span>💬</span>
                <span>Connect with Admin</span>
              </a>
            </div>
          </div>
        )}
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
                  <th className="py-3.5 px-5 text-right">Vendor Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-50 text-sm">
                {bookings.map((b) => {
                  const itemPhone =
                    b.item?.contactPhone ||
                    b.vendor?.phone ||
                    b.item?.vendor?.phone ||
                    b.vendor?.vendorProfile?.ownerPhone ||
                    "";
                  const cleanItemPhone = String(itemPhone).replace(/\D/g, "").slice(-10);

                  return (
                    <tr key={b._id} className="hover:bg-brand-50/30 transition-colors">
                      <td className="py-4 px-5 font-semibold text-ink">{b.item?.title || "—"}</td>
                      <td className="py-4 px-5 text-muted">{b.eventDate || "—"}</td>
                      <td className="py-4 px-5 font-bold text-brand-700">
                        ₹{b.amount?.toLocaleString("en-IN")}
                      </td>
                      <td className="py-4 px-5">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            b.status === "CONFIRMED" || b.status === "paid" || b.status === "confirmed"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : b.status === "PENDING" || b.status === "pending"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        {cleanItemPhone ? (
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            <a
                              href={`https://wa.me/91${cleanItemPhone}?text=${encodeURIComponent(
                                `Hi ${b.item?.title || "Team"}! Regarding my FlipsAura booking #${b._id} on date ${b.eventDate || "my event"}:`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 transition"
                              title={`WhatsApp ${cleanItemPhone}`}
                            >
                              <span>💬</span>
                              <span>WhatsApp</span>
                            </a>
                            <a
                              href={`tel:${cleanItemPhone}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-800 text-xs font-semibold border border-brand-200 transition"
                              title={`Call ${cleanItemPhone}`}
                            >
                              <span>📞</span>
                              <span>Call</span>
                            </a>
                          </div>
                        ) : (
                          <span className="text-muted text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

