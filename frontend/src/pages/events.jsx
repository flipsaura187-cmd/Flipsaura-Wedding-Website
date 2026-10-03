"use client";
import { useEffect, useState } from "react";
import Link from "@/compat/Link";
import api from "@/api/axios";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    let isMounted = true;
    const loadEvents = async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/events?status=PUBLISHED");
        if (res.data?.ok && Array.isArray(res.data.data?.events)) {
          if (isMounted) setEvents(res.data.data.events);
        }
      } catch (err) {
        console.error("Failed to load events:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadEvents();
    return () => {
      isMounted = false;
    };
  }, []);

  const eventTypes = ["ALL", ...new Set(events.map((e) => e.type).filter(Boolean))];

  const filteredEvents =
    filter === "ALL"
      ? events
      : events.filter((e) => e.type?.toLowerCase() === filter.toLowerCase());

  return (
    <div style={{ minHeight: "85vh", background: "#faf7f9", paddingBottom: "70px" }}>
      {/* Hero Header */}
      <section
        style={{
          background: "linear-gradient(135deg, #2a1726 0%, #4a1936 60%, #8B1E3F 100%)",
          color: "#ffffff",
          padding: "60px 16px 50px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "600px",
            height: "300px",
            background: "radial-gradient(circle, rgba(230, 63, 135, 0.25) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div className="container" style={{ position: "relative", maxWidth: "800px" }}>
          <span
            style={{
              display: "inline-block",
              background: "rgba(230, 63, 135, 0.2)",
              color: "#ff8ab8",
              border: "1px solid rgba(230, 63, 135, 0.4)",
              borderRadius: "20px",
              padding: "4px 16px",
              fontSize: "0.85rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "16px",
            }}
          >
            🏆 Premier Experience
          </span>
          <h1
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(2.2rem, 4.5vw, 3.4rem)",
              margin: "0 0 16px",
              color: "#ffffff",
            }}
          >
            FlipsAura Events & Competitions
          </h1>
          <p
            style={{
              fontSize: "1.1rem",
              color: "rgba(255, 255, 255, 0.85)",
              lineHeight: 1.6,
              margin: "0 auto",
            }}
          >
            Discover prestigious championships, student cups, exhibitions, and workshops.
            Compete with the best, test your skills, and conquer the grand stage.
          </p>
        </div>
      </section>

      {/* Filter Tabs */}
      {eventTypes.length > 2 && (
        <div className="container" style={{ marginTop: "30px", marginBottom: "20px" }}>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
            {eventTypes.map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                style={{
                  padding: "8px 18px",
                  borderRadius: "20px",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  border: filter === t ? "none" : "1px solid var(--line, #f3d9e4)",
                  background: filter === t ? "var(--pink-600, #e63f87)" : "#ffffff",
                  color: filter === t ? "#ffffff" : "var(--ink, #2a1726)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: filter === t ? "0 4px 12px rgba(230, 63, 135, 0.25)" : "none",
                }}
              >
                {t === "ALL" ? "All Events" : t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Events Grid */}
      <div className="container" style={{ marginTop: "40px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--muted)" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                border: "4px solid rgba(230, 63, 135, 0.2)",
                borderTopColor: "var(--pink-600, #e63f87)",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 16px",
              }}
            />
            <p>Loading events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "70px 20px",
              background: "#ffffff",
              borderRadius: "16px",
              border: "1px solid var(--line, #f3d9e4)",
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "12px" }}>📅</div>
            <h3 style={{ margin: "0 0 8px" }}>No active events right now</h3>
            <p style={{ color: "var(--muted)", margin: "0 0 20px" }}>
              New competitions and events are announced regularly. Check back soon!
            </p>
            <Link
              href="/"
              to="/"
              className="btn btn-outline"
              style={{ display: "inline-block", padding: "10px 24px" }}
            >
              Explore FlipsAura
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
              gap: "28px",
            }}
          >
            {filteredEvents.map((ev) => {
              const formattedDate = ev.date
                ? new Date(ev.date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : null;

              const totalPrizeAmount = Array.isArray(ev.prizes)
                ? ev.prizes.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
                : 0;

              return (
                <div
                  key={ev._id}
                  style={{
                    background: "#ffffff",
                    borderRadius: "16px",
                    overflow: "hidden",
                    border: "1px solid rgba(243, 217, 228, 0.8)",
                    boxShadow: "0 8px 24px rgba(42, 23, 38, 0.06)",
                    display: "flex",
                    flexDirection: "column",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 14px 32px rgba(230, 63, 135, 0.14)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(42, 23, 38, 0.06)";
                  }}
                >
                  {/* Banner Image */}
                  <div
                    style={{
                      height: "190px",
                      position: "relative",
                      background: "linear-gradient(135deg, #2a1726, #4a1936)",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={
                        ev.bannerImage ||
                        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop"
                      }
                      alt={ev.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transition: "transform 0.4s ease",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: "14px",
                        left: "14px",
                        display: "flex",
                        gap: "6px",
                      }}
                    >
                      {ev.type && (
                        <span
                          style={{
                            background: "rgba(42, 23, 38, 0.85)",
                            color: "#d4af7a",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            padding: "4px 10px",
                            borderRadius: "12px",
                            backdropFilter: "blur(4px)",
                          }}
                        >
                          {ev.type}
                        </span>
                      )}
                      {ev.featured && (
                        <span
                          style={{
                            background: "linear-gradient(135deg, #e63f87, #b32a68)",
                            color: "#ffffff",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            padding: "4px 10px",
                            borderRadius: "12px",
                          }}
                        >
                          ⭐ Featured
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        position: "absolute",
                        bottom: "12px",
                        right: "12px",
                        background: "rgba(255, 255, 255, 0.95)",
                        color: "var(--ink, #2a1726)",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        padding: "4px 12px",
                        borderRadius: "20px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      }}
                    >
                      {ev.registrationFee > 0
                        ? `₹${Number(ev.registrationFee).toLocaleString("en-IN")}`
                        : "Free"}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div
                    style={{
                      padding: "22px 20px 20px",
                      display: "flex",
                      flexDirection: "column",
                      flex: 1,
                    }}
                  >
                    <div style={{ fontSize: "0.82rem", color: "var(--pink-600, #e63f87)", fontWeight: 600, marginBottom: "6px" }}>
                      Organized by {ev.organizer || "FlipsAura"}
                    </div>
                    <h3
                      style={{
                        margin: "0 0 10px",
                        fontSize: "1.3rem",
                        fontFamily: "'Playfair Display', Georgia, serif",
                        color: "var(--ink, #2a1726)",
                      }}
                    >
                      {ev.title}
                    </h3>
                    <p
                      style={{
                        fontSize: "0.9rem",
                        color: "var(--muted, #7a6470)",
                        lineHeight: 1.5,
                        margin: "0 0 16px",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {ev.shortDescription || ev.description}
                    </p>

                    {/* Metadata strip */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                        padding: "12px 14px",
                        background: "#fff5f9",
                        borderRadius: "10px",
                        fontSize: "0.84rem",
                        marginBottom: "18px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--muted)" }}>📍 Venue:</span>
                        <span style={{ fontWeight: 600, color: "var(--ink)" }}>
                          {ev.city ? `${ev.city}${ev.venue ? ` • ${ev.venue}` : ""}` : ev.venue || "TBA"}
                        </span>
                      </div>
                      {formattedDate && (
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "var(--muted)" }}>📅 Date:</span>
                          <span style={{ fontWeight: 600, color: "var(--ink)" }}>{formattedDate}</span>
                        </div>
                      )}
                      {totalPrizeAmount > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "var(--muted)" }}>🎁 Prizes:</span>
                          <span style={{ fontWeight: 700, color: "var(--pink-700, #b32a68)" }}>
                            Up to ₹{totalPrizeAmount.toLocaleString("en-IN")}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div style={{ marginTop: "auto", display: "flex", gap: "10px" }}>
                      <Link
                        href={`/events/${ev.slug}`}
                        to={`/events/${ev.slug}`}
                        className="btn btn-outline"
                        style={{
                          flex: 1,
                          textAlign: "center",
                          padding: "10px 14px",
                          fontSize: "0.88rem",
                          fontWeight: 600,
                          borderRadius: "8px",
                        }}
                      >
                        View Event
                      </Link>

                      {ev.isRegistrationOpen !== false && ev.status === "PUBLISHED" ? (
                        <Link
                          href={`/events/${ev.slug}/register`}
                          to={`/events/${ev.slug}/register`}
                          className="btn btn-primary"
                          style={{
                            flex: 1,
                            textAlign: "center",
                            padding: "10px 14px",
                            fontSize: "0.88rem",
                            fontWeight: 700,
                            borderRadius: "8px",
                          }}
                        >
                          Register Now
                        </Link>
                      ) : (
                        <span
                          style={{
                            flex: 1,
                            textAlign: "center",
                            padding: "10px 14px",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            borderRadius: "8px",
                            background: "#eee",
                            color: "#888",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          Closed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
