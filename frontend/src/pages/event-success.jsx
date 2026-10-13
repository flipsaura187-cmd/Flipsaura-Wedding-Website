"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "@/compat/navigation";
import Link from "@/compat/Link";
import api from "@/api/axios";

export default function EventSuccessPage() {
  const sp = useSearchParams();
  const regId = sp.get("id");

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchDetails = async () => {
      if (!regId) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get(`/api/events/registration-details/${encodeURIComponent(regId)}`);
        if (res.data?.ok && res.data.data?.registration) {
          if (isMounted) setDetails(res.data.data.registration);
        }
      } catch (err) {
        console.warn("Could not fetch full details, showing basic confirmation:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDetails();
    return () => {
      isMounted = false;
    };
  }, [regId]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const eventTitle = details?.eventTitle || "The Civic Cup";
  const organizer = details?.organizer || "Flipsaura × Marritcredence";
  const participation = details?.participationType || "Individual";
  const amount = details?.amount || 1000;
  const paymentStatus = details?.paymentStatus || "PAID";
  const eventSlug = details?.eventSlug || "the-civic-cup";

  return (
    <div className="min-h-[85vh] bg-surface py-12 px-4 sm:px-6 lg:px-8 pb-20">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-ticket, #print-ticket * {
            visibility: visible;
          }
          #print-ticket {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            box-shadow: none !important;
            border: 1px solid #ccc !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="max-w-xl mx-auto">
        {/* Ticket / Confirmation Card */}
        <div
          id="print-ticket"
          className="bg-white rounded-3xl border border-brand-100 shadow-xl overflow-hidden"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-8 sm:p-10 text-center relative">
            <div className="w-16 h-16 rounded-full bg-white text-emerald-600 text-3xl font-bold flex items-center justify-center mx-auto mb-4 shadow-lg shadow-black/10">
              ✓
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl text-white font-bold mb-2">
              Registration Confirmed!
            </h1>
            <p className="text-emerald-100 text-sm sm:text-base">
              Thank you for registering for <strong>{eventTitle}</strong>.
            </p>
          </div>

          {/* Ticket Body */}
          <div className="p-6 sm:p-8">
            {/* Registration ID Strip */}
            <div className="bg-brand-50/50 border-2 border-dashed border-brand-300 rounded-2xl p-5 text-center mb-7">
              <div className="text-xs text-muted uppercase tracking-wider font-bold">
                Official Registration ID
              </div>
              <div className="font-mono text-2xl sm:text-3xl font-extrabold text-brand-700 tracking-wide my-1">
                {regId || details?.registrationId || "PENDING"}
              </div>
              <div className="text-xs text-muted">
                Please save this registration ID for venue entry and verification.
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-surface rounded-2xl mb-7 text-sm">
              <div>
                <div className="text-[11px] text-muted uppercase font-semibold">Event</div>
                <div className="font-bold text-ink">{eventTitle}</div>
              </div>

              <div>
                <div className="text-[11px] text-muted uppercase font-semibold">Participation</div>
                <div className="font-bold text-ink">
                  {participation} {details?.teamName ? `(${details.teamName})` : ""}
                </div>
              </div>

              <div>
                <div className="text-[11px] text-muted uppercase font-semibold">Amount Paid</div>
                <div className="font-extrabold text-ink font-sans text-base">
                  ₹{Number(amount).toLocaleString("en-IN")}
                </div>
              </div>

              <div>
                <div className="text-[11px] text-muted uppercase font-semibold">Payment Status</div>
                <div>
                  <span className="bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full text-xs font-bold inline-block">
                    ● {paymentStatus}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-[11px] text-muted uppercase font-semibold">Organized By</div>
                <div className="font-semibold text-ink">{organizer}</div>
              </div>

              {details?.city && (
                <div>
                  <div className="text-[11px] text-muted uppercase font-semibold">Venue / City</div>
                  <div className="font-semibold text-ink">
                    {details.city} {details.venue ? `• ${details.venue}` : ""}
                  </div>
                </div>
              )}

              {details?.razorpayPaymentId && (
                <div className="sm:col-span-2">
                  <div className="text-[11px] text-muted uppercase font-semibold">Razorpay Payment ID</div>
                  <div className="font-mono text-xs text-muted">
                    {details.razorpayPaymentId}
                  </div>
                </div>
              )}
            </div>

            {/* Participants list if available */}
            {Array.isArray(details?.participants) && details.participants.length > 0 && (
              <div className="mb-7">
                <h4 className="font-bold text-sm text-ink mb-3">Registered Participants</h4>
                <div className="space-y-2">
                  {details.participants.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-3 bg-white border border-brand-100 rounded-xl text-xs sm:text-sm"
                    >
                      <div>
                        <strong className="text-ink">{p.fullName}</strong>{" "}
                        {p.isLeader && <span className="text-brand-600 font-bold">(Leader)</span>}
                        <div className="text-xs text-muted">{p.college} • {p.course}</div>
                      </div>
                      <div className="text-right text-xs text-muted">
                        <div>{p.mobileNumber}</div>
                        <div>{p.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tagline */}
            <div className="text-center py-4 border-t border-brand-100 mb-6">
              <div className="font-serif italic text-lg text-brand-700 font-bold">
                Think. Compete. Conquer.
              </div>
            </div>

            {/* Action Buttons */}
            <div className="no-print flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-brand-200 text-ink hover:bg-brand-50 font-semibold text-sm transition"
              >
                🖨️ Download / Print Confirmation
              </button>

              <Link
                href={`/events/${eventSlug}`}
                to={`/events/${eventSlug}`}
                className="flex-1 text-center py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md shadow-brand-600/30 transition"
              >
                Back to Event
              </Link>
            </div>
          </div>
        </div>

        {/* Support note */}
        <div className="no-print text-center mt-6 text-muted text-xs">
          A confirmation record has been generated. For any questions, contact FlipsAura Support.
        </div>
      </div>
    </div>
  );
}
