"use client";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useRouter } from "@/compat/navigation";
import Link from "@/compat/Link";
import api from "@/api/axios";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const initialParticipant = (isLeader = false) => ({
  fullName: "",
  mobileNumber: "",
  email: "",
  college: "",
  course: "",
  year: "",
  city: "",
  isLeader,
});

export default function EventRegisterPage() {
  const { slug } = useParams();
  const router = useRouter();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Form State
  const [participationType, setParticipationType] = useState("Individual");
  const [teamName, setTeamName] = useState("");
  const [individualData, setIndividualData] = useState(initialParticipant(true));
  const [teamMembers, setTeamMembers] = useState([
    initialParticipant(true),
    initialParticipant(false),
    initialParticipant(false),
  ]);
  const [source, setSource] = useState("");
  const [previousQuizParticipation, setPreviousQuizParticipation] = useState("No");
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Field validation errors
  const [errors, setErrors] = useState({});

  useEffect(() => {
    let isMounted = true;
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/events/${slug}`);
        if (res.data?.ok && res.data.data?.event) {
          if (isMounted) {
            const ev = res.data.data.event;
            setEvent(ev);
            if (Array.isArray(ev.participationTypes) && ev.participationTypes.length > 0) {
              setParticipationType(ev.participationTypes[0]);
            }
          }
        }
      } catch (err) {
        if (isMounted) setErrorMessage("Failed to load event for registration.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    if (slug) fetchEvent();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Validation functions
  const validateMobile = (val) => {
    const cleaned = String(val || "").replace(/\D/g, "");
    const last10 = cleaned.length >= 10 ? cleaned.slice(-10) : cleaned;
    return /^[6-9]\d{9}$/.test(last10);
  };

  const validateEmail = (val) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val || "").trim());
  };

  const validateForm = () => {
    const newErrors = {};

    if (participationType === "Individual") {
      if (!individualData.fullName.trim()) newErrors.fullName = "Full name is required";
      if (!validateMobile(individualData.mobileNumber)) {
        newErrors.mobileNumber = "Enter a valid 10-digit Indian mobile number (e.g. 9876543210)";
      }
      if (!validateEmail(individualData.email)) {
        newErrors.email = "Enter a valid email address";
      }
      if (!individualData.college.trim()) newErrors.college = "College / School name is required";
      if (!individualData.course.trim()) newErrors.course = "Course / Class is required";
      if (!individualData.year.trim()) newErrors.year = "Year / Semester is required";
      if (!individualData.city.trim()) newErrors.city = "City is required";
    } else {
      // Team of 3
      if (!teamName.trim()) newErrors.teamName = "Team name is required";

      teamMembers.forEach((member, idx) => {
        const prefix = `member_${idx}_`;
        const label = idx === 0 ? "Team Leader" : `Member ${idx + 1}`;
        if (!member.fullName.trim()) newErrors[`${prefix}fullName`] = `${label} name is required`;
        if (!validateMobile(member.mobileNumber)) {
          newErrors[`${prefix}mobileNumber`] = `Enter a valid 10-digit mobile for ${label}`;
        }
        if (!validateEmail(member.email)) {
          newErrors[`${prefix}email`] = `Enter a valid email for ${label}`;
        }
        if (!member.college.trim()) newErrors[`${prefix}college`] = `${label} college/school is required`;
        if (!member.course.trim()) newErrors[`${prefix}course`] = `${label} course is required`;
        if (!member.year.trim()) newErrors[`${prefix}year`] = `${label} year/semester is required`;
      });
    }

    if (!termsAccepted) {
      newErrors.terms = "You must agree to the terms & conditions to proceed";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleIndividualChange = (field, val) => {
    setIndividualData((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleMemberChange = (index, field, val) => {
    setTeamMembers((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
    const key = `member_${index}_${field}`;
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!validateForm()) {
      window.scrollTo({ top: 100, behavior: "smooth" });
      return;
    }

    setSubmitting(true);

    try {
      // 1. Ensure Razorpay SDK is loaded
      const isRzpReady = await loadRazorpayScript();
      if (!isRzpReady) {
        throw new Error("Razorpay SDK could not be loaded. Check your internet connection.");
      }

      // 2. Prepare payload
      const participants =
        participationType === "Individual"
          ? [
              {
                ...individualData,
                isLeader: true,
              },
            ]
          : teamMembers.map((m, idx) => ({
              ...m,
              isLeader: idx === 0,
            }));

      const payload = {
        participationType,
        teamName: participationType === "Individual" ? "" : teamName,
        participants,
        source,
        previousQuizParticipation,
        termsAccepted,
      };

      // 3. Call backend registration endpoint
      const regRes = await api.post(`/api/events/${event._id}/register`, payload);

      if (!regRes.data?.ok) {
        throw new Error(regRes.data?.message || "Failed to create registration.");
      }

      const { registrationDocId, orderId, amount, currency, keyId } = regRes.data.data;

      const primaryContact = participants[0];

      // 4. Configure Razorpay checkout options
      const options = {
        key: keyId,
        amount: amount,
        currency: currency || "INR",
        name: "FlipsAura",
        description: `Registration for ${event.title}`,
        order_id: orderId,
        prefill: {
          name: primaryContact.fullName,
          email: primaryContact.email,
          contact: primaryContact.mobileNumber,
        },
        notes: {
          eventTitle: event.title,
          participationType,
          registrationDocId,
        },
        theme: {
          color: "#e63f87",
        },
        handler: async function (response) {
          try {
            // 5. Send signature verification to backend
            const verifyRes = await api.post("/api/events/payment/verify", {
              registrationDocId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.data?.ok) {
              const regId = verifyRes.data.data.registrationId;
              router.push(`/events/registration/success?id=${encodeURIComponent(regId)}`);
            } else {
              router.push(
                `/events/registration/payment-failed?regDocId=${encodeURIComponent(
                  registrationDocId
                )}&error=${encodeURIComponent(verifyRes.data?.message || "Verification failed")}`
              );
            }
          } catch (verErr) {
            router.push(
              `/events/registration/payment-failed?regDocId=${encodeURIComponent(
                registrationDocId
              )}&error=${encodeURIComponent(verErr.message || "Payment verification failed")}`
            );
          }
        },
        modal: {
          ondismiss: function () {
            setSubmitting(false);
            setErrorMessage(
              "Payment window was closed before completion. You can click 'Pay & Register' to retry."
            );
          },
        },
      };

      // 6. Open Razorpay Checkout modal
      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on("payment.failed", function (failResponse) {
        api.post("/api/events/payment/failure", {
          registrationDocId,
          reason: failResponse.error?.description || "Payment failed",
          orderId,
        }).catch(() => {});

        router.push(
          `/events/registration/payment-failed?regDocId=${encodeURIComponent(
            registrationDocId
          )}&error=${encodeURIComponent(failResponse.error?.description || "Payment failed")}`
        );
      });

      rzpInstance.open();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || "An unexpected error occurred.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "75vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--muted)" }}>Loading registration portal...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container" style={{ padding: "80px 16px", textAlign: "center" }}>
        <h2>Event Not Found</h2>
        <Link href="/events" to="/events" className="btn btn-primary" style={{ marginTop: "16px", display: "inline-block" }}>
          Browse Events
        </Link>
      </div>
    );
  }

  if (event.isRegistrationOpen === false || event.status !== "PUBLISHED") {
    return (
      <div className="container" style={{ padding: "80px 16px", textAlign: "center", maxWidth: "600px" }}>
        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🔒</div>
        <h2>Registration Closed</h2>
        <p style={{ color: "var(--muted)", margin: "14px 0 24px", lineHeight: 1.6 }}>
          Registrations for <strong>{event.title}</strong> are currently closed.
        </p>
        <Link href={`/events/${event.slug}`} to={`/events/${event.slug}`} className="btn btn-primary">
          Back to Event Overview
        </Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "90vh", background: "#faf7f9", padding: "40px 16px 80px" }}>
      <div className="container" style={{ maxWidth: "900px" }}>
        {/* Header Breadcrumb & Title */}
        <div style={{ marginBottom: "28px" }}>
          <Link
            href={`/events/${event.slug}`}
            to={`/events/${event.slug}`}
            style={{ color: "var(--pink-600)", fontSize: "0.9rem", fontWeight: 600, textDecoration: "none" }}
          >
            ← Back to {event.title}
          </Link>
          <h1
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
              margin: "12px 0 6px",
              color: "var(--ink, #2a1726)",
            }}
          >
            Register for {event.title}
          </h1>
          <p style={{ color: "var(--muted)", margin: 0, fontSize: "1rem" }}>
            Organized by: <strong>{event.organizer}</strong> • Venue: <strong>{event.city || event.venue}</strong>
          </p>
        </div>

        {errorMessage && (
          <div
            style={{
              background: "#fee2e2",
              border: "1px solid #ef4444",
              color: "#991b1b",
              padding: "14px 18px",
              borderRadius: "10px",
              marginBottom: "24px",
              fontSize: "0.95rem",
              fontWeight: 500,
            }}
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* STEP 1: Participation Type Selection */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "28px",
              border: "1px solid #f3d9e4",
              marginBottom: "24px",
              boxShadow: "0 4px 16px rgba(42, 23, 38, 0.04)",
            }}
          >
            <h3 style={{ margin: "0 0 8px", fontSize: "1.2rem", color: "var(--ink)" }}>
              Step 1: Choose Participation Type
            </h3>
            <p style={{ margin: "0 0 18px", fontSize: "0.9rem", color: "var(--muted)" }}>
              Select whether you are competing as an Individual or as a Team of 3.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
              {["Individual", "Team of 3"].map((type) => {
                const selected = participationType === type;
                return (
                  <div
                    key={type}
                    onClick={() => setParticipationType(type)}
                    style={{
                      border: selected ? "2px solid var(--pink-600, #e63f87)" : "1.5px solid #e5d8de",
                      background: selected ? "#fff5f9" : "#ffffff",
                      borderRadius: "12px",
                      padding: "18px 20px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      transition: "all 0.2s ease",
                      boxShadow: selected ? "0 4px 14px rgba(230, 63, 135, 0.15)" : "none",
                    }}
                  >
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        border: selected ? "6px solid var(--pink-600)" : "2px solid #bbb",
                        background: "#fff",
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--ink)" }}>{type}</div>
                      <div style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
                        {type === "Individual" ? "1 Participant" : "3 Participants (1 Leader + 2 Members)"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP 2: Participant Details */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "28px",
              border: "1px solid #f3d9e4",
              marginBottom: "24px",
              boxShadow: "0 4px 16px rgba(42, 23, 38, 0.04)",
            }}
          >
            {participationType === "Individual" ? (
              <>
                <h3 style={{ margin: "0 0 18px", fontSize: "1.2rem", color: "var(--ink)" }}>
                  Step 2: Participant Details
                </h3>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
                  <div>
                    <label style={labelStyle}>1. Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Kumar"
                      value={individualData.fullName}
                      onChange={(e) => handleIndividualChange("fullName", e.target.value)}
                      style={inputStyle(errors.fullName)}
                    />
                    {errors.fullName && <div style={errorStyle}>{errors.fullName}</div>}
                  </div>

                  <div>
                    <label style={labelStyle}>2. Mobile Number (10 digits) *</label>
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      maxLength={10}
                      value={individualData.mobileNumber}
                      onChange={(e) => handleIndividualChange("mobileNumber", e.target.value)}
                      style={inputStyle(errors.mobileNumber)}
                    />
                    {errors.mobileNumber && <div style={errorStyle}>{errors.mobileNumber}</div>}
                  </div>

                  <div>
                    <label style={labelStyle}>3. Email Address *</label>
                    <input
                      type="email"
                      placeholder="e.g. rahul@example.com"
                      value={individualData.email}
                      onChange={(e) => handleIndividualChange("email", e.target.value)}
                      style={inputStyle(errors.email)}
                    />
                    {errors.email && <div style={errorStyle}>{errors.email}</div>}
                  </div>

                  <div>
                    <label style={labelStyle}>4. College / School Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Patna Science College"
                      value={individualData.college}
                      onChange={(e) => handleIndividualChange("college", e.target.value)}
                      style={inputStyle(errors.college)}
                    />
                    {errors.college && <div style={errorStyle}>{errors.college}</div>}
                  </div>

                  <div>
                    <label style={labelStyle}>5. Course / Class *</label>
                    <input
                      type="text"
                      placeholder="e.g. B.Tech / B.Sc / 12th"
                      value={individualData.course}
                      onChange={(e) => handleIndividualChange("course", e.target.value)}
                      style={inputStyle(errors.course)}
                    />
                    {errors.course && <div style={errorStyle}>{errors.course}</div>}
                  </div>

                  <div>
                    <label style={labelStyle}>6. Year / Semester *</label>
                    <input
                      type="text"
                      placeholder="e.g. 2nd Year / 4th Sem"
                      value={individualData.year}
                      onChange={(e) => handleIndividualChange("year", e.target.value)}
                      style={inputStyle(errors.year)}
                    />
                    {errors.year && <div style={errorStyle}>{errors.year}</div>}
                  </div>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={labelStyle}>7. City *</label>
                    <input
                      type="text"
                      placeholder="e.g. Patna, Bihar"
                      value={individualData.city}
                      onChange={(e) => handleIndividualChange("city", e.target.value)}
                      style={inputStyle(errors.city)}
                    />
                    {errors.city && <div style={errorStyle}>{errors.city}</div>}
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 style={{ margin: "0 0 18px", fontSize: "1.2rem", color: "var(--ink)" }}>
                  Step 2: Team & Participant Details (Team of 3)
                </h3>

                {/* Team Name */}
                <div style={{ marginBottom: "24px" }}>
                  <label style={labelStyle}>Team Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. The Quizzards"
                    value={teamName}
                    onChange={(e) => {
                      setTeamName(e.target.value);
                      if (errors.teamName) setErrors((prev) => ({ ...prev, teamName: null }));
                    }}
                    style={inputStyle(errors.teamName)}
                  />
                  {errors.teamName && <div style={errorStyle}>{errors.teamName}</div>}
                </div>

                {/* 3 Members */}
                {teamMembers.map((member, idx) => {
                  const isLeader = idx === 0;
                  const prefix = `member_${idx}_`;

                  return (
                    <div
                      key={idx}
                      style={{
                        padding: "20px",
                        borderRadius: "14px",
                        background: isLeader ? "#fffafc" : "#faf8f9",
                        border: isLeader ? "1.5px solid #f3c2d6" : "1px solid #e8e2e5",
                        marginBottom: idx < 2 ? "20px" : "0",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "14px",
                          paddingBottom: "8px",
                          borderBottom: "1px solid rgba(0,0,0,0.06)",
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: "1.05rem", color: isLeader ? "var(--pink-700)" : "var(--ink)" }}>
                          {isLeader ? "👑 TEAM LEADER / MEMBER 1 (PRIMARY CONTACT)" : `MEMBER ${idx + 1}`}
                        </div>
                        {isLeader && (
                          <span
                            style={{
                              fontSize: "0.75rem",
                              background: "var(--pink-600)",
                              color: "#fff",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontWeight: 700,
                            }}
                          >
                            Primary Contact
                          </span>
                        )}
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
                        <div>
                          <label style={labelStyle}>Full Name *</label>
                          <input
                            type="text"
                            placeholder="Full name"
                            value={member.fullName}
                            onChange={(e) => handleMemberChange(idx, "fullName", e.target.value)}
                            style={inputStyle(errors[`${prefix}fullName`])}
                          />
                          {errors[`${prefix}fullName`] && <div style={errorStyle}>{errors[`${prefix}fullName`]}</div>}
                        </div>

                        <div>
                          <label style={labelStyle}>Mobile Number *</label>
                          <input
                            type="tel"
                            maxLength={10}
                            placeholder="10-digit mobile"
                            value={member.mobileNumber}
                            onChange={(e) => handleMemberChange(idx, "mobileNumber", e.target.value)}
                            style={inputStyle(errors[`${prefix}mobileNumber`])}
                          />
                          {errors[`${prefix}mobileNumber`] && <div style={errorStyle}>{errors[`${prefix}mobileNumber`]}</div>}
                        </div>

                        <div>
                          <label style={labelStyle}>Email Address *</label>
                          <input
                            type="email"
                            placeholder="Email"
                            value={member.email}
                            onChange={(e) => handleMemberChange(idx, "email", e.target.value)}
                            style={inputStyle(errors[`${prefix}email`])}
                          />
                          {errors[`${prefix}email`] && <div style={errorStyle}>{errors[`${prefix}email`]}</div>}
                        </div>

                        <div>
                          <label style={labelStyle}>College / School Name *</label>
                          <input
                            type="text"
                            placeholder="College / School"
                            value={member.college}
                            onChange={(e) => handleMemberChange(idx, "college", e.target.value)}
                            style={inputStyle(errors[`${prefix}college`])}
                          />
                          {errors[`${prefix}college`] && <div style={errorStyle}>{errors[`${prefix}college`]}</div>}
                        </div>

                        <div>
                          <label style={labelStyle}>Course / Class *</label>
                          <input
                            type="text"
                            placeholder="Course / Class"
                            value={member.course}
                            onChange={(e) => handleMemberChange(idx, "course", e.target.value)}
                            style={inputStyle(errors[`${prefix}course`])}
                          />
                          {errors[`${prefix}course`] && <div style={errorStyle}>{errors[`${prefix}course`]}</div>}
                        </div>

                        <div>
                          <label style={labelStyle}>Year / Semester *</label>
                          <input
                            type="text"
                            placeholder="Year / Semester"
                            value={member.year}
                            onChange={(e) => handleMemberChange(idx, "year", e.target.value)}
                            style={inputStyle(errors[`${prefix}year`])}
                          />
                          {errors[`${prefix}year`] && <div style={errorStyle}>{errors[`${prefix}year`]}</div>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* STEP 3: Additional Information */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "28px",
              border: "1px solid #f3d9e4",
              marginBottom: "24px",
              boxShadow: "0 4px 16px rgba(42, 23, 38, 0.04)",
            }}
          >
            <h3 style={{ margin: "0 0 18px", fontSize: "1.2rem", color: "var(--ink)" }}>
              Step 3: Additional Information
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
              <div>
                <label style={labelStyle}>How did you hear about {event.title}?</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1.5px solid #d5ccd1",
                    background: "#fff",
                    fontSize: "0.95rem",
                    outline: "none",
                  }}
                >
                  <option value="">Select an option</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Facebook">Facebook</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="College / School">College / School</option>
                  <option value="Friend / Referral">Friend / Referral</option>
                  <option value="Poster / Banner">Poster / Banner</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Previous quiz participation?</label>
                <div style={{ display: "flex", gap: "24px", marginTop: "10px" }}>
                  {["No", "Yes"].map((opt) => (
                    <label key={opt} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.95rem" }}>
                      <input
                        type="radio"
                        name="previousQuiz"
                        value={opt}
                        checked={previousQuizParticipation === opt}
                        onChange={(e) => setPreviousQuizParticipation(e.target.value)}
                        style={{ accentColor: "var(--pink-600)" }}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* STEP 4: Terms & Order Summary */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "28px",
              border: "1px solid #f3d9e4",
              marginBottom: "32px",
              boxShadow: "0 4px 16px rgba(42, 23, 38, 0.04)",
            }}
          >
            <h3 style={{ margin: "0 0 16px", fontSize: "1.2rem", color: "var(--ink)" }}>
              Step 4: Terms & Payment Summary
            </h3>

            {/* Terms Checkbox */}
            <div
              style={{
                background: "#fff9fc",
                padding: "18px",
                borderRadius: "12px",
                border: "1px solid #f3d9e4",
                marginBottom: "24px",
              }}
            >
              <div style={{ fontSize: "0.9rem", color: "#443", marginBottom: "12px", lineHeight: 1.6 }}>
                <strong>Terms & Conditions:</strong>
                <ul style={{ margin: "6px 0 0", paddingLeft: "20px" }}>
                  <li>I confirm that all information provided is accurate and complete.</li>
                  <li>I agree to follow the rules and regulations of {event.title}.</li>
                  <li>I understand that the registration fee is ₹{Number(event.registrationFee).toLocaleString("en-IN")}.</li>
                  <li>I understand that registration is confirmed only after successful payment.</li>
                </ul>
              </div>

              <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked);
                    if (errors.terms) setErrors((prev) => ({ ...prev, terms: null }));
                  }}
                  style={{ width: "18px", height: "18px", accentColor: "var(--pink-600)", marginTop: "2px" }}
                />
                <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--ink)" }}>
                  I have read and agree to all the terms, conditions, and rules of the event *
                </span>
              </label>
              {errors.terms && <div style={{ ...errorStyle, marginTop: "8px" }}>{errors.terms}</div>}
            </div>

            {/* Fee summary card */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "16px",
                padding: "20px",
                background: "linear-gradient(135deg, #2a1726, #4a1936)",
                color: "#ffffff",
                borderRadius: "14px",
              }}
            >
              <div>
                <div style={{ fontSize: "0.85rem", color: "#ffb3d1", textTransform: "uppercase" }}>
                  Total Registration Fee
                </div>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#ffffff" }}>
                  ₹{Number(event.registrationFee).toLocaleString("en-IN")}
                </div>
                <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.7)" }}>
                  {participationType} ({participationType === "Individual" ? "1 Person" : "Team of 3"})
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{
                  padding: "14px 32px",
                  fontSize: "1.05rem",
                  fontWeight: 700,
                  borderRadius: "10px",
                  boxShadow: "0 6px 18px rgba(230, 63, 135, 0.4)",
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? "Opening Razorpay..." : `Pay ₹${Number(event.registrationFee).toLocaleString("en-IN")} & Register`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: "0.88rem",
  fontWeight: 600,
  color: "#3a2333",
  marginBottom: "6px",
};

const inputStyle = (hasError) => ({
  width: "100%",
  padding: "10px 14px",
  borderRadius: "8px",
  border: hasError ? "1.5px solid #ef4444" : "1.5px solid #d5ccd1",
  background: "#ffffff",
  fontSize: "0.95rem",
  color: "#2a1726",
  outline: "none",
  transition: "border 0.2s ease",
});

const errorStyle = {
  color: "#dc2626",
  fontSize: "0.8rem",
  marginTop: "4px",
  fontWeight: 500,
};
