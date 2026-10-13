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
      <div className="min-h-[75vh] flex items-center justify-center">
        <div className="text-center text-muted">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium">Loading registration portal...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-serif font-bold text-ink mb-3">Event Not Found</h2>
        <Link
          href="/events"
          to="/events"
          className="inline-flex items-center px-6 py-2.5 rounded-full bg-brand-600 text-white font-medium hover:bg-brand-700 transition"
        >
          Browse Events
        </Link>
      </div>
    );
  }

  if (event.isRegistrationOpen === false || event.status !== "PUBLISHED") {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-2xl font-serif font-bold text-ink mb-3">Registration Closed</h2>
        <p className="text-muted mb-6 leading-relaxed">
          Registrations for <strong>{event.title}</strong> are currently closed.
        </p>
        <Link
          href={`/events/${event.slug}`}
          to={`/events/${event.slug}`}
          className="inline-flex items-center px-6 py-2.5 rounded-full bg-brand-600 text-white font-medium hover:bg-brand-700 transition"
        >
          Back to Event Overview
        </Link>
      </div>
    );
  }

  const inputClass = (hasError) =>
    `w-full px-4 py-2.5 rounded-xl border text-sm text-ink placeholder:text-muted/60 bg-white transition focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
      hasError ? "border-rose-400 focus:border-rose-500" : "border-brand-200 focus:border-brand-500"
    }`;

  return (
    <div className="min-h-[90vh] bg-surface py-10 px-4 sm:px-6 lg:px-8 pb-20">
      <div className="max-w-3xl mx-auto">
        {/* Header Breadcrumb & Title */}
        <div className="mb-7">
          <Link
            href={`/events/${event.slug}`}
            to={`/events/${event.slug}`}
            className="text-brand-600 hover:text-brand-700 text-sm font-semibold inline-flex items-center gap-1 transition"
          >
            ← Back to {event.title}
          </Link>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-ink font-bold mt-2.5 mb-1.5">
            Register for {event.title}
          </h1>
          <p className="text-sm text-muted">
            Organized by: <strong className="text-ink">{event.organizer}</strong> • Venue: <strong className="text-ink">{event.city || event.venue}</strong>
          </p>
        </div>

        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl mb-6 text-sm font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: Participation Type Selection */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-brand-100 shadow-sm">
            <h3 className="text-lg font-bold text-ink mb-1">
              Step 1: Choose Participation Type
            </h3>
            <p className="text-xs sm:text-sm text-muted mb-4">
              Select whether you are competing as an Individual or as a Team of 3.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {["Individual", "Team of 3"].map((type) => {
                const selected = participationType === type;
                return (
                  <div
                    key={type}
                    onClick={() => setParticipationType(type)}
                    className={`border rounded-xl p-4 sm:p-5 cursor-pointer flex items-center gap-3.5 transition-all ${
                      selected
                        ? "border-brand-600 bg-brand-50/50 shadow-sm shadow-brand-500/10"
                        : "border-brand-200 bg-white hover:border-brand-300"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        selected ? "border-brand-600 bg-brand-600" : "border-slate-300 bg-white"
                      }`}
                    >
                      {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="font-bold text-sm sm:text-base text-ink">{type}</div>
                      <div className="text-xs text-muted">
                        {type === "Individual" ? "1 Participant" : "3 Participants (1 Leader + 2 Members)"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP 2: Participant Details */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-brand-100 shadow-sm">
            {participationType === "Individual" ? (
              <>
                <h3 className="text-lg font-bold text-ink mb-4">
                  Step 2: Participant Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-ink/80 mb-1.5">1. Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Kumar"
                      value={individualData.fullName}
                      onChange={(e) => handleIndividualChange("fullName", e.target.value)}
                      className={inputClass(errors.fullName)}
                    />
                    {errors.fullName && <div className="text-xs text-rose-600 mt-1">{errors.fullName}</div>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink/80 mb-1.5">2. Mobile Number (10 digits) *</label>
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      maxLength={10}
                      value={individualData.mobileNumber}
                      onChange={(e) => handleIndividualChange("mobileNumber", e.target.value)}
                      className={inputClass(errors.mobileNumber)}
                    />
                    {errors.mobileNumber && <div className="text-xs text-rose-600 mt-1">{errors.mobileNumber}</div>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink/80 mb-1.5">3. Email Address *</label>
                    <input
                      type="email"
                      placeholder="e.g. rahul@example.com"
                      value={individualData.email}
                      onChange={(e) => handleIndividualChange("email", e.target.value)}
                      className={inputClass(errors.email)}
                    />
                    {errors.email && <div className="text-xs text-rose-600 mt-1">{errors.email}</div>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink/80 mb-1.5">4. College / School Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Patna Science College"
                      value={individualData.college}
                      onChange={(e) => handleIndividualChange("college", e.target.value)}
                      className={inputClass(errors.college)}
                    />
                    {errors.college && <div className="text-xs text-rose-600 mt-1">{errors.college}</div>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink/80 mb-1.5">5. Course / Class *</label>
                    <input
                      type="text"
                      placeholder="e.g. B.Tech / B.Sc / 12th"
                      value={individualData.course}
                      onChange={(e) => handleIndividualChange("course", e.target.value)}
                      className={inputClass(errors.course)}
                    />
                    {errors.course && <div className="text-xs text-rose-600 mt-1">{errors.course}</div>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink/80 mb-1.5">6. Year / Semester *</label>
                    <input
                      type="text"
                      placeholder="e.g. 2nd Year / 4th Sem"
                      value={individualData.year}
                      onChange={(e) => handleIndividualChange("year", e.target.value)}
                      className={inputClass(errors.year)}
                    />
                    {errors.year && <div className="text-xs text-rose-600 mt-1">{errors.year}</div>}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-ink/80 mb-1.5">7. City *</label>
                    <input
                      type="text"
                      placeholder="e.g. Patna, Bihar"
                      value={individualData.city}
                      onChange={(e) => handleIndividualChange("city", e.target.value)}
                      className={inputClass(errors.city)}
                    />
                    {errors.city && <div className="text-xs text-rose-600 mt-1">{errors.city}</div>}
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-ink mb-4">
                  Step 2: Team & Participant Details (Team of 3)
                </h3>

                {/* Team Name */}
                <div className="mb-6">
                  <label className="block text-xs font-semibold text-ink/80 mb-1.5">Team Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. The Quizzards"
                    value={teamName}
                    onChange={(e) => {
                      setTeamName(e.target.value);
                      if (errors.teamName) setErrors((prev) => ({ ...prev, teamName: null }));
                    }}
                    className={inputClass(errors.teamName)}
                  />
                  {errors.teamName && <div className="text-xs text-rose-600 mt-1">{errors.teamName}</div>}
                </div>

                {/* 3 Members */}
                <div className="space-y-4">
                  {teamMembers.map((member, idx) => {
                    const isLeader = idx === 0;
                    const prefix = `member_${idx}_`;

                    return (
                      <div
                        key={idx}
                        className={`p-5 rounded-xl border ${
                          isLeader ? "bg-brand-50/40 border-brand-200" : "bg-surface border-brand-100"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-3 pb-2 border-b border-brand-100">
                          <div className={`font-bold text-xs sm:text-sm tracking-wide uppercase ${isLeader ? "text-brand-700" : "text-ink"}`}>
                            {isLeader ? "👑 TEAM LEADER / MEMBER 1 (PRIMARY CONTACT)" : `MEMBER ${idx + 1}`}
                          </div>
                          {isLeader && (
                            <span className="text-[10px] bg-brand-600 text-white px-2 py-0.5 rounded font-bold uppercase">
                              Primary Contact
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                          <div>
                            <label className="block text-xs font-medium text-ink/75 mb-1">Full Name *</label>
                            <input
                              type="text"
                              placeholder="Full name"
                              value={member.fullName}
                              onChange={(e) => handleMemberChange(idx, "fullName", e.target.value)}
                              className={inputClass(errors[`${prefix}fullName`])}
                            />
                            {errors[`${prefix}fullName`] && (
                              <div className="text-[11px] text-rose-600 mt-1">{errors[`${prefix}fullName`]}</div>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-ink/75 mb-1">Mobile Number *</label>
                            <input
                              type="tel"
                              maxLength={10}
                              placeholder="10-digit mobile"
                              value={member.mobileNumber}
                              onChange={(e) => handleMemberChange(idx, "mobileNumber", e.target.value)}
                              className={inputClass(errors[`${prefix}mobileNumber`])}
                            />
                            {errors[`${prefix}mobileNumber`] && (
                              <div className="text-[11px] text-rose-600 mt-1">{errors[`${prefix}mobileNumber`]}</div>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-ink/75 mb-1">Email Address *</label>
                            <input
                              type="email"
                              placeholder="Email"
                              value={member.email}
                              onChange={(e) => handleMemberChange(idx, "email", e.target.value)}
                              className={inputClass(errors[`${prefix}email`])}
                            />
                            {errors[`${prefix}email`] && (
                              <div className="text-[11px] text-rose-600 mt-1">{errors[`${prefix}email`]}</div>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-ink/75 mb-1">College / School Name *</label>
                            <input
                              type="text"
                              placeholder="College / School"
                              value={member.college}
                              onChange={(e) => handleMemberChange(idx, "college", e.target.value)}
                              className={inputClass(errors[`${prefix}college`])}
                            />
                            {errors[`${prefix}college`] && (
                              <div className="text-[11px] text-rose-600 mt-1">{errors[`${prefix}college`]}</div>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-ink/75 mb-1">Course / Class *</label>
                            <input
                              type="text"
                              placeholder="Course / Class"
                              value={member.course}
                              onChange={(e) => handleMemberChange(idx, "course", e.target.value)}
                              className={inputClass(errors[`${prefix}course`])}
                            />
                            {errors[`${prefix}course`] && (
                              <div className="text-[11px] text-rose-600 mt-1">{errors[`${prefix}course`]}</div>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-ink/75 mb-1">Year / Semester *</label>
                            <input
                              type="text"
                              placeholder="Year / Semester"
                              value={member.year}
                              onChange={(e) => handleMemberChange(idx, "year", e.target.value)}
                              className={inputClass(errors[`${prefix}year`])}
                            />
                            {errors[`${prefix}year`] && (
                              <div className="text-[11px] text-rose-600 mt-1">{errors[`${prefix}year`]}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* STEP 3: Additional Information */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-brand-100 shadow-sm">
            <h3 className="text-lg font-bold text-ink mb-4">
              Step 3: Additional Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-ink/80 mb-1.5">
                  How did you hear about {event.title}?
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-brand-200 text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
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
                <label className="block text-xs font-semibold text-ink/80 mb-2">
                  Previous quiz participation?
                </label>
                <div className="flex gap-6 mt-2">
                  {["No", "Yes"].map((opt) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm text-ink">
                      <input
                        type="radio"
                        name="previousQuiz"
                        value={opt}
                        checked={previousQuizParticipation === opt}
                        onChange={(e) => setPreviousQuizParticipation(e.target.value)}
                        className="accent-brand-600 w-4 h-4 cursor-pointer"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* STEP 4: Terms & Order Summary */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-brand-100 shadow-sm">
            <h3 className="text-lg font-bold text-ink mb-4">
              Step 4: Terms & Payment Summary
            </h3>

            {/* Terms Checkbox */}
            <div className="bg-brand-50/50 p-4 sm:p-5 rounded-xl border border-brand-100 mb-6">
              <div className="text-xs text-ink/80 mb-3 leading-relaxed">
                <strong className="text-ink">Terms & Conditions:</strong>
                <ul className="list-disc list-inside mt-1.5 space-y-1">
                  <li>I confirm that all information provided is accurate and complete.</li>
                  <li>I agree to follow the rules and regulations of {event.title}.</li>
                  <li>I understand that the registration fee is ₹{Number(event.registrationFee).toLocaleString("en-IN")}.</li>
                  <li>I understand that registration is confirmed only after successful payment.</li>
                </ul>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked);
                    if (errors.terms) setErrors((prev) => ({ ...prev, terms: null }));
                  }}
                  className="w-4 h-4 accent-brand-600 rounded mt-0.5 cursor-pointer"
                />
                <span className="text-xs sm:text-sm font-semibold text-ink">
                  I have read and agree to all the terms, conditions, and rules of the event *
                </span>
              </label>
              {errors.terms && <div className="text-xs text-rose-600 mt-2">{errors.terms}</div>}
            </div>

            {/* Fee summary card */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-xl bg-gradient-to-r from-ink to-[#4a1936] text-white">
              <div>
                <div className="text-xs text-brand-200 uppercase tracking-wider font-semibold">
                  Total Registration Fee
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white my-0.5 font-sans">
                  ₹{Number(event.registrationFee).toLocaleString("en-IN")}
                </div>
                <div className="text-xs text-white/70">
                  {participationType} ({participationType === "Individual" ? "1 Person" : "Team of 3"})
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="px-6 sm:px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-bold text-sm sm:text-base shadow-lg shadow-brand-600/40 transition disabled:opacity-60 disabled:cursor-not-allowed"
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
