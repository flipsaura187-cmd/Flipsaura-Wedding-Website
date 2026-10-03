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
      <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "var(--muted)" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              border: "4px solid rgba(230, 63, 135, 0.2)",
              borderTopColor: "var(--pink-600, #e63f87)",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ fontSize: "1.1rem" }}>Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container" style={{ padding: "80px 16px", textAlign: "center" }}>
        <h2>Event Not Found</h2>
        <p style={{ color: "var(--muted)", margin: "12px 0 24px" }}>
          {error || "The event you are looking for does not exist or has been removed."}
        </p>
        <Link href="/events" to="/events" className="btn btn-primary" style={{ padding: "10px 24px" }}>
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
    <div style={{ minHeight: "90vh", background: "#fdfbfd", paddingBottom: "80px" }}>
      {/* Hero Banner Section */}
      <section
        style={{
          position: "relative",
          background: "linear-gradient(135deg, #1f0f1c 0%, #3d142c 60%, #5a1936 100%)",
          color: "#ffffff",
          padding: "70px 16px 80px",
          overflow: "hidden",
        }}
      >
        {/* Subtle background glow */}
        <div
          style={{
            position: "absolute",
            top: "-20%",
            right: "10%",
            width: "500px",
            height: "400px",
            background: "radial-gradient(circle, rgba(230, 63, 135, 0.25) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div className="container" style={{ position: "relative" }}>
          <div style={{ maxWidth: "860px" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginBottom: "16px" }}>
              <Link
                href="/events"
                to="/events"
                style={{
                  color: "#ff8ab8",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  textDecoration: "none",
                }}
              >
                ← All Events
              </Link>
              <span style={{ color: "rgba(255,255,255,0.4)" }}>|</span>
              <span
                style={{
                  background: "rgba(212, 175, 122, 0.2)",
                  color: "#d4af7a",
                  padding: "4px 12px",
                  borderRadius: "14px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                {event.type || "Competition"}
              </span>
              {event.featured && (
                <span
                  style={{
                    background: "linear-gradient(135deg, #e63f87, #b32a68)",
                    color: "#ffffff",
                    padding: "4px 12px",
                    borderRadius: "14px",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                  }}
                >
                  ⭐ Featured Event
                </span>
              )}
            </div>

            <h1
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "clamp(2.4rem, 5vw, 4rem)",
                lineHeight: 1.15,
                margin: "0 0 16px",
                color: "#ffffff",
                letterSpacing: "-0.5px",
              }}
            >
              {event.title}
            </h1>

            <p style={{ fontSize: "1.2rem", color: "#ffe6f0", fontWeight: 500, margin: "0 0 16px" }}>
              Organized by: <strong style={{ color: "#ffffff" }}>{event.organizer || "FlipsAura × Marritcredence"}</strong>
            </p>

            <p style={{ fontSize: "1.05rem", color: "rgba(255, 255, 255, 0.85)", lineHeight: 1.6, margin: "0 0 28px", maxWidth: "720px" }}>
              {event.shortDescription || event.description}
            </p>

            {/* Quick Badges Strip */}
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.1)", padding: "8px 16px", borderRadius: "10px" }}>
                <span style={{ fontSize: "1.2rem" }}>📍</span>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>Venue</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 600 }}>{event.city ? `${event.city} • ${event.venue}` : event.venue}</div>
                </div>
              </div>

              {formattedDate && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.1)", padding: "8px 16px", borderRadius: "10px" }}>
                  <span style={{ fontSize: "1.2rem" }}>📅</span>
                  <div>
                    <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>Date</div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 600 }}>{formattedDate}</div>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.1)", padding: "8px 16px", borderRadius: "10px" }}>
                <span style={{ fontSize: "1.2rem" }}>💰</span>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>Registration Fee</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#d4af7a" }}>
                    {event.registrationFee > 0 ? `₹${Number(event.registrationFee).toLocaleString("en-IN")}` : "Free"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="container" style={{ marginTop: "-30px", position: "relative", zIndex: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "36px", alignItems: "start" }}>
          
          {/* Left Column: Detailed Sections */}
          <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>
            
            {/* Banner Image Preview */}
            {event.bannerImage && (
              <div
                style={{
                  borderRadius: "18px",
                  overflow: "hidden",
                  boxShadow: "0 12px 36px rgba(42, 23, 38, 0.1)",
                  border: "1px solid rgba(243, 217, 228, 0.8)",
                  maxHeight: "440px",
                  background: "#000",
                }}
              >
                <img
                  src={event.bannerImage}
                  alt={event.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
            )}

            {/* About Event */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "18px",
                padding: "32px",
                boxShadow: "0 4px 20px rgba(42, 23, 38, 0.05)",
                border: "1px solid #f3d9e4",
              }}
            >
              <h2
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "1.8rem",
                  color: "var(--ink, #2a1726)",
                  marginTop: 0,
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span>📖</span> About The Event
              </h2>
              <div
                style={{
                  fontSize: "1.02rem",
                  color: "#4a3b45",
                  lineHeight: 1.7,
                  whiteSpace: "pre-line",
                }}
              >
                {event.description}
              </div>
            </div>

            {/* Prizes Section */}
            {Array.isArray(event.prizes) && event.prizes.length > 0 && (
              <div
                style={{
                  background: "linear-gradient(135deg, #ffffff 0%, #fff9fc 100%)",
                  borderRadius: "18px",
                  padding: "32px",
                  boxShadow: "0 4px 20px rgba(42, 23, 38, 0.05)",
                  border: "1px solid #f3d9e4",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "10px", marginBottom: "20px" }}>
                  <h2
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: "1.8rem",
                      color: "var(--ink, #2a1726)",
                      margin: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <span>🏆</span> Cash Prizes & Rewards
                  </h2>
                  <span style={{ fontSize: "0.95rem", color: "var(--pink-600)", fontWeight: 700 }}>
                    Total Prize Pool: ₹{event.prizes.reduce((s, p) => s + (Number(p.amount) || 0), 0).toLocaleString("en-IN")}
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "16px",
                  }}
                >
                  {event.prizes.map((p, idx) => {
                    const isFirst = idx === 0 || p.rank?.includes("1");
                    const isSecond = idx === 1 || p.rank?.includes("2");
                    const medalBg = isFirst
                      ? "linear-gradient(135deg, #fff8e7 0%, #ffedbf 100%)"
                      : isSecond
                      ? "linear-gradient(135deg, #f5f6f8 0%, #e6e8ec 100%)"
                      : "linear-gradient(135deg, #fff0e6 0%, #fed8be 100%)";
                    const medalBorder = isFirst ? "#e3b859" : isSecond ? "#b8c0cc" : "#dca07b";
                    const medalIcon = isFirst ? "🥇" : isSecond ? "🥈" : "🥉";

                    return (
                      <div
                        key={idx}
                        style={{
                          background: medalBg,
                          border: `1.5px solid ${medalBorder}`,
                          borderRadius: "14px",
                          padding: "20px",
                          textAlign: "center",
                          boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
                        }}
                      >
                        <div style={{ fontSize: "2rem", marginBottom: "6px" }}>{medalIcon}</div>
                        <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#2a1726", marginBottom: "4px" }}>
                          {p.rank}
                        </div>
                        <div
                          style={{
                            fontSize: "1.65rem",
                            fontWeight: 800,
                            color: "var(--pink-700, #b32a68)",
                            fontFamily: "'Segoe UI', system-ui, sans-serif",
                          }}
                        >
                          ₹{Number(p.amount).toLocaleString("en-IN")}
                        </div>
                        {p.description && (
                          <div style={{ fontSize: "0.82rem", color: "#665560", marginTop: "6px" }}>
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
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "18px",
                  padding: "32px",
                  boxShadow: "0 4px 20px rgba(42, 23, 38, 0.05)",
                  border: "1px solid #f3d9e4",
                }}
              >
                <h2
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: "1.8rem",
                    color: "var(--ink, #2a1726)",
                    marginTop: 0,
                    marginBottom: "18px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <span>✨</span> Why Participate?
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
                  {event.benefits.map((b, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                        padding: "14px 16px",
                        background: "#fff5f9",
                        borderRadius: "12px",
                        border: "1px solid rgba(243, 217, 228, 0.8)",
                      }}
                    >
                      <span
                        style={{
                          background: "var(--pink-600, #e63f87)",
                          color: "#fff",
                          width: "22px",
                          height: "22px",
                          borderRadius: "50%",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          fontWeight: 700,
                          flexShrink: 0,
                          marginTop: "2px",
                        }}
                      >
                        ✓
                      </span>
                      <span style={{ fontSize: "0.98rem", color: "#3a2533", fontWeight: 500 }}>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Event Format / Rounds */}
            {Array.isArray(event.eventFormat) && event.eventFormat.length > 0 && (
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "18px",
                  padding: "32px",
                  boxShadow: "0 4px 20px rgba(42, 23, 38, 0.05)",
                  border: "1px solid #f3d9e4",
                }}
              >
                <h2
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: "1.8rem",
                    color: "var(--ink, #2a1726)",
                    marginTop: 0,
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <span>🎯</span> Event Format & Rounds
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {event.eventFormat.map((r, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "18px 20px",
                        background: "#faf7f9",
                        borderRadius: "12px",
                        borderLeft: "4px solid var(--pink-600, #e63f87)",
                      }}
                    >
                      <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--ink)", marginBottom: "4px" }}>
                        {r.round || `Round ${idx + 1}`}
                      </div>
                      <div style={{ fontSize: "0.95rem", color: "#5a4552", lineHeight: 1.5 }}>
                        {r.details || r}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rules & Regulations */}
            {Array.isArray(event.rules) && event.rules.length > 0 && (
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "18px",
                  padding: "32px",
                  boxShadow: "0 4px 20px rgba(42, 23, 38, 0.05)",
                  border: "1px solid #f3d9e4",
                }}
              >
                <h2
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: "1.8rem",
                    color: "var(--ink, #2a1726)",
                    marginTop: 0,
                    marginBottom: "18px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <span>📋</span> Rules & Guidelines
                </h2>
                <ol style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  {event.rules.map((rule, idx) => (
                    <li key={idx} style={{ fontSize: "0.98rem", color: "#422f3b", lineHeight: 1.5 }}>
                      {rule}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* FAQs */}
            {Array.isArray(event.faqs) && event.faqs.length > 0 && (
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "18px",
                  padding: "32px",
                  boxShadow: "0 4px 20px rgba(42, 23, 38, 0.05)",
                  border: "1px solid #f3d9e4",
                }}
              >
                <h2
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: "1.8rem",
                    color: "var(--ink, #2a1726)",
                    marginTop: 0,
                    marginBottom: "18px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <span>❓</span> Frequently Asked Questions
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {event.faqs.map((faq, idx) => {
                    const isOpen = activeFaq === idx;
                    return (
                      <div
                        key={idx}
                        style={{
                          border: "1px solid #f3d9e4",
                          borderRadius: "10px",
                          overflow: "hidden",
                          background: isOpen ? "#fff5f9" : "#ffffff",
                          transition: "background 0.2s ease",
                        }}
                      >
                        <button
                          onClick={() => setActiveFaq(isOpen ? null : idx)}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "16px 20px",
                            background: "transparent",
                            border: "none",
                            fontSize: "1rem",
                            fontWeight: 600,
                            color: "var(--ink)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            cursor: "pointer",
                          }}
                        >
                          <span>{faq.question}</span>
                          <span style={{ fontSize: "1.2rem", color: "var(--pink-600)" }}>{isOpen ? "−" : "+"}</span>
                        </button>
                        {isOpen && (
                          <div
                            style={{
                              padding: "0 20px 16px",
                              fontSize: "0.95rem",
                              color: "#5c4554",
                              lineHeight: 1.6,
                            }}
                          >
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
            <div
              style={{
                background: "#ffffff",
                borderRadius: "18px",
                padding: "28px 32px",
                boxShadow: "0 4px 20px rgba(42, 23, 38, 0.05)",
                border: "1px solid #f3d9e4",
              }}
            >
              <h3 style={{ margin: "0 0 12px", fontSize: "1.2rem" }}>Have Questions or Need Assistance?</h3>
              <p style={{ margin: "0 0 16px", color: "var(--muted)", fontSize: "0.95rem" }}>
                Our event coordination committee is here to assist participants and colleges.
              </p>
              <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", fontSize: "0.95rem" }}>
                {event.contactInformation?.email && (
                  <div>
                    <span style={{ color: "var(--muted)" }}>Email: </span>
                    <a href={`mailto:${event.contactInformation.email}`} style={{ color: "var(--pink-600)", fontWeight: 600 }}>
                      {event.contactInformation.email}
                    </a>
                  </div>
                )}
                {event.contactInformation?.phone && (
                  <div>
                    <span style={{ color: "var(--muted)" }}>Phone / WhatsApp: </span>
                    <a href={`tel:${event.contactInformation.phone}`} style={{ color: "var(--pink-600)", fontWeight: 600 }}>
                      {event.contactInformation.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Sticky Registration Box */}
          <div style={{ position: "sticky", top: "90px" }}>
            <div
              style={{
                background: "#ffffff",
                borderRadius: "20px",
                padding: "28px 24px",
                boxShadow: "0 10px 30px rgba(42, 23, 38, 0.08)",
                border: "1.5px solid rgba(230, 63, 135, 0.3)",
              }}
            >
              <div style={{ textAlign: "center", marginBottom: "20px", paddingBottom: "18px", borderBottom: "1px solid #f3d9e4" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
                  Registration Fee
                </span>
                <div
                  style={{
                    fontSize: "2.4rem",
                    fontWeight: 800,
                    color: "var(--pink-700, #b32a68)",
                    fontFamily: "'Segoe UI', system-ui, sans-serif",
                    margin: "4px 0",
                  }}
                >
                  {event.registrationFee > 0 ? `₹${Number(event.registrationFee).toLocaleString("en-IN")}` : "FREE"}
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
                  Per Registration (Individual or Team)
                </div>
              </div>

              {/* Event Attributes */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px", fontSize: "0.92rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--muted)" }}>Participation:</span>
                  <span style={{ fontWeight: 600, color: "var(--ink)" }}>
                    {Array.isArray(event.participationTypes) && event.participationTypes.length > 0
                      ? event.participationTypes.join(" / ")
                      : "Individual / Team of 3"}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--muted)" }}>Venue:</span>
                  <span style={{ fontWeight: 600, color: "var(--ink)", textAlign: "right", maxWidth: "180px" }}>
                    {event.city ? `${event.city}` : event.venue}
                  </span>
                </div>

                {formattedDate && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--muted)" }}>Date:</span>
                    <span style={{ fontWeight: 600, color: "var(--ink)" }}>
                      {new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                )}

                {event.startTime && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--muted)" }}>Time:</span>
                    <span style={{ fontWeight: 600, color: "var(--ink)" }}>
                      {event.startTime} {event.endTime ? `– ${event.endTime}` : ""}
                    </span>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--muted)" }}>Status:</span>
                  <span
                    style={{
                      fontWeight: 700,
                      color: isRegistrationOpen ? "#16a34a" : "#dc2626",
                    }}
                  >
                    {isRegistrationOpen ? "● Open for Registration" : "● Registration Closed"}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              {isRegistrationOpen ? (
                <Link
                  href={`/events/${event.slug}/register`}
                  to={`/events/${event.slug}/register`}
                  className="btn btn-primary btn-block"
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "14px 20px",
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    borderRadius: "10px",
                    textDecoration: "none",
                    boxShadow: "0 6px 20px rgba(230, 63, 135, 0.35)",
                  }}
                >
                  REGISTER NOW →
                </Link>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "14px 20px",
                    fontSize: "1rem",
                    fontWeight: 700,
                    borderRadius: "10px",
                    background: "#f1f1f1",
                    color: "#777",
                    border: "1px dashed #ccc",
                  }}
                >
                  REGISTRATION CLOSED
                </div>
              )}

              <div
                style={{
                  marginTop: "16px",
                  fontSize: "0.78rem",
                  color: "var(--muted)",
                  textAlign: "center",
                  lineHeight: 1.4,
                }}
              >
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
