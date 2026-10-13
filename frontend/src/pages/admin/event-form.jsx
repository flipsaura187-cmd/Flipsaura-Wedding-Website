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

  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
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

  // Dynamic Array Handlers
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

  const toggleParticipationType = (type) => {
    setFormData((prev) => {
      const current = prev.participationTypes || [];
      if (current.includes(type)) {
        if (current.length === 1) return prev;
        return { ...prev, participationTypes: current.filter((t) => t !== type) };
      } else {
        return { ...prev, participationTypes: [...current, type] };
      }
    });
  };

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
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-muted">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm">Loading event editor...</p>
        </div>
      </div>
    );
  }

  const inputClass =
    "w-full px-3.5 py-2.5 rounded-xl border border-brand-200 text-sm text-ink placeholder:text-muted/60 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500";
  const labelClass = "block text-xs font-semibold text-ink/80 mb-1.5";
  const sectionCardClass = "bg-white rounded-2xl p-6 sm:p-7 border border-brand-100 shadow-sm space-y-4";
  const sectionTitleClass = "font-serif text-lg sm:text-xl font-bold text-ink";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/events"
            to="/admin/events"
            className="text-brand-600 hover:text-brand-700 text-sm font-semibold inline-flex items-center gap-1 transition"
          >
            ← Back to Events List
          </Link>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink mt-1">
            {isEditing ? `Edit Event: ${formData.title}` : "Create New Event"}
          </h1>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-sm transition disabled:opacity-50"
        >
          {submitting ? "Saving..." : isEditing ? "Save Changes" : "Create Event"}
        </button>
      </div>

      {message.text && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Basic Information */}
        <div className={sectionCardClass}>
          <h3 className={sectionTitleClass}>1. Basic Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Event Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="e.g. THE CIVIC CUP"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Slug (URL identifier) *</label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => handleInputChange("slug", e.target.value)}
                placeholder="e.g. the-civic-cup"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Event Type</label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange("type", e.target.value)}
                className={inputClass}
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
              <label className={labelClass}>Organizer</label>
              <input
                type="text"
                value={formData.organizer}
                onChange={(e) => handleInputChange("organizer", e.target.value)}
                placeholder="e.g. Flipsaura × Marritcredence"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Registration Fee (₹) *</label>
              <input
                type="number"
                min="0"
                required
                value={formData.registrationFee}
                onChange={(e) => handleInputChange("registrationFee", Number(e.target.value))}
                placeholder="1000"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Banner Image URL</label>
              <input
                type="url"
                value={formData.bannerImage}
                onChange={(e) => handleInputChange("bannerImage", e.target.value)}
                placeholder="https://... or /images/..."
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>Short Description (Shown on cards & banner)</label>
              <input
                type="text"
                value={formData.shortDescription}
                onChange={(e) => handleInputChange("shortDescription", e.target.value)}
                placeholder="Brief summary of the event"
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>Full Description / About Event *</label>
              <textarea
                rows={4}
                required
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Full details of the competition or event..."
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Date, Time & Venue */}
        <div className={sectionCardClass}>
          <h3 className={sectionTitleClass}>2. Date, Time & Venue</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Event Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Start Time</label>
              <input
                type="text"
                placeholder="e.g. 10:00 AM"
                value={formData.startTime}
                onChange={(e) => handleInputChange("startTime", e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>End Time</label>
              <input
                type="text"
                placeholder="e.g. 05:00 PM"
                value={formData.endTime}
                onChange={(e) => handleInputChange("endTime", e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-1">
              <label className={labelClass}>City</label>
              <input
                type="text"
                placeholder="e.g. Patna, Bihar"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>Full Venue Address</label>
              <input
                type="text"
                placeholder="e.g. Gyan Bhavan, Gandhi Maidan, Patna"
                value={formData.venue}
                onChange={(e) => handleInputChange("venue", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Cash Prizes & Rewards */}
        <div className={sectionCardClass}>
          <div className="flex justify-between items-center">
            <h3 className={sectionTitleClass}>3. Cash Prizes & Rewards</h3>
            <button
              type="button"
              onClick={addPrize}
              className="px-3 py-1 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 text-xs font-semibold border border-brand-200 transition"
            >
              + Add Prize
            </button>
          </div>

          <div className="space-y-3">
            {formData.prizes.map((prize, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-surface p-3.5 rounded-xl border border-brand-100"
              >
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    placeholder="Rank / Title"
                    value={prize.rank}
                    onChange={(e) => updatePrize(idx, "rank", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="number"
                    placeholder="Amount ₹"
                    value={prize.amount}
                    onChange={(e) => updatePrize(idx, "amount", Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    placeholder="Description / Trophy"
                    value={prize.description}
                    onChange={(e) => updatePrize(idx, "description", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-1 text-center">
                  <button
                    type="button"
                    onClick={() => removePrize(idx)}
                    className="text-rose-600 hover:text-rose-800 text-lg font-bold"
                    title="Remove prize"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4: Benefits / Why Participate */}
        <div className={sectionCardClass}>
          <div className="flex justify-between items-center">
            <h3 className={sectionTitleClass}>4. Why Participate / Benefits</h3>
            <button
              type="button"
              onClick={addBenefit}
              className="px-3 py-1 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 text-xs font-semibold border border-brand-200 transition"
            >
              + Add Benefit
            </button>
          </div>

          <div className="space-y-2.5">
            {formData.benefits.map((benefit, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={benefit}
                  onChange={(e) => updateBenefit(idx, e.target.value)}
                  placeholder="e.g. Test knowledge and quick-thinking ability"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => removeBenefit(idx)}
                  className="text-rose-600 hover:text-rose-800 text-lg font-bold px-2"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 5: Event Format / Rounds */}
        <div className={sectionCardClass}>
          <div className="flex justify-between items-center">
            <h3 className={sectionTitleClass}>5. Event Format & Rounds</h3>
            <button
              type="button"
              onClick={addRound}
              className="px-3 py-1 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 text-xs font-semibold border border-brand-200 transition"
            >
              + Add Round
            </button>
          </div>

          <div className="space-y-3">
            {formData.eventFormat.map((r, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-surface p-3.5 rounded-xl border border-brand-100"
              >
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    placeholder="Round Title"
                    value={r.round}
                    onChange={(e) => updateRound(idx, "round", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-7">
                  <input
                    type="text"
                    placeholder="Round description & rules"
                    value={r.details}
                    onChange={(e) => updateRound(idx, "details", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-1 text-center">
                  <button
                    type="button"
                    onClick={() => removeRound(idx)}
                    className="text-rose-600 hover:text-rose-800 text-lg font-bold"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 6: Rules & Regulations */}
        <div className={sectionCardClass}>
          <div className="flex justify-between items-center">
            <h3 className={sectionTitleClass}>6. Rules & Regulations</h3>
            <button
              type="button"
              onClick={addRule}
              className="px-3 py-1 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 text-xs font-semibold border border-brand-200 transition"
            >
              + Add Rule
            </button>
          </div>

          <div className="space-y-2.5">
            {formData.rules.map((rule, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <span className="text-xs text-muted w-6 text-center font-bold">{idx + 1}.</span>
                <input
                  type="text"
                  value={rule}
                  onChange={(e) => updateRule(idx, e.target.value)}
                  placeholder="Rule description..."
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => removeRule(idx)}
                  className="text-rose-600 hover:text-rose-800 text-lg font-bold px-2"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 7: FAQs */}
        <div className={sectionCardClass}>
          <div className="flex justify-between items-center">
            <h3 className={sectionTitleClass}>7. Frequently Asked Questions</h3>
            <button
              type="button"
              onClick={addFaq}
              className="px-3 py-1 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 text-xs font-semibold border border-brand-200 transition"
            >
              + Add FAQ
            </button>
          </div>

          <div className="space-y-3">
            {formData.faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-surface p-4 rounded-xl border border-brand-100 relative space-y-3"
              >
                <button
                  type="button"
                  onClick={() => removeFaq(idx)}
                  className="absolute top-3 right-3 text-rose-600 hover:text-rose-800 text-base font-bold"
                >
                  ✕
                </button>
                <div className="pr-8">
                  <label className={labelClass}>Question</label>
                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) => updateFaq(idx, "question", e.target.value)}
                    placeholder="e.g. Can school students participate?"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Answer</label>
                  <textarea
                    rows={2}
                    value={faq.answer}
                    onChange={(e) => updateFaq(idx, "answer", e.target.value)}
                    placeholder="e.g. Yes, all registered students with ID are eligible."
                    className={inputClass}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 8: Contact & Registration Settings */}
        <div className={sectionCardClass}>
          <h3 className={sectionTitleClass}>8. Contact & Publishing Settings</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className={labelClass}>Support Email</label>
              <input
                type="email"
                value={formData.contactInformation.email}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    contactInformation: { ...prev.contactInformation, email: e.target.value },
                  }))
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Support Phone / WhatsApp</label>
              <input
                type="text"
                value={formData.contactInformation.phone}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    contactInformation: { ...prev.contactInformation, phone: e.target.value },
                  }))
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Publication Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange("status", e.target.value)}
                className={inputClass}
              >
                <option value="DRAFT">DRAFT (Admin only)</option>
                <option value="PUBLISHED">PUBLISHED (Visible to public)</option>
                <option value="CLOSED">CLOSED (Registration closed)</option>
                <option value="COMPLETED">COMPLETED (Event ended)</option>
              </select>
            </div>
          </div>

          {/* Participation Types Checkboxes */}
          <div className="mb-4">
            <label className={labelClass}>Allowed Participation Types</label>
            <div className="flex gap-5 mt-1.5">
              {["Individual", "Team of 3"].map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer text-sm text-ink font-semibold">
                  <input
                    type="checkbox"
                    checked={formData.participationTypes.includes(type)}
                    onChange={() => toggleParticipationType(type)}
                    className="w-4 h-4 accent-brand-600 rounded cursor-pointer"
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>

          {/* Featured & Registration Toggles */}
          <div className="flex flex-wrap gap-8 pt-4 border-t border-brand-100">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => handleInputChange("featured", e.target.checked)}
                className="w-4 h-4 accent-brand-600 rounded cursor-pointer"
              />
              <div>
                <div className="font-semibold text-sm text-ink">⭐ Featured Event</div>
                <div className="text-xs text-muted">Show on Homepage Top Notification Banner</div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isRegistrationOpen}
                onChange={(e) => handleInputChange("isRegistrationOpen", e.target.checked)}
                className="w-4 h-4 accent-brand-600 rounded cursor-pointer"
              />
              <div>
                <div className="font-semibold text-sm text-ink">Registration Open</div>
                <div className="text-xs text-muted">Accept new participant registrations</div>
              </div>
            </label>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex justify-end gap-3 pt-2">
          <Link
            href="/admin/events"
            to="/admin/events"
            className="px-6 py-2.5 rounded-xl border border-brand-200 text-ink hover:bg-brand-50 text-sm font-semibold transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md transition disabled:opacity-50"
          >
            {submitting ? "Saving..." : isEditing ? "Save Changes" : "Create Event"}
          </button>
        </div>
      </form>
    </div>
  );
}
