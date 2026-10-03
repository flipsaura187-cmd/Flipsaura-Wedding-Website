"use client";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useRouter } from "@/compat/navigation";
import Link from "@/compat/Link";
import api from "@/api/axios";

export default function AdminEventFormPage() {
  const { id } = useParams();
  const router = useRouter();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    type: "Quiz Competition",
    shortDescription: "",
    description: "",
    bannerImage: "",
    organizer: "FlipsAura",
    venue: "",
    city: "",
    date: "",
    startTime: "",
    endTime: "",
    registrationFee: 1000,
    currency: "INR",
    status: "DRAFT",
    featured: false,
    isRegistrationOpen: true,
    registrationOpenDate: "",
    registrationCloseDate: "",
    participationTypes: ["Individual", "Team of 3"],
    prizes: [
      { rank: "1st Prize", amount: 25000, description: "Winner Trophy + Cash Prize" },
      { rank: "2nd Prize", amount: 15000, description: "Runner-Up Trophy + Cash Prize" },
      { rank: "2nd Runner-Up", amount: 6000, description: "Second Runner-Up Cash Prize" },
    ],
    benefits: [
      "Test knowledge and quick-thinking ability",
      "Compete with students and quiz enthusiasts",
      "Build confidence in a competitive environment",
      "Meet like-minded participants",
      "Showcase knowledge and skills",
    ],
    eventFormat: [
      { round: "Round 1: Preliminary Written Test", details: "Objective questionnaire testing knowledge and logic." },
      { round: "Round 2: Semi-Finals", details: "Buzzer and rapid-fire questions for top-scoring participants." },
      { round: "Round 3: Grand Finale", details: "Multi-round final challenge on the main stage." },
    ],
    rules: [
      "Participants must carry a valid college/school ID card on the event day.",
      "In a team of 3, Member 1 will act as the Team Leader and primary contact.",
      "The decision of the Quiz Masters will be final and binding.",
    ],
    faqs: [
      { question: "Can school students participate?", answer: "Yes, both school and college students are welcome to register." },
      { question: "Is the registration fee refundable?", answer: "Registration fees are strictly non-refundable once paid." },
    ],
    contactInformation: {
      email: "events@flipsaura.com",
      phone: "+91 98765 43210",
    },
  });

  useEffect(() => {
    if (!isEditing) return;

    let isMounted = true;
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/events/admin/${id}`);
        if (res.data?.ok && res.data.data?.event) {
          if (isMounted) {
            const ev = res.data.data.event;
            setFormData({
              title: ev.title || "",
              slug: ev.slug || "",
              type: ev.type || "Competition",
              shortDescription: ev.shortDescription || "",
              description: ev.description || "",
              bannerImage: ev.bannerImage || "",
              organizer: ev.organizer || "FlipsAura",
              venue: ev.venue || "",
              city: ev.city || "",
              date: ev.date ? ev.date.split("T")[0] : "",
              startTime: ev.startTime || "",
              endTime: ev.endTime || "",
              registrationFee: ev.registrationFee ?? 1000,
              currency: ev.currency || "INR",
              status: ev.status || "DRAFT",
              featured: Boolean(ev.featured),
              isRegistrationOpen: ev.isRegistrationOpen ?? true,
              registrationOpenDate: ev.registrationOpenDate ? ev.registrationOpenDate.split("T")[0] : "",
              registrationCloseDate: ev.registrationCloseDate ? ev.registrationCloseDate.split("T")[0] : "",
              participationTypes: Array.isArray(ev.participationTypes) && ev.participationTypes.length > 0
                ? ev.participationTypes
                : ["Individual", "Team of 3"],
              prizes: Array.isArray(ev.prizes) && ev.prizes.length > 0 ? ev.prizes : [],
              benefits: Array.isArray(ev.benefits) && ev.benefits.length > 0 ? ev.benefits : [],
              eventFormat: Array.isArray(ev.eventFormat) && ev.eventFormat.length > 0 ? ev.eventFormat : [],
              rules: Array.isArray(ev.rules) && ev.rules.length > 0 ? ev.rules : [],
              faqs: Array.isArray(ev.faqs) && ev.faqs.length > 0 ? ev.faqs : [],
              contactInformation: {
                email: ev.contactInformation?.email || "",
                phone: ev.contactInformation?.phone || "",
              },
            });
          }
        }
      } catch (err) {
        if (isMounted) setMessage({ type: "error", text: "Failed to load event data" });
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchEvent();
    return () => {
      isMounted = false;
    };
  }, [id, isEditing]);

  // Handlers for Basic info
  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // auto slugify title if not editing an existing slug
      if (field === "title" && !isEditing) {
        updated.slug = value
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/[\s_-]+/g, "-")
          .replace(/^-+|-+$/g, "");
      }
      return updated;
    });
  };

  // Prizes Handlers
  const addPrize = () => {
    setFormData((prev) => ({
      ...prev,
      prizes: [...prev.prizes, { rank: "", amount: 0, description: "" }],
    }));
  };

  const updatePrize = (index, field, value) => {
    setFormData((prev) => {
      const copy = [...prev.prizes];
      copy[index] = { ...copy[index], [field]: value };
      return { ...prev, prizes: copy };
    });
  };

  const removePrize = (index) => {
    setFormData((prev) => ({
      ...prev,
      prizes: prev.prizes.filter((_, i) => i !== index),
    }));
  };

  // Benefits Handlers
  const addBenefit = () => {
    setFormData((prev) => ({ ...prev, benefits: [...prev.benefits, ""] }));
  };

  const updateBenefit = (index, value) => {
    setFormData((prev) => {
      const copy = [...prev.benefits];
      copy[index] = value;
      return { ...prev, benefits: copy };
    });
  };

  const removeBenefit = (index) => {
    setFormData((prev) => ({ ...prev, benefits: prev.benefits.filter((_, i) => i !== index) }));
  };

  // Rounds / Event Format Handlers
  const addRound = () => {
    setFormData((prev) => ({
      ...prev,
      eventFormat: [...prev.eventFormat, { round: `Round ${prev.eventFormat.length + 1}`, details: "" }],
    }));
  };

  const updateRound = (index, field, value) => {
    setFormData((prev) => {
      const copy = [...prev.eventFormat];
      copy[index] = { ...copy[index], [field]: value };
      return { ...prev, eventFormat: copy };
    });
  };

  const removeRound = (index) => {
    setFormData((prev) => ({
      ...prev,
      eventFormat: prev.eventFormat.filter((_, i) => i !== index),
    }));
  };

  // Rules Handlers
  const addRule = () => {
    setFormData((prev) => ({ ...prev, rules: [...prev.rules, ""] }));
  };

  const updateRule = (index, value) => {
    setFormData((prev) => {
      const copy = [...prev.rules];
      copy[index] = value;
      return { ...prev, rules: copy };
    });
  };

  const removeRule = (index) => {
    setFormData((prev) => ({ ...prev, rules: prev.rules.filter((_, i) => i !== index) }));
  };

  // FAQs Handlers
  const addFaq = () => {
    setFormData((prev) => ({
      ...prev,
      faqs: [...prev.faqs, { question: "", answer: "" }],
    }));
  };

  const updateFaq = (index, field, value) => {
    setFormData((prev) => {
      const copy = [...prev.faqs];
      copy[index] = { ...copy[index], [field]: value };
      return { ...prev, faqs: copy };
    });
  };

  const removeFaq = (index) => {
    setFormData((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index),
    }));
  };

  // Toggle Participation Type
  const toggleParticipationType = (type) => {
    setFormData((prev) => {
      const current = prev.participationTypes || [];
      if (current.includes(type)) {
        if (current.length === 1) return prev; // Keep at least one
        return { ...prev, participationTypes: current.filter((t) => t !== type) };
      } else {
        return { ...prev, participationTypes: [...current, type] };
      }
    });
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!formData.title.trim()) {
      setMessage({ type: "error", text: "Event title is required." });
      return;
    }
    if (!formData.slug.trim()) {
      setMessage({ type: "error", text: "Event slug is required." });
      return;
    }

    setSubmitting(true);

    try {
      if (isEditing) {
        const res = await api.put(`/api/events/admin/${id}`, formData);
        if (res.data?.ok) {
          setMessage({ type: "success", text: "Event updated successfully!" });
          setTimeout(() => router.push("/admin/events"), 1200);
        } else {
          throw new Error(res.data?.error || "Failed to update event");
        }
      } else {
        const res = await api.post("/api/events/admin", formData);
        if (res.data?.ok) {
          setMessage({ type: "success", text: "Event created successfully!" });
          setTimeout(() => router.push("/admin/events"), 1200);
        } else {
          throw new Error(res.data?.error || "Failed to create event");
        }
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.error || err.message || "Failed to save event.",
      });
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--muted)" }}>Loading event editor...</div>;
  }

  return (
    <div style={{ maxWidth: "980px" }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <Link
            href="/admin/events"
            to="/admin/events"
            style={{ color: "var(--wine, #8B1E3F)", fontSize: "0.88rem", fontWeight: 600, textDecoration: "none" }}
          >
            ← Back to Events List
          </Link>
          <h1
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "1.8rem",
              margin: "6px 0 0",
              color: "var(--wine, #8B1E3F)",
            }}
          >
            {isEditing ? `Edit Event: ${formData.title}` : "Create New Event"}
          </h1>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="btn btn-primary"
          style={{ padding: "10px 24px", fontWeight: 700, borderRadius: "8px" }}
        >
          {submitting ? "Saving..." : isEditing ? "Save Changes" : "Create Event"}
        </button>
      </div>

      {message.text && (
        <div
          style={{
            background: message.type === "success" ? "#dcfce7" : "#fee2e2",
            border: `1px solid ${message.type === "success" ? "#86efac" : "#fca5a5"}`,
            color: message.type === "success" ? "#166534" : "#991b1b",
            padding: "14px 18px",
            borderRadius: "10px",
            marginBottom: "24px",
            fontWeight: 500,
          }}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
        {/* SECTION 1: Basic Information */}
        <div style={cardStyle}>
          <h3 style={sectionHeadingStyle}>1. Basic Information</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            <div>
              <label style={labelStyle}>Event Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="e.g. THE CIVIC CUP"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Slug (URL identifier) *</label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => handleInputChange("slug", e.target.value)}
                placeholder="e.g. the-civic-cup"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Event Type</label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange("type", e.target.value)}
                style={inputStyle}
              >
                <option value="Quiz Competition">Quiz Competition</option>
                <option value="College Event">College Event</option>
                <option value="Wedding Exhibition">Wedding Exhibition</option>
                <option value="Competition">Competition</option>
                <option value="Workshop">Workshop</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Organizer</label>
              <input
                type="text"
                value={formData.organizer}
                onChange={(e) => handleInputChange("organizer", e.target.value)}
                placeholder="e.g. Flipsaura × Marritcredence"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Registration Fee (₹) *</label>
              <input
                type="number"
                min="0"
                required
                value={formData.registrationFee}
                onChange={(e) => handleInputChange("registrationFee", Number(e.target.value))}
                placeholder="1000"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Banner Image URL</label>
              <input
                type="url"
                value={formData.bannerImage}
                onChange={(e) => handleInputChange("bannerImage", e.target.value)}
                placeholder="https://... or /images/..."
                style={inputStyle}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Short Description (Shown on cards & banner)</label>
              <input
                type="text"
                value={formData.shortDescription}
                onChange={(e) => handleInputChange("shortDescription", e.target.value)}
                placeholder="Brief summary of the event"
                style={inputStyle}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Full Description / About Event *</label>
              <textarea
                rows={5}
                required
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Full details of the competition or event..."
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Date, Time & Venue */}
        <div style={cardStyle}>
          <h3 style={sectionHeadingStyle}>2. Date, Time & Venue</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            <div>
              <label style={labelStyle}>Event Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Start Time</label>
              <input
                type="text"
                placeholder="e.g. 10:00 AM"
                value={formData.startTime}
                onChange={(e) => handleInputChange("startTime", e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>End Time</label>
              <input
                type="text"
                placeholder="e.g. 05:00 PM"
                value={formData.endTime}
                onChange={(e) => handleInputChange("endTime", e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>City</label>
              <input
                type="text"
                placeholder="e.g. Patna, Bihar"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Full Venue Address</label>
              <input
                type="text"
                placeholder="e.g. Gyan Bhavan / Auditorium Name, Gandhi Maidan, Patna"
                value={formData.venue}
                onChange={(e) => handleInputChange("venue", e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Cash Prizes & Rewards */}
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ ...sectionHeadingStyle, margin: 0 }}>3. Cash Prizes & Rewards</h3>
            <button
              type="button"
              onClick={addPrize}
              style={actionBtnStyle}
            >
              + Add Prize
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {formData.prizes.map((prize, idx) => (
              <div
                key={idx}
                style={{
                  display: "grid",
                  gridTemplateColumns: "160px 140px 1fr 40px",
                  gap: "10px",
                  alignItems: "center",
                  background: "#faf8f9",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  border: "1px solid #ebdbe2",
                }}
              >
                <input
                  type="text"
                  placeholder="Rank / Title"
                  value={prize.rank}
                  onChange={(e) => updatePrize(idx, "rank", e.target.value)}
                  style={inputStyle}
                />
                <input
                  type="number"
                  placeholder="Amount ₹"
                  value={prize.amount}
                  onChange={(e) => updatePrize(idx, "amount", Number(e.target.value))}
                  style={inputStyle}
                />
                <input
                  type="text"
                  placeholder="Description / Trophy (optional)"
                  value={prize.description}
                  onChange={(e) => updatePrize(idx, "description", e.target.value)}
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={() => removePrize(idx)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#dc2626",
                    cursor: "pointer",
                    fontSize: "1.2rem",
                  }}
                  title="Remove prize"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4: Benefits / Why Participate */}
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ ...sectionHeadingStyle, margin: 0 }}>4. Why Participate / Benefits</h3>
            <button type="button" onClick={addBenefit} style={actionBtnStyle}>
              + Add Benefit
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {formData.benefits.map((benefit, idx) => (
              <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <input
                  type="text"
                  value={benefit}
                  onChange={(e) => updateBenefit(idx, e.target.value)}
                  placeholder="e.g. Test knowledge and quick-thinking ability"
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={() => removeBenefit(idx)}
                  style={{ background: "transparent", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "1.2rem" }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 5: Event Format / Rounds */}
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ ...sectionHeadingStyle, margin: 0 }}>5. Event Format & Rounds</h3>
            <button type="button" onClick={addRound} style={actionBtnStyle}>
              + Add Round
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {formData.eventFormat.map((r, idx) => (
              <div
                key={idx}
                style={{
                  display: "grid",
                  gridTemplateColumns: "220px 1fr 40px",
                  gap: "10px",
                  alignItems: "center",
                  background: "#faf8f9",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  border: "1px solid #ebdbe2",
                }}
              >
                <input
                  type="text"
                  placeholder="Round Title"
                  value={r.round}
                  onChange={(e) => updateRound(idx, "round", e.target.value)}
                  style={inputStyle}
                />
                <input
                  type="text"
                  placeholder="Round description & rules"
                  value={r.details}
                  onChange={(e) => updateRound(idx, "details", e.target.value)}
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={() => removeRound(idx)}
                  style={{ background: "transparent", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "1.2rem" }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 6: Rules & Regulations */}
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ ...sectionHeadingStyle, margin: 0 }}>6. Rules & Regulations</h3>
            <button type="button" onClick={addRule} style={actionBtnStyle}>
              + Add Rule
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {formData.rules.map((rule, idx) => (
              <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <span style={{ fontSize: "0.9rem", color: "#777", width: "24px" }}>{idx + 1}.</span>
                <input
                  type="text"
                  value={rule}
                  onChange={(e) => updateRule(idx, e.target.value)}
                  placeholder="Rule description..."
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={() => removeRule(idx)}
                  style={{ background: "transparent", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "1.2rem" }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 7: FAQs */}
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ ...sectionHeadingStyle, margin: 0 }}>7. Frequently Asked Questions</h3>
            <button type="button" onClick={addFaq} style={actionBtnStyle}>
              + Add FAQ
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {formData.faqs.map((faq, idx) => (
              <div
                key={idx}
                style={{
                  background: "#faf8f9",
                  padding: "14px",
                  borderRadius: "8px",
                  border: "1px solid #ebdbe2",
                  position: "relative",
                }}
              >
                <button
                  type="button"
                  onClick={() => removeFaq(idx)}
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    background: "transparent",
                    border: "none",
                    color: "#dc2626",
                    fontSize: "1.2rem",
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>
                <div style={{ marginBottom: "8px", paddingRight: "30px" }}>
                  <label style={labelStyle}>Question</label>
                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) => updateFaq(idx, "question", e.target.value)}
                    placeholder="e.g. Can school students participate?"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Answer</label>
                  <textarea
                    rows={2}
                    value={faq.answer}
                    onChange={(e) => updateFaq(idx, "answer", e.target.value)}
                    placeholder="e.g. Yes, all registered students with ID are eligible."
                    style={inputStyle}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 8: Contact & Registration Settings */}
        <div style={cardStyle}>
          <h3 style={sectionHeadingStyle}>8. Contact & Publishing Settings</h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "20px" }}>
            <div>
              <label style={labelStyle}>Support Email</label>
              <input
                type="email"
                value={formData.contactInformation.email}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    contactInformation: { ...prev.contactInformation, email: e.target.value },
                  }))
                }
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Support Phone / WhatsApp</label>
              <input
                type="text"
                value={formData.contactInformation.phone}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    contactInformation: { ...prev.contactInformation, phone: e.target.value },
                  }))
                }
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Publication Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange("status", e.target.value)}
                style={inputStyle}
              >
                <option value="DRAFT">DRAFT (Admin only)</option>
                <option value="PUBLISHED">PUBLISHED (Visible to public)</option>
                <option value="CLOSED">CLOSED (Registration closed)</option>
                <option value="COMPLETED">COMPLETED (Event ended)</option>
              </select>
            </div>
          </div>

          {/* Participation Types Checkboxes */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Allowed Participation Types</label>
            <div style={{ display: "flex", gap: "20px", marginTop: "6px" }}>
              {["Individual", "Team of 3"].map((type) => (
                <label key={type} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formData.participationTypes.includes(type)}
                    onChange={() => toggleParticipationType(type)}
                    style={{ accentColor: "var(--pink-600)" }}
                  />
                  <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Featured & Registration Toggles */}
          <div style={{ display: "flex", gap: "30px", flexWrap: "wrap", paddingTop: "14px", borderTop: "1px solid #ebdbe2" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => handleInputChange("featured", e.target.checked)}
                style={{ width: "18px", height: "18px", accentColor: "var(--pink-600)" }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>⭐ Featured Event</div>
                <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Show on Homepage Top Notification Banner</div>
              </div>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={formData.isRegistrationOpen}
                onChange={(e) => handleInputChange("isRegistrationOpen", e.target.checked)}
                style={{ width: "18px", height: "18px", accentColor: "var(--pink-600)" }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>Registration Open</div>
                <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Accept new participant registrations</div>
              </div>
            </label>
          </div>
        </div>

        {/* Submit Bar */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
          <Link
            href="/admin/events"
            to="/admin/events"
            className="btn btn-outline"
            style={{ padding: "12px 24px", borderRadius: "8px" }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{ padding: "12px 36px", fontSize: "1rem", fontWeight: 700, borderRadius: "8px" }}
          >
            {submitting ? "Saving..." : isEditing ? "Save Changes" : "Create Event"}
          </button>
        </div>
      </form>
    </div>
  );
}

const cardStyle = {
  background: "#ffffff",
  borderRadius: "14px",
  padding: "24px 26px",
  border: "1px solid var(--line, #f3d9e4)",
  boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
};

const sectionHeadingStyle = {
  fontSize: "1.2rem",
  color: "var(--wine, #8B1E3F)",
  marginTop: 0,
  marginBottom: "18px",
};

const labelStyle = {
  display: "block",
  fontSize: "0.85rem",
  fontWeight: 600,
  color: "#3a2333",
  marginBottom: "6px",
};

const inputStyle = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: "8px",
  border: "1.5px solid #d5ccd1",
  background: "#fff",
  fontSize: "0.92rem",
  outline: "none",
  color: "#2a1726",
};

const actionBtnStyle = {
  padding: "6px 14px",
  borderRadius: "6px",
  fontSize: "0.82rem",
  fontWeight: 600,
  background: "var(--pink-50, #fff5f9)",
  color: "var(--pink-700, #b32a68)",
  border: "1px solid var(--pink-200, #ffd0e2)",
  cursor: "pointer",
};
