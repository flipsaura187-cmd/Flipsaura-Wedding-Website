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
    <div
      style={{
        background: "linear-gradient(90deg, #2a1726 0%, #4a1936 50%, #2a1726 100%)",
        color: "#ffffff",
        position: "relative",
        borderBottom: "2px solid rgba(212, 175, 122, 0.4)",
        boxShadow: "0 4px 20px rgba(42, 23, 38, 0.18)",
        overflow: "hidden",
        zIndex: 40,
      }}
    >
      {/* Decorative accent glow */}
      <div
        style={{
          position: "absolute",
          top: "-50%",
          left: "20%",
          width: "300px",
          height: "100px",
          background: "radial-gradient(circle, rgba(230, 63, 135, 0.35) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        className="container"
        style={{
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          position: "relative",
        }}
      >
        {/* Left: Badge & Info */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <span
            style={{
              background: "linear-gradient(135deg, #e63f87 0%, #ff8ab8 100%)",
              color: "#ffffff",
              fontSize: "0.75rem",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "20px",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              boxShadow: "0 2px 8px rgba(230, 63, 135, 0.35)",
            }}
          >
            🎉 UPCOMING EVENT
          </span>

          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
            <span
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "1.05rem",
                fontWeight: 700,
                color: "#ffe6f0",
                letterSpacing: "0.2px",
              }}
            >
              {event.title}
            </span>
            {event.type && (
              <span
                style={{
                  fontSize: "0.85rem",
                  color: "#d4af7a",
                  fontWeight: 600,
                }}
              >
                • {event.type}
              </span>
            )}
            <span
              style={{
                fontSize: "0.85rem",
                color: "#ffb3d1",
                background: "rgba(255, 255, 255, 0.08)",
                padding: "2px 8px",
                borderRadius: "4px",
              }}
            >
              {feeDisplay}
            </span>
            {event.city && (
              <span style={{ fontSize: "0.82rem", color: "rgba(255, 255, 255, 0.75)" }}>
                📍 {event.city}
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions & Carousel controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginLeft: "auto" }}>
          {events.length > 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: "4px", marginRight: "6px" }}>
              {events.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  style={{
                    width: idx === currentIndex ? "16px" : "6px",
                    height: "6px",
                    borderRadius: "3px",
                    background: idx === currentIndex ? "#e63f87" : "rgba(255,255,255,0.3)",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  title={`Event ${idx + 1}`}
                  aria-label={`Go to event ${idx + 1}`}
                />
              ))}
            </div>
          )}

          <Link
            href={`/events/${event.slug}`}
            to={`/events/${event.slug}`}
            style={{
              padding: "6px 14px",
              fontSize: "0.82rem",
              fontWeight: 600,
              borderRadius: "6px",
              color: "#ffffff",
              background: "rgba(255, 255, 255, 0.12)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              textDecoration: "none",
              transition: "all 0.15s ease",
              display: "inline-block",
            }}
          >
            View Event
          </Link>

          {event.isRegistrationOpen !== false && event.status === "PUBLISHED" ? (
            <Link
              href={`/events/${event.slug}/register`}
              to={`/events/${event.slug}/register`}
              style={{
                padding: "6px 16px",
                fontSize: "0.82rem",
                fontWeight: 700,
                borderRadius: "6px",
                color: "#ffffff",
                background: "linear-gradient(135deg, #e63f87 0%, #b32a68 100%)",
                border: "none",
                textDecoration: "none",
                boxShadow: "0 2px 10px rgba(230, 63, 135, 0.4)",
                transition: "all 0.15s ease",
                display: "inline-block",
              }}
            >
              Register Now
            </Link>
          ) : (
            <span
              style={{
                padding: "6px 12px",
                fontSize: "0.8rem",
                fontWeight: 600,
                borderRadius: "6px",
                background: "rgba(255, 255, 255, 0.1)",
                color: "#ffb3b3",
              }}
            >
              Registration Closed
            </span>
          )}

          <button
            onClick={() => setDismissed(true)}
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(255, 255, 255, 0.5)",
              fontSize: "16px",
              cursor: "pointer",
              padding: "4px",
              lineHeight: 1,
              marginLeft: "4px",
            }}
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
