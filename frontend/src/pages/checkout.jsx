"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "@/compat/navigation";
import Script from "@/compat/Script";
import { useAuth } from "@/context/AuthContext";
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

const CATEGORY_CONFIGS = {
  mehndi: {
    title: "Mehndi Services",
    badge: "🌿 Mehndi Artist Booking",
    dateLabel: "Mehndi / Function Date *",
    dateHelp: "Select the date when mehndi will be applied",
    optionLabel: "Service For",
    options: ["Bridal Mehndi", "Bride + Family (2-5)", "Guest Group (5+)", "Engagement / Roka"],
    defaultOption: "Bridal Mehndi",
    addressLabel: "Artist Visit Address (Home / Hotel Room) *",
    addressPlaceholder: "e.g. Home address, Colony, Flat/House No., Landmark, or Hotel room where artist will visit",
    addressRequired: true,
    notesLabel: "Special Requests (Optional)",
    notesPlaceholder: "e.g. Prefer organic henna, full hands & feet bridal design, specific timings...",
  },
  hotel: {
    title: "Hotel Stay",
    badge: "🏨 Hotel Room Reservation",
    dateLabel: "Check-in Date *",
    dateHelp: "Night of your arrival",
    showCheckOut: true,
    checkOutLabel: "Check-out Date (Optional)",
    optionLabel: "Total Guests",
    options: ["1 Guest", "2 Guests", "3 - 4 Guests", "Group / Family"],
    defaultOption: "2 Guests",
    isHotelProperty: true, // No user venue address needed — stay is at the hotel itself
    addressRequired: false,
    notesLabel: "Stay Preferences (Optional)",
    notesPlaceholder: "e.g. Early check-in requested, ground floor preference, extra mattress...",
  },
  photography: {
    title: "Photography & Videography",
    badge: "📸 Shoot & Coverage Booking",
    dateLabel: "Shoot / Event Date *",
    dateHelp: "Date of the ceremony or shoot",
    optionLabel: "Occasion Type",
    options: ["Full Wedding & Reception", "Pre-Wedding Shoot", "Engagement / Roka", "Haldi & Sangeet"],
    defaultOption: "Full Wedding & Reception",
    addressLabel: "Shoot Venue / Location *",
    addressPlaceholder: "e.g. Wedding venue name, outdoor location, or city",
    addressRequired: true,
    notesLabel: "Coverage Preferences (Optional)",
    notesPlaceholder: "e.g. Traditional & candid coverage, cinematic drone video, event timings...",
  },
  makeup: {
    title: "Bridal Makeup & Grooming",
    badge: "💄 Makeover & Styling Booking",
    dateLabel: "Function / Event Date *",
    dateHelp: "Date when makeup artist is required",
    showTime: true,
    timeLabel: "Ready-by Time (Optional)",
    timePlaceholder: "e.g. Ready by 5:00 PM",
    optionLabel: "Service For",
    options: ["Bridal Makeup", "Engagement / Reception", "Party Makeup (Family)", "Groom Styling"],
    defaultOption: "Bridal Makeup",
    addressLabel: "Service Location (Home / Bridal Room) *",
    addressPlaceholder: "e.g. Home address or venue bridal changing room",
    addressRequired: true,
    notesLabel: "Styling Preferences (Optional)",
    notesPlaceholder: "e.g. HD / Airbrush makeup preference, saree draping, hair accessories...",
  },
  catering: {
    title: "Food & Catering",
    badge: "🍽️ Catering & Food Service",
    dateLabel: "Event / Serving Date *",
    dateHelp: "Date of dining / feast",
    optionLabel: "Expected Gathering",
    options: ["50 - 100 Guests", "100 - 250 Guests", "250 - 500 Guests", "500+ Guests"],
    defaultOption: "100 - 250 Guests",
    secondaryOptionLabel: "Meal Preference",
    secondaryOptions: ["Pure Vegetarian", "Veg & Non-Veg"],
    defaultSecondaryOption: "Pure Vegetarian",
    addressLabel: "Serving Venue / Event Location *",
    addressPlaceholder: "e.g. Banquet hall, lawn, farmhouse, or community center address",
    addressRequired: true,
    notesLabel: "Menu & Setup Notes (Optional)",
    notesPlaceholder: "e.g. Buffet setup, specific sweet dishes, live counter requirements...",
  },
  venue: {
    title: "Venue & Resort",
    badge: "🏛️ Venue & Hall Booking",
    dateLabel: "Wedding / Event Date *",
    dateHelp: "Date of your main function",
    optionLabel: "Event Slot",
    options: ["Evening / Night", "Day Function", "Full Day (24 Hrs)"],
    defaultOption: "Evening / Night",
    secondaryOptionLabel: "Approx Gathering",
    secondaryOptions: ["100 - 250", "250 - 500", "500 - 1000", "1000+"],
    defaultSecondaryOption: "250 - 500",
    addressLabel: "Your Current City / Base Location *",
    addressPlaceholder: "e.g. Aurangabad, Bihar (for booking paperwork & contact)",
    addressRequired: true,
    notesLabel: "Venue Requirements (Optional)",
    notesPlaceholder: "e.g. Guest rooms needed, lawn + hall combination, decorator setup timing...",
  },
  transport: {
    title: "Wedding Transport",
    badge: "🚗 Vehicle & Travel Booking",
    dateLabel: "Booking / Journey Date *",
    dateHelp: "Date vehicles are required",
    showTime: true,
    timeLabel: "Pickup Time (Optional)",
    timePlaceholder: "e.g. 5:30 PM (Baraat time)",
    optionLabel: "Vehicle Purpose",
    options: ["Baraat Luxury Car", "Guest Pickup & Drop", "Full Day Wedding Hire", "Doli / Bridal Car"],
    defaultOption: "Baraat Luxury Car",
    addressLabel: "Pickup Location / Address *",
    addressPlaceholder: "e.g. Hotel, home, or starting location",
    addressRequired: true,
    showSecondaryAddress: true,
    secondaryAddressLabel: "Drop / Destination Location *",
    secondaryAddressPlaceholder: "e.g. Wedding venue or arrival city",
    notesLabel: "Special Instructions (Optional)",
    notesPlaceholder: "e.g. Flower car decoration requested, route preferences...",
  },
  pandit: {
    title: "Pandit & Priest",
    badge: "🪔 Vedic Priest / Puja Booking",
    dateLabel: "Puja / Wedding Date *",
    dateHelp: "Date of rituals and ceremonies",
    optionLabel: "Ritual Ceremony",
    options: ["Wedding Vivah Sanskar", "Engagement / Tilak", "Satyanarayan Katha", "Griha Pravesh", "Havan / Puja"],
    defaultOption: "Wedding Vivah Sanskar",
    addressLabel: "Puja Location (Home / Mandap Address) *",
    addressPlaceholder: "e.g. Complete home address or wedding mandap venue",
    addressRequired: true,
    notesLabel: "Tradition & Muhurat (Optional)",
    notesPlaceholder: "e.g. Maithil, Bhojpuri, Marwari, South Indian tradition, preferred muhurat...",
  },
  invites: {
    title: "Invites & Gifts",
    badge: "💌 Wedding Cards & Gifts",
    dateLabel: "Required Delivery Date *",
    dateHelp: "Date by which cards/gifts must arrive",
    optionLabel: "Order Type",
    options: ["Printed Wedding Cards", "Digital E-Invite / Video", "Return Gifts & Favours", "Sweets / Hamper Boxes"],
    defaultOption: "Printed Wedding Cards",
    addressLabel: "Complete Shipping / Delivery Address *",
    addressPlaceholder: "e.g. Full delivery address with PIN code & Landmark",
    addressRequired: true,
    notesLabel: "Quantity & Printing Details (Optional)",
    notesPlaceholder: "e.g. Approx 200 cards, Hindi/English wording preference...",
  },
  homesetup: {
    title: "Home Setup (Pandal / DJ / Lights)",
    badge: "🎪 Ghar Setup & Pandal Booking",
    dateLabel: "Setup Required Date *",
    dateHelp: "Date when setup needs to be ready",
    optionLabel: "Required Services",
    options: ["Full Ghar Setup", "Pandal & Tents Only", "DJ & Sound System", "Lighting & Gate Entry"],
    defaultOption: "Full Ghar Setup",
    addressLabel: "House / Setup Location Address *",
    addressPlaceholder: "e.g. House No., Lane / Mohalla, Landmark, City",
    addressRequired: true,
    notesLabel: "Space & Setup Details (Optional)",
    notesPlaceholder: "e.g. Lawn/roof area available, power supply details, color theme...",
  },
  music: {
    title: "Music & Band",
    badge: "🎵 Live Music & Orchestra",
    dateLabel: "Performance Date *",
    dateHelp: "Date of musical program",
    optionLabel: "Event Occasion",
    options: ["Baraat Band & Dhol", "Sangeet / DJ Night", "Live Orchestra & Stage", "Shehnai Welcome"],
    defaultOption: "Baraat Band & Dhol",
    addressLabel: "Performance Venue / Route *",
    addressPlaceholder: "e.g. Baraat starting location, hall or stage venue",
    addressRequired: true,
    notesLabel: "Musical Preferences (Optional)",
    notesPlaceholder: "e.g. Song choices, team size preference, stage timing...",
  },
  general: {
    title: "Wedding Service",
    badge: "✨ Wedding Service Booking",
    dateLabel: "Event / Service Date *",
    dateHelp: "Date when service is needed",
    optionLabel: "Service Package",
    options: ["Standard Package", "Custom Requirement", "Consultation"],
    defaultOption: "Standard Package",
    addressLabel: "Event / Service Address *",
    addressPlaceholder: "e.g. Venue name or service address in city",
    addressRequired: true,
    notesLabel: "Special Notes (Optional)",
    notesPlaceholder: "e.g. Any special instructions or requests for the vendor...",
  },
};

export default function CheckoutPageCom() {
  const sp = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const itemId = sp.get("itemId");
  const roomId = sp.get("roomId");
  const roomName = sp.get("roomName");
  const queryPrice = sp.get("price") ? Number(sp.get("price")) : null;

  const [item, setItem] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Unified, category-aware checkout form state
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    secondaryDate: "",
    time: "",
    address: "",
    secondaryAddress: "",
    categoryOption: "",
    secondaryOption: "",
    notes: "",
  });

  const todayStr = useMemo(() => {
    return new Date().toISOString().split("T")[0];
  }, []);

  // Fetch item details
  useEffect(() => {
    if (!itemId) return;
    (async () => {
      try {
        const { data: j } = await api.get(`/api/items/${itemId}`);
        if (j.ok) setItem(j.data.item);
      } catch (err) {
        console.error("Failed to load item:", err);
      }
    })();
  }, [itemId]);

  // Pre-fill user contact info
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || user.name || "",
        email: prev.email || user.email || "",
        phone: prev.phone || user.phone || "",
      }));
    }
  }, [user]);

  // Determine category archetype
  const categoryType = useMemo(() => {
    if (!item) return "general";
    const slug = (item.category?.slug || "").toLowerCase().trim();
    const name = (item.category?.name || "").toLowerCase().trim();
    const title = (item.title || "").toLowerCase();

    if (slug.includes("mehndi") || name.includes("mehndi") || title.includes("mehndi")) {
      return "mehndi";
    }
    if (
      slug === "hotels" ||
      slug.includes("hotel") ||
      name.includes("hotel") ||
      title.includes("hotel") ||
      title.includes("resort") ||
      title.includes("inn") ||
      roomId ||
      roomName ||
      (Array.isArray(item.rooms) && item.rooms.length > 0)
    ) {
      return "hotel";
    }
    if (slug.includes("photograph") || slug.includes("video") || name.includes("photograph")) {
      return "photography";
    }
    if (slug.includes("makeup") || slug.includes("grooming") || name.includes("makeup")) {
      return "makeup";
    }
    if (slug.includes("catering") || slug.includes("food") || name.includes("catering")) {
      return "catering";
    }
    if (slug.includes("venue") || name.includes("venue")) {
      return "venue";
    }
    if (slug.includes("transport") || slug.includes("car") || name.includes("transport")) {
      return "transport";
    }
    if (slug.includes("pandit") || slug.includes("priest") || name.includes("pandit")) {
      return "pandit";
    }
    if (slug.includes("invite") || slug.includes("gift") || name.includes("invite")) {
      return "invites";
    }
    if (slug.includes("home-setup") || slug.includes("tent") || slug.includes("pandal") || name.includes("pandal")) {
      return "homesetup";
    }
    if (slug.includes("music") || slug.includes("orchestra") || slug.includes("band") || name.includes("music") || name.includes("orchestra")) {
      return "music";
    }
    if (slug.includes("planning") || slug.includes("decor") || name.includes("planning") || name.includes("decor")) {
      return "venue";
    }
    return "general";
  }, [item, roomId, roomName]);

  const config = CATEGORY_CONFIGS[categoryType] || CATEGORY_CONFIGS.general;

  // Initialize category option defaults when categoryType resolves
  useEffect(() => {
    if (config.defaultOption) {
      setForm((prev) => ({
        ...prev,
        categoryOption: prev.categoryOption || config.defaultOption,
        secondaryOption: prev.secondaryOption || config.defaultSecondaryOption || "",
      }));
    }
  }, [config]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!user) {
      setError("Please sign in to your FlipsAura account to confirm your booking.");
      const currentPath = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/checkout";
      router.push(`/login?next=${encodeURIComponent(currentPath)}`);
      return;
    }

    if (!form.date) {
      setError(`Please select a valid ${config.dateLabel.replace(" *", "")}.`);
      return;
    }

    if (config.addressRequired && !form.address.trim()) {
      setError(`Please enter your ${config.addressLabel.replace(" *", "")}.`);
      return;
    }

    if (config.showSecondaryAddress && !form.secondaryAddress.trim()) {
      setError(`Please enter your ${config.secondaryAddressLabel.replace(" *", "")}.`);
      return;
    }

    setBusy(true);
    try {
      // 1. Ensure Razorpay SDK is loaded
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        throw new Error("Razorpay payment gateway failed to load. Please check your internet connection.");
      }

      const payableAmount = queryPrice !== null && !isNaN(queryPrice) && queryPrice >= 0 ? queryPrice : (item?.price || 0);

      // Resolve address appropriately for the category
      let resolvedAddress = form.address.trim();
      if (config.isHotelProperty) {
        resolvedAddress = `Hotel Stay at: ${item.title}${item.city ? `, ${item.city}` : ""}`;
      } else if (config.showSecondaryAddress) {
        resolvedAddress = `Pickup: ${form.address.trim()} | Drop: ${form.secondaryAddress.trim()}`;
      }

      // Build readable, highly-structured notes for WhatsApp, Admin & Vendor dashboards
      const notesParts = [];
      if (roomName) notesParts.push(`Room: ${roomName}`);
      if (form.categoryOption) notesParts.push(`${config.optionLabel || "Type"}: ${form.categoryOption}`);
      if (form.secondaryOption) notesParts.push(`${config.secondaryOptionLabel || "Preference"}: ${form.secondaryOption}`);
      if (form.time?.trim()) notesParts.push(`Time: ${form.time.trim()}`);
      if (config.showCheckOut && form.secondaryDate) notesParts.push(`Check-out: ${form.secondaryDate}`);
      if (form.notes?.trim()) notesParts.push(`Note: ${form.notes.trim()}`);

      const bookingNotes = notesParts.join(" • ");

      // 2. Create booking
      const { data: j1 } = await api.post("/api/bookings", {
        itemId,
        amount: payableAmount,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        eventDate: form.date,
        address: resolvedAddress,
        notes: bookingNotes,
      });

      if (!j1.ok) throw new Error(j1.error || "Could not create booking");
      const booking = j1.data.booking;

      // 3. Create Razorpay order
      const { data: j2 } = await api.post("/api/payment/create-order", { bookingId: booking._id });
      if (!j2.ok) throw new Error(j2.error || "Payment initialization failed");

      // 4. Open Razorpay checkout
      const options = {
        key: j2.data.keyId,
        amount: j2.data.amount,
        currency: j2.data.currency,
        order_id: j2.data.orderId,
        name: "FlipsAura",
        description: `${item?.title || "Wedding Service"} Booking`,
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: "#e63f87" },
        handler: async (resp) => {
          try {
            const { data: j3 } = await api.post("/api/payment/verify", {
              bookingId: booking._id,
              ...resp,
            });
            if (j3.ok) router.push(`/account?booking=${booking._id}`);
            else setError(j3.error || "Verification failed");
          } catch (err) {
            setError(err?.response?.data?.error || err.message || "Payment verification failed");
          } finally {
            setBusy(false);
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        setBusy(false);
        setError(response.error.description || "Payment failed. Please try again.");
      });
      rzp.open();
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
      setBusy(false);
    }
  };

  if (!itemId) {
    return (
      <div className="max-w-container mx-auto px-4 py-20 text-center text-muted">
        Pick an item first before checking out.
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-container mx-auto px-4 py-20 text-center text-brand-600 font-semibold animate-pulse">
        Loading checkout details…
      </div>
    );
  }

  const payableAmount = queryPrice !== null && !isNaN(queryPrice) && queryPrice >= 0 ? queryPrice : (item?.price || 0);

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <section className="py-8 md:py-14 bg-white min-h-[85vh]">
        <div className="max-w-container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Form Column */}
            <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-brand-100 shadow-xl shadow-brand-500/5 space-y-6">
              {/* Header with Category Badge */}
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-100 mb-2">
                  <span>{config.badge}</span>
                </div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink tracking-tight">
                  {config.title} Checkout
                </h1>
                <p className="text-muted text-xs sm:text-sm mt-1">
                  Quick, category-tailored booking details for a smooth wedding experience.
                </p>
              </div>

              {!user && (
                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="text-xs sm:text-sm">
                    <span className="font-bold">⚠️ Login Required:</span> Please sign in to your FlipsAura account to confirm this booking.
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const currentPath = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/checkout";
                      router.push(`/login?next=${encodeURIComponent(currentPath)}`);
                    }}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-xs shrink-0 cursor-pointer transition text-center"
                  >
                    Login / Sign In →
                  </button>
                </div>
              )}

              {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span>
                    {error === "Unauthorized" || String(error).toLowerCase().includes("unauthorized")
                      ? "You must be signed in to create a booking. Please login to your account."
                      : error}
                  </span>
                  {(!user || error === "Unauthorized" || String(error).toLowerCase().includes("unauthorized")) && (
                    <button
                      type="button"
                      onClick={() => {
                        const currentPath = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/checkout";
                        router.push(`/login?next=${encodeURIComponent(currentPath)}`);
                      }}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shrink-0 cursor-pointer transition text-center"
                    >
                      Login Now →
                    </button>
                  )}
                </div>
              )}

              <form onSubmit={submit} className="space-y-5">
                {/* 1. Contact Info (Compact 2-column) */}
                <div className="p-4 rounded-xl bg-brand-50/40 border border-brand-100 space-y-3">
                  <div className="text-xs font-bold text-ink uppercase tracking-wider flex items-center justify-between">
                    <span>1. Contact Details</span>
                    {user && <span className="text-[11px] text-emerald-600 font-semibold">✓ Signed In</span>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">Full Name *</label>
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Enter your name"
                      className="w-full px-3.5 py-2 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1">Phone Number *</label>
                      <input
                        required
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="10-digit mobile number"
                        className="w-full px-3.5 py-2 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1">Email Address *</label>
                      <input
                        required
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="name@example.com"
                        className="w-full px-3.5 py-2 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Category-Specific Booking Details */}
                <div className="space-y-4 pt-1">
                  <div className="text-xs font-bold text-ink uppercase tracking-wider">
                    2. {config.title} Details
                  </div>

                  {/* Primary Date (& optional Secondary Date / Time) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">
                        {config.dateLabel}
                      </label>
                      <input
                        type="date"
                        required
                        min={todayStr}
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                      />
                      {config.dateHelp && (
                        <p className="text-[11px] text-muted mt-1">{config.dateHelp}</p>
                      )}
                    </div>

                    {config.showCheckOut && (
                      <div>
                        <label className="block text-xs font-semibold text-ink mb-1">
                          {config.checkOutLabel}
                        </label>
                        <input
                          type="date"
                          min={form.date || todayStr}
                          value={form.secondaryDate}
                          onChange={(e) => setForm({ ...form, secondaryDate: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                        />
                        <p className="text-[11px] text-muted mt-1">Optional departure date</p>
                      </div>
                    )}

                    {config.showTime && (
                      <div>
                        <label className="block text-xs font-semibold text-ink mb-1">
                          {config.timeLabel}
                        </label>
                        <input
                          type="text"
                          value={form.time}
                          onChange={(e) => setForm({ ...form, time: e.target.value })}
                          placeholder={config.timePlaceholder}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                        />
                      </div>
                    )}
                  </div>

                  {/* Primary Category Pill Selector */}
                  {config.options?.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-2">
                        {config.optionLabel}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {config.options.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setForm({ ...form, categoryOption: opt })}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                              form.categoryOption === opt
                                ? "bg-brand-600 text-white border-brand-600 shadow-xs font-semibold"
                                : "bg-white text-ink border-brand-200 hover:border-brand-300 hover:bg-brand-50/50"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Secondary Category Pill Selector (if any, e.g. Veg/Non-Veg) */}
                  {config.secondaryOptions?.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-2">
                        {config.secondaryOptionLabel}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {config.secondaryOptions.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setForm({ ...form, secondaryOption: opt })}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                              form.secondaryOption === opt
                                ? "bg-brand-600 text-white border-brand-600 shadow-xs font-semibold"
                                : "bg-white text-ink border-brand-200 hover:border-brand-300 hover:bg-brand-50/50"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category-Specific Address / Location */}
                  {config.isHotelProperty ? (
                    /* Hotel Stay: No redundant address requested! Show confirmed property banner */
                    <div className="p-4 bg-brand-50/60 rounded-xl border border-brand-200 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-brand-200 flex items-center justify-center text-lg shrink-0">
                        🏨
                      </div>
                      <div className="text-xs">
                        <div className="font-bold text-ink text-sm">
                          Stay Location: {item.title}
                        </div>
                        <div className="text-muted mt-0.5">
                          📍 {item.city || "Pan India"} • Direct Room Reservation
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1.5">
                        {config.addressLabel}
                      </label>
                      <textarea
                        rows={2}
                        required={config.addressRequired}
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        placeholder={config.addressPlaceholder}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all placeholder:text-muted/60"
                      />
                    </div>
                  )}

                  {/* Secondary Address for Transport (Drop location) */}
                  {config.showSecondaryAddress && (
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1.5">
                        {config.secondaryAddressLabel}
                      </label>
                      <input
                        required
                        value={form.secondaryAddress}
                        onChange={(e) => setForm({ ...form, secondaryAddress: e.target.value })}
                        placeholder={config.secondaryAddressPlaceholder}
                        className="w-full px-3.5 py-2 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all placeholder:text-muted/60"
                      />
                    </div>
                  )}

                  {/* Category Notes */}
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1.5">
                      {config.notesLabel}
                    </label>
                    <textarea
                      rows={2}
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder={config.notesPlaceholder}
                      className="w-full px-3.5 py-2 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all placeholder:text-muted/60"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm sm:text-base bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 shadow-lg shadow-brand-500/25 disabled:opacity-50 transition-all cursor-pointer mt-4"
                >
                  {busy
                    ? "Processing Payment…"
                    : !user
                    ? "Sign In to Pay with Razorpay →"
                    : `Pay ₹${payableAmount.toLocaleString("en-IN")} with Razorpay`}
                </button>
              </form>
            </div>

            {/* Order summary Column */}
            <aside className="lg:col-span-5 bg-brand-50/70 p-6 sm:p-7 rounded-2xl border border-brand-100 space-y-5 lg:sticky lg:top-24 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-brand-100">
                <h3 className="font-serif text-xl font-bold text-ink">Booking Summary</h3>
                <span className="text-xs font-semibold text-brand-700 bg-brand-100/60 px-2 py-0.5 rounded-md">
                  {config.title}
                </span>
              </div>

              {/* Item card */}
              <div className="flex gap-3.5 items-center pb-4 border-b border-brand-100">
                {item.images?.[0] ? (
                  <img
                    src={item.images[0]}
                    alt=""
                    className="w-20 h-20 rounded-xl object-cover border border-brand-200 shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-brand-100/50 flex items-center justify-center text-2xl border border-brand-200 shrink-0">
                    ✨
                  </div>
                )}
                <div className="min-w-0">
                  <h4 className="font-bold text-ink text-sm line-clamp-2 leading-snug">{item.title}</h4>
                  <div className="text-xs text-muted mt-1 flex items-center gap-1.5 flex-wrap">
                    <span>📍 {item.city || "Pan India"}</span>
                    <span>•</span>
                    <span className="text-brand-700 font-medium">{item.category?.name || config.title}</span>
                  </div>
                  {roomName && (
                    <div className="inline-flex items-center gap-1 text-xs text-brand-700 font-bold bg-white px-2 py-0.5 rounded-md border border-brand-200 mt-1.5">
                      <span>🛏️</span> {roomName}
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Category summary pills */}
              <div className="space-y-1.5 text-xs text-muted bg-white/80 p-3.5 rounded-xl border border-brand-100">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-ink">Requested Date:</span>
                  <span className="font-semibold text-brand-700">
                    {form.date ? form.date : "Not selected yet"}
                  </span>
                </div>
                {form.categoryOption && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-ink">{config.optionLabel}:</span>
                    <span className="font-semibold text-ink">{form.categoryOption}</span>
                  </div>
                )}
                {form.secondaryOption && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-ink">{config.secondaryOptionLabel}:</span>
                    <span className="font-semibold text-ink">{form.secondaryOption}</span>
                  </div>
                )}
                {form.time && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-ink">Time:</span>
                    <span className="font-semibold text-ink">{form.time}</span>
                  </div>
                )}
              </div>

              {/* Price details */}
              <div className="space-y-2 text-sm pt-1">
                <div className="flex justify-between text-muted">
                  <span>{roomName ? `Tariff (${roomName})` : "Service Price"}</span>
                  <span className="font-semibold text-ink">
                    ₹{payableAmount.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between text-muted text-xs">
                  <span>GST & Platform Charges</span>
                  <span className="font-semibold text-emerald-600">Included</span>
                </div>
                <div className="flex justify-between text-base font-bold text-ink pt-3 border-t border-brand-200">
                  <span>Total Payable</span>
                  <span className="text-brand-700 text-lg">
                    ₹{payableAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="text-xs text-muted pt-2 border-t border-brand-100 text-center flex items-center justify-center gap-1.5">
                <span>🔒</span>
                <span>256-bit SSL encrypted secure Razorpay payment</span>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
