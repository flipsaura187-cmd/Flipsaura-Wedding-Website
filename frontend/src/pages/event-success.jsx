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
    <div style={{ minHeight: "85vh", background: "#faf7f9", padding: "50px 16px 80px" }}>
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

      <div className="container" style={{ maxWidth: "700px" }}>
        {/* Ticket / Confirmation Card */}
        <div
          id="print-ticket"
          style={{
            background: "#ffffff",
            borderRadius: "20px",
            border: "2px solid #f3d9e4",
            boxShadow: "0 12px 36px rgba(42, 23, 38, 0.08)",
            overflow: "hidden",
          }}
        >
          {/* Header Banner */}
          <div
            style={{
              background: "linear-gradient(135deg, #16a34a 0%, #059669 100%)",
              color: "#ffffff",
              padding: "36px 24px",
              textAlign: "center",
              position: "relative",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "#ffffff",
                color: "#16a34a",
                fontSize: "2.2rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
              }}
            >
              ✓
            </div>
            <h1
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "clamp(1.8rem, 3.5vw, 2.4rem)",
                margin: "0 0 8px",
                color: "#ffffff",
              }}
            >
              Registration Confirmed!
            </h1>
            <p style={{ margin: 0, fontSize: "1.05rem", color: "#d1fae5" }}>
              Thank you for registering for <strong>{eventTitle}</strong>.
            </p>
          </div>

          {/* Ticket Body */}
          <div style={{ padding: "32px 28px" }}>
            {/* Registration ID Strip */}
            <div
              style={{
                background: "#fff5f9",
                border: "2px dashed var(--pink-600, #e63f87)",
                borderRadius: "14px",
                padding: "18px 20px",
                textAlign: "center",
                marginBottom: "28px",
              }}
            >
              <div style={{ fontSize: "0.82rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>
                Official Registration ID
              </div>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: "1.9rem",
                  fontWeight: 800,
                  color: "var(--pink-700, #b32a68)",
                  letterSpacing: "1px",
                  margin: "6px 0",
                }}
              >
                {regId || details?.registrationId || "PENDING"}
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
                Please save this registration ID for venue entry and verification.
              </div>
            </div>

            {/* Details Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "16px",
                marginBottom: "28px",
                padding: "20px",
                background: "#faf8f9",
                borderRadius: "14px",
                fontSize: "0.95rem",
              }}
            >
              <div>
                <div style={{ color: "var(--muted)", fontSize: "0.82rem", textTransform: "uppercase" }}>Event</div>
                <div style={{ fontWeight: 700, color: "var(--ink)" }}>{eventTitle}</div>
              </div>

              <div>
                <div style={{ color: "var(--muted)", fontSize: "0.82rem", textTransform: "uppercase" }}>Participation</div>
                <div style={{ fontWeight: 700, color: "var(--ink)" }}>
                  {participation} {details?.teamName ? `(${details.teamName})` : ""}
                </div>
              </div>

              <div>
                <div style={{ color: "var(--muted)", fontSize: "0.82rem", textTransform: "uppercase" }}>Amount Paid</div>
                <div style={{ fontWeight: 800, color: "var(--ink)" }}>
                  ₹{Number(amount).toLocaleString("en-IN")}
                </div>
              </div>

              <div>
                <div style={{ color: "var(--muted)", fontSize: "0.82rem", textTransform: "uppercase" }}>Payment Status</div>
                <div>
                  <span
                    style={{
                      background: "#dcfce7",
                      color: "#15803d",
                      padding: "3px 10px",
                      borderRadius: "12px",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      display: "inline-block",
                    }}
                  >
                    ● {paymentStatus}
                  </span>
                </div>
              </div>

              <div>
                <div style={{ color: "var(--muted)", fontSize: "0.82rem", textTransform: "uppercase" }}>Organized By</div>
                <div style={{ fontWeight: 600, color: "var(--ink)" }}>{organizer}</div>
              </div>

              {details?.city && (
                <div>
                  <div style={{ color: "var(--muted)", fontSize: "0.82rem", textTransform: "uppercase" }}>Venue / City</div>
                  <div style={{ fontWeight: 600, color: "var(--ink)" }}>
                    {details.city} {details.venue ? `• ${details.venue}` : ""}
                  </div>
                </div>
              )}

              {details?.razorpayPaymentId && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ color: "var(--muted)", fontSize: "0.78rem", textTransform: "uppercase" }}>Razorpay Payment ID</div>
                  <div style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "#666" }}>
                    {details.razorpayPaymentId}
                  </div>
                </div>
              )}
            </div>

            {/* Participants list if available */}
            {Array.isArray(details?.participants) && details.participants.length > 0 && (
              <div style={{ marginBottom: "28px" }}>
                <h4 style={{ margin: "0 0 12px", fontSize: "1.05rem" }}>Registered Participants</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {details.participants.map((p, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        background: "#fff",
                        border: "1px solid #f0e6eb",
                        borderRadius: "8px",
                        fontSize: "0.9rem",
                      }}
                    >
                      <div>
                        <strong>{p.fullName}</strong> {p.isLeader && <span style={{ color: "var(--pink-600)", fontWeight: 700 }}>(Leader)</span>}
                        <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{p.college} • {p.course}</div>
                      </div>
                      <div style={{ textAlign: "right", fontSize: "0.82rem", color: "#666" }}>
                        <div>{p.mobileNumber}</div>
                        <div>{p.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tagline */}
            <div
              style={{
                textAlign: "center",
                padding: "16px 0",
                borderTop: "1px solid #f3d9e4",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontStyle: "italic",
                  fontSize: "1.2rem",
                  color: "var(--pink-700, #b32a68)",
                  fontWeight: 700,
                  letterSpacing: "0.5px",
                }}
              >
                Think. Compete. Conquer.
              </div>
            </div>

            {/* Action Buttons */}
            <div className="no-print" style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={handlePrint}
                className="btn btn-outline"
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "12px 18px",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  borderRadius: "10px",
                }}
              >
                🖨️ Download / Print Confirmation
              </button>

              <Link
                href={`/events/${eventSlug}`}
                to={`/events/${eventSlug}`}
                className="btn btn-primary"
                style={{
                  flex: 1,
                  textAlign: "center",
                  padding: "12px 18px",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  borderRadius: "10px",
                  textDecoration: "none",
                }}
              >
                Back to Event
              </Link>
            </div>
          </div>
        </div>

        {/* Support note */}
        <div className="no-print" style={{ textAlign: "center", marginTop: "24px", color: "var(--muted)", fontSize: "0.85rem" }}>
          A confirmation record has been generated. For any questions, contact FlipsAura Support.
        </div>
      </div>
    </div>
  );
}
