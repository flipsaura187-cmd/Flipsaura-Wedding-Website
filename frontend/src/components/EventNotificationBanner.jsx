import { useEffect, useState } from "react";
import Link from "@/compat/Link";
import api from "@/api/axios";

export default function EventNotificationBanner() {
  const [events, setEvents] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchEvents = async () => {
      try {
        const res = await api.get("/api/events?status=PUBLISHED");
        if (res.data?.ok && Array.isArray(res.data.data?.events)) {
          if (isMounted) {
            setEvents(res.data.data.events);
          }
        }
      } catch (err) {
        console.warn("Could not load active events banner:", err?.message);
      }
    };
    fetchEvents();
    return () => {
      isMounted = false;
    };
  }, []);

  // Auto rotate if multiple events
  useEffect(() => {
    if (events.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % events.length);
    }, 6500);
    return () => clearInterval(interval);
  }, [events.length]);

  if (dismissed || !events || events.length === 0) {
    return null;
  }

  const event = events[currentIndex];
  const feeDisplay =
    event.registrationFee > 0
      ? `₹${Number(event.registrationFee).toLocaleString("en-IN")} Registration Fee`
      : "Free Registration";

  return (
    <div className="relative overflow-hidden z-40 bg-gradient-to-r from-[#2a1726] via-[#4a1936] to-[#2a1726] text-white border-b-2 border-gold/40 shadow-lg">
      {/* Decorative accent glow */}
      <div className="absolute -top-1/2 left-[20%] w-72 h-24 bg-brand-500/30 rounded-full blur-2xl pointer-events-none" />

      <div className="max-w-container mx-auto px-4 py-2.5 flex items-center justify-between flex-wrap gap-3 relative">
        {/* Left: Badge & Info */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1 bg-gradient-to-r from-brand-600 to-brand-400 text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md shadow-brand-500/25">
            🎉 UPCOMING EVENT
          </span>

          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-serif text-base md:text-lg font-bold text-brand-100 tracking-wide">
              {event.title}
            </span>
            {event.type && (
              <span className="text-xs md:text-sm font-semibold text-gold">
                • {event.type}
              </span>
            )}
            <span className="text-xs md:text-sm text-brand-200 bg-white/10 px-2 py-0.5 rounded font-medium">
              {feeDisplay}
            </span>
            {event.city && (
              <span className="text-xs md:text-sm text-white/75">
                📍 {event.city}
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions & Carousel controls */}
        <div className="flex items-center gap-2.5 ml-auto">
          {events.length > 1 && (
            <div className="flex items-center gap-1 mr-1">
              {events.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    idx === currentIndex ? "w-4 bg-brand-500" : "w-1.5 bg-white/30"
                  }`}
                  title={`Event ${idx + 1}`}
                  aria-label={`Go to event ${idx + 1}`}
                />
              ))}
            </div>
          )}

          <Link
            href={`/events/${event.slug}`}
            to={`/events/${event.slug}`}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-white bg-white/15 hover:bg-white/25 border border-white/20 transition-all inline-block"
          >
            View Event
          </Link>

          {event.isRegistrationOpen !== false && event.status === "PUBLISHED" ? (
            <Link
              href={`/events/${event.slug}/register`}
              to={`/events/${event.slug}/register`}
              className="px-4 py-1.5 text-xs font-bold rounded-lg text-white bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 shadow-md shadow-brand-600/40 transition-all inline-block"
            >
              Register Now
            </Link>
          ) : (
            <span className="px-3 py-1 text-xs font-semibold rounded-lg bg-white/10 text-rose-200">
              Registration Closed
            </span>
          )}

          <button
            onClick={() => setDismissed(true)}
            className="text-white/60 hover:text-white text-lg leading-none p-1 transition-colors ml-1"
            title="Dismiss"
            aria-label="Dismiss banner"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

