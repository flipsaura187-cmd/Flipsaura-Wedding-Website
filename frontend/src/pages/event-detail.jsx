"use client";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Link from "@/compat/Link";
import api from "@/api/axios";

export default function EventDetailPage() {
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchEvent = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.get(`/api/events/${slug}`);
        if (res.data?.ok && res.data.data?.event) {
          if (isMounted) setEvent(res.data.data.event);
        } else {
          if (isMounted) setError("Event not found");
        }
      } catch (err) {
        if (isMounted) setError(err.response?.data?.message || err.message || "Failed to load event details");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (slug) fetchEvent();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center text-muted">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-base sm:text-lg font-medium">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-2xl mx-auto mb-4">
          ⚠️
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-ink mb-3">Event Not Found</h2>
        <p className="text-muted max-w-md mx-auto mb-6">
          {error || "The event you are looking for does not exist or has been removed."}
        </p>
        <Link
          href="/events"
          to="/events"
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-medium transition-all shadow-md shadow-brand-600/20"
        >
          Browse All Events
        </Link>
      </div>
    );
  }

  const isRegistrationOpen = event.isRegistrationOpen && event.status === "PUBLISHED";
  const formattedDate = event.date
    ? new Date(event.date).toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="min-h-[90vh] bg-surface pb-20">
      {/* Hero Banner Section */}
      <section className="relative bg-gradient-to-br from-[#1f0f1c] via-[#3d142c] to-[#5a1936] text-white py-16 md:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-1/4 right-10 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-4xl">
            {/* Breadcrumb & Badges */}
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              <Link
                href="/events"
                to="/events"
                className="text-brand-300 hover:text-white text-sm font-semibold inline-flex items-center gap-1 transition-colors"
              >
                ← All Events
              </Link>
              <span className="text-white/40">|</span>
              <span className="bg-gold/20 text-gold px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
                {event.type || "Competition"}
              </span>
              {event.featured && (
                <span className="bg-gradient-to-r from-brand-600 to-brand-700 text-white px-3 py-1 rounded-full text-xs font-bold tracking-wide">
                  ⭐ Featured Event
                </span>
              )}
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white font-bold tracking-tight leading-tight mb-4">
              {event.title}
            </h1>

            <p className="text-base sm:text-lg text-brand-100 font-medium mb-3">
              Organized by: <strong className="text-white">{event.organizer || "FlipsAura × Marritcredence"}</strong>
            </p>

            <p className="text-sm sm:text-base text-white/85 leading-relaxed mb-8 max-w-2xl font-sans">
              {event.shortDescription || event.description}
            </p>

            {/* Quick Badges Strip */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10">
                <span className="text-xl">📍</span>
                <div>
                  <div className="text-[11px] text-white/60 uppercase font-semibold tracking-wider">Venue</div>
                  <div className="text-sm font-semibold text-white">
                    {event.city ? `${event.city} • ${event.venue}` : event.venue}
                  </div>
                </div>
              </div>

              {formattedDate && (
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10">
                  <span className="text-xl">📅</span>
                  <div>
                    <div className="text-[11px] text-white/60 uppercase font-semibold tracking-wider">Date</div>
                    <div className="text-sm font-semibold text-white">{formattedDate}</div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10">
                <span className="text-xl">💰</span>
                <div>
                  <div className="text-[11px] text-white/60 uppercase font-semibold tracking-wider">Registration Fee</div>
                  <div className="text-sm font-bold text-gold">
                    {event.registrationFee > 0 ? `₹${Number(event.registrationFee).toLocaleString("en-IN")}` : "Free"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Detailed Sections */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            
            {/* Banner Image Preview */}
            {event.bannerImage && (
              <div className="rounded-2xl overflow-hidden shadow-xl border border-brand-100 bg-ink max-h-[440px]">
                <img
                  src={event.bannerImage}
                  alt={event.title}
                  className="w-full h-full object-cover block"
                />
              </div>
            )}

            {/* About Event */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-brand-100">
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink mb-4 flex items-center gap-2.5">
                <span>📖</span> About The Event
              </h2>
              <div className="text-base text-ink/80 leading-relaxed whitespace-pre-line font-sans">
                {event.description}
              </div>
            </div>

            {/* Prizes Section */}
            {Array.isArray(event.prizes) && event.prizes.length > 0 && (
              <div className="bg-gradient-to-br from-white to-brand-50/40 rounded-2xl p-6 sm:p-8 shadow-sm border border-brand-100">
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-6">
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink flex items-center gap-2.5">
                    <span>🏆</span> Cash Prizes & Rewards
                  </h2>
                  <span className="text-sm font-bold text-brand-600">
                    Total Prize Pool: ₹{event.prizes.reduce((s, p) => s + (Number(p.amount) || 0), 0).toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {event.prizes.map((p, idx) => {
                    const isFirst = idx === 0 || p.rank?.includes("1");
                    const isSecond = idx === 1 || p.rank?.includes("2");
                    const medalBg = isFirst
                      ? "bg-amber-50/80 border-amber-300"
                      : isSecond
                      ? "bg-slate-50 border-slate-300"
                      : "bg-orange-50/80 border-orange-300";
                    const medalIcon = isFirst ? "🥇" : isSecond ? "🥈" : "🥉";

                    return (
                      <div
                        key={idx}
                        className={`rounded-xl border p-5 text-center shadow-sm ${medalBg}`}
                      >
                        <div className="text-3xl mb-1.5">{medalIcon}</div>
                        <div className="text-sm font-bold text-ink mb-1">
                          {p.rank}
                        </div>
                        <div className="text-2xl font-extrabold text-brand-700 font-sans">
                          ₹{Number(p.amount).toLocaleString("en-IN")}
                        </div>
                        {p.description && (
                          <div className="text-xs text-muted mt-1.5">
                            {p.description}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Benefits / Why Participate */}
            {Array.isArray(event.benefits) && event.benefits.length > 0 && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-brand-100">
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink mb-4 flex items-center gap-2.5">
                  <span>✨</span> Why Participate?
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {event.benefits.map((b, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3.5 bg-brand-50/50 rounded-xl border border-brand-100"
                    >
                      <span className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        ✓
                      </span>
                      <span className="text-sm font-medium text-ink">{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Event Format / Rounds */}
            {Array.isArray(event.eventFormat) && event.eventFormat.length > 0 && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-brand-100">
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink mb-4 flex items-center gap-2.5">
                  <span>🎯</span> Event Format & Rounds
                </h2>
                <div className="space-y-3.5">
                  {event.eventFormat.map((r, idx) => (
                    <div
                      key={idx}
                      className="p-4 sm:p-5 bg-surface rounded-xl border-l-4 border-l-brand-600"
                    >
                      <div className="text-base font-bold text-ink mb-1">
                        {r.round || `Round ${idx + 1}`}
                      </div>
                      <div className="text-sm text-ink/75 leading-relaxed">
                        {r.details || r}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rules & Regulations */}
            {Array.isArray(event.rules) && event.rules.length > 0 && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-brand-100">
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink mb-4 flex items-center gap-2.5">
                  <span>📋</span> Rules & Guidelines
                </h2>
                <ol className="list-decimal list-inside space-y-2.5 text-sm sm:text-base text-ink/80 leading-relaxed">
                  {event.rules.map((rule, idx) => (
                    <li key={idx}>
                      {rule}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* FAQs */}
            {Array.isArray(event.faqs) && event.faqs.length > 0 && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-brand-100">
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink mb-4 flex items-center gap-2.5">
                  <span>❓</span> Frequently Asked Questions
                </h2>
                <div className="space-y-2.5">
                  {event.faqs.map((faq, idx) => {
                    const isOpen = activeFaq === idx;
                    return (
                      <div
                        key={idx}
                        className={`border rounded-xl overflow-hidden transition-colors ${
                          isOpen ? "border-brand-200 bg-brand-50/40" : "border-brand-100 bg-white"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setActiveFaq(isOpen ? null : idx)}
                          className="w-full text-left p-4 sm:p-5 flex justify-between items-center text-sm sm:text-base font-semibold text-ink"
                        >
                          <span>{faq.question}</span>
                          <span className="text-lg text-brand-600 font-bold ml-2">
                            {isOpen ? "−" : "+"}
                          </span>
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-sm text-ink/75 leading-relaxed">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Contact & Support */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-brand-100">
              <h3 className="font-serif text-lg sm:text-xl font-bold text-ink mb-2">Have Questions or Need Assistance?</h3>
              <p className="text-sm text-muted mb-4">
                Our event coordination committee is here to assist participants and colleges.
              </p>
              <div className="flex flex-wrap gap-6 text-sm">
                {event.contactInformation?.email && (
                  <div>
                    <span className="text-muted">Email: </span>
                    <a href={`mailto:${event.contactInformation.email}`} className="text-brand-600 font-semibold hover:underline">
                      {event.contactInformation.email}
                    </a>
                  </div>
                )}
                {event.contactInformation?.phone && (
                  <div>
                    <span className="text-muted">Phone / WhatsApp: </span>
                    <a href={`tel:${event.contactInformation.phone}`} className="text-brand-600 font-semibold hover:underline">
                      {event.contactInformation.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Sticky Registration Box */}
          <div className="lg:col-span-4 sticky top-24">
            <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-lg border border-brand-200">
              <div className="text-center mb-5 pb-5 border-b border-brand-100">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Registration Fee
                </span>
                <div className="text-4xl font-extrabold text-brand-700 my-1 font-sans">
                  {event.registrationFee > 0 ? `₹${Number(event.registrationFee).toLocaleString("en-IN")}` : "FREE"}
                </div>
                <div className="text-xs text-muted">
                  Per Registration (Individual or Team)
                </div>
              </div>

              {/* Event Attributes */}
              <div className="space-y-3.5 mb-6 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted">Participation:</span>
                  <span className="font-semibold text-ink text-right">
                    {Array.isArray(event.participationTypes) && event.participationTypes.length > 0
                      ? event.participationTypes.join(" / ")
                      : "Individual / Team of 3"}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-muted">Venue:</span>
                  <span className="font-semibold text-ink text-right max-w-[180px] truncate">
                    {event.city ? `${event.city}` : event.venue}
                  </span>
                </div>

                {formattedDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted">Date:</span>
                    <span className="font-semibold text-ink">
                      {new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                )}

                {event.startTime && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted">Time:</span>
                    <span className="font-semibold text-ink">
                      {event.startTime} {event.endTime ? `– ${event.endTime}` : ""}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-muted">Status:</span>
                  <span
                    className={`font-bold flex items-center gap-1.5 ${
                      isRegistrationOpen ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    <span>●</span> {isRegistrationOpen ? "Open for Registration" : "Registration Closed"}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              {isRegistrationOpen ? (
                <Link
                  href={`/events/${event.slug}/register`}
                  to={`/events/${event.slug}/register`}
                  className="w-full text-center block py-3.5 px-6 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-bold text-base shadow-lg shadow-brand-600/30 hover:shadow-brand-600/50 transition-all transform hover:-translate-y-0.5"
                >
                  REGISTER NOW →
                </Link>
              ) : (
                <div className="w-full text-center py-3.5 px-6 rounded-xl bg-slate-100 text-slate-500 font-bold text-sm border border-dashed border-slate-300">
                  REGISTRATION CLOSED
                </div>
              )}

              <div className="mt-4 text-[11px] text-muted text-center leading-relaxed">
                🔒 100% Secure Checkout powered by Razorpay.
                Instant digital confirmation upon payment.
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
