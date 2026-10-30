"use client";
import { useState, useEffect } from "react";
import api from "@/api/axios";

export const VENUE_PRIMARY_CATEGORIES = [
  {
    id: "Banquet Halls",
    label: "Banquet Halls",
    icon: "🏛️",
    desc: "Grand indoor AC halls for lavish wedding ceremonies, sangeet & receptions.",
  },
  {
    id: "Marriage Garden / Lawns",
    label: "Marriage Garden / Lawns",
    icon: "🌿",
    desc: "Expansive green lawns & open-air grounds for grand outdoor celebrations.",
  },
  {
    id: "Wedding Resorts",
    label: "Wedding Resorts",
    icon: "🏰",
    desc: "Luxury destination resorts with stay rooms, lawns, and banquet halls.",
  },
  {
    id: "Small Function / Party Halls",
    label: "Small Function / Party Halls",
    icon: "🎉",
    desc: "Cosy indoor spaces for Haldi, Mehndi, Roka, birthdays & pre-wedding events.",
  },
];

export const SPACE_OPTIONS = [
  { id: "Indoor", label: "Indoor (Banquet Hall)", icon: "🏛️" },
  { id: "Outdoor", label: "Outdoor (Lawn / Garden)", icon: "🌿" },
  { id: "Poolside", label: "Poolside", icon: "🏊" },
  { id: "Terrace", label: "Terrace / Rooftop", icon: "🌇" },
  { id: "Courtyard", label: "Courtyard / Open Area", icon: "🏕️" },
];

export const FEATURE_CATEGORIES = [
  {
    category: "Catering & Food",
    items: [
      "In-House Catering Available",
      "Outside Catering Allowed",
      "Pure Vegetarian Menu Available",
      "Live Food Counters Permitted",
    ],
  },
  {
    category: "Decoration & Themes",
    items: [
      "In-House Decorators Provided",
      "Outside Decorators Allowed",
      "Stage & Mandap Setup Included",
    ],
  },
  {
    category: "Music & Entertainment",
    items: [
      "DJ & Sound System Allowed",
      "Late Night Music Permitted",
      "Live Orchestra / Band Space",
    ],
  },
  {
    category: "Comfort & Amenities",
    items: [
      "Central Air Conditioning (AC)",
      "24/7 Power Backup Generator",
      "Bridal Dressing Room Available",
      "Complimentary Guest Rooms",
      "Valet Parking Available",
      "Dedicated Parking Lot (100+ Cars)",
      "CCTV & Round-the-Clock Security",
    ],
  },
  {
    category: "Rituals & Policies",
    items: [
      "Hawan & Fire Rituals Permitted",
      "Baraat Allowed with Band",
      "Firecrackers Permitted",
      "Overnight Wedding Allowed",
      "Alcohol License Allowed",
    ],
  },
];

const COMMON_CITIES = [
  "Daudnagar",
  "Aurangabad",
  "Patna",
  "Gaya",
  "Dehri on Sone",
  "Sasaram",
  "Muzaffarpur",
  "Bhagalpur",
  "Darbhanga",
  "Ranchi",
  "Jamshedpur",
  "Varanasi",
  "Kolkata",
  "Delhi NCR",
];

export default function AdminVenueFormModal({
  isOpen,
  onClose,
  onSaved,
  initialData = null,
}) {
  const isEdit = Boolean(initialData?._id);

  const [form, setForm] = useState({
    title: "",
    venueType: "Banquet Halls",
    ownerName: "",
    contactPhone: "",
    contactEmail: "",
    address: "",
    locality: "",
    city: "Daudnagar",
    state: "Bihar",
    pincode: "",
    guestCapacity: "",
    seatingCapacity: "",
    floatingCapacity: "",
    roomCount: "",
    rentalPrice: "",
    pricePerPlateVeg: "",
    pricePerPlateNonVeg: "",
    spaceTypes: ["Indoor"],
    venueFeatures: [
      "In-House Catering Available",
      "Outside Catering Allowed",
      "Central Air Conditioning (AC)",
      "24/7 Power Backup Generator",
      "Bridal Dressing Room Available",
      "Valet Parking Available",
      "Hawan & Fire Rituals Permitted",
      "Baraat Allowed with Band",
    ],
    about: "",
    description: "",
    images: [],
    rating: "0",
    reviewsCount: "0",
    active: true,
    featured: false,
    sourceUrl: "",
  });

  const [customFeature, setCustomFeature] = useState("");
  const [directImageUrl, setDirectImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    setSuccessMsg("");

    if (initialData) {
      setForm({
        title: initialData.title || "",
        venueType: initialData.venueType || "Banquet Halls",
        ownerName: initialData.vendor?.vendorProfile?.ownerName || initialData.vendor?.name || "",
        contactPhone: initialData.contactPhone || initialData.vendor?.phone || "",
        contactEmail: initialData.contactEmail || initialData.vendor?.email || "",
        address: initialData.vendor?.vendorProfile?.address || "",
        locality: initialData.locality || "",
        city: initialData.city || initialData.vendor?.vendorProfile?.city || "Daudnagar",
        state: initialData.state || initialData.vendor?.vendorProfile?.state || "Bihar",
        pincode: initialData.vendor?.vendorProfile?.pincode || "",
        guestCapacity: initialData.guestCapacity || initialData.capacity || "",
        seatingCapacity: initialData.seatingCapacity || "",
        floatingCapacity: initialData.floatingCapacity || "",
        roomCount: initialData.roomCount || "",
        rentalPrice: initialData.rentalPrice || initialData.price || "",
        pricePerPlateVeg: initialData.pricePerPlateVeg || "",
        pricePerPlateNonVeg: initialData.pricePerPlateNonVeg || "",
        spaceTypes: Array.isArray(initialData.spaceTypes) && initialData.spaceTypes.length > 0
          ? initialData.spaceTypes
          : ["Indoor"],
        venueFeatures: Array.isArray(initialData.venueFeatures) && initialData.venueFeatures.length > 0
          ? initialData.venueFeatures
          : [
              "In-House Catering Available",
              "Central Air Conditioning (AC)",
              "24/7 Power Backup Generator",
              "Bridal Dressing Room Available",
            ],
        about: initialData.about || "",
        description: initialData.description || "",
        images: Array.isArray(initialData.images) ? initialData.images : [],
        rating: initialData.rating !== undefined ? String(initialData.rating) : "4.8",
        reviewsCount: initialData.reviewsCount !== undefined ? String(initialData.reviewsCount) : "0",
        active: initialData.active !== undefined ? initialData.active : true,
        featured: Boolean(initialData.featured),
        sourceUrl: initialData.sourceUrl || "",
      });
    } else {
      setForm({
        title: "",
        venueType: "Banquet Halls",
        ownerName: "",
        contactPhone: "",
        contactEmail: "",
        address: "",
        locality: "",
        city: "Daudnagar",
        state: "Bihar",
        pincode: "",
        guestCapacity: "",
        seatingCapacity: "",
        floatingCapacity: "",
        roomCount: "",
        rentalPrice: "",
        pricePerPlateVeg: "",
        pricePerPlateNonVeg: "",
        spaceTypes: ["Indoor"],
        venueFeatures: [
          "In-House Catering Available",
          "Outside Catering Allowed",
          "Central Air Conditioning (AC)",
          "24/7 Power Backup Generator",
          "Bridal Dressing Room Available",
          "Valet Parking Available",
          "Hawan & Fire Rituals Permitted",
          "Baraat Allowed with Band",
        ],
        about: "",
        description: "",
        images: [],
        rating: "0",
        reviewsCount: "0",
        active: true,
        featured: false,
        sourceUrl: "",
      });
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSpaceToggle = (spaceId) => {
    setForm((prev) => {
      const exists = prev.spaceTypes.includes(spaceId);
      const next = exists
        ? prev.spaceTypes.filter((s) => s !== spaceId)
        : [...prev.spaceTypes, spaceId];
      return { ...prev, spaceTypes: next.length > 0 ? next : ["Indoor"] };
    });
  };

  const handleFeatureToggle = (feature) => {
    setForm((prev) => {
      const exists = prev.venueFeatures.includes(feature);
      return {
        ...prev,
        venueFeatures: exists
          ? prev.venueFeatures.filter((f) => f !== feature)
          : [...prev.venueFeatures, feature],
      };
    });
  };

  const addCustomFeature = () => {
    const trimmed = customFeature.trim();
    if (!trimmed) return;
    if (!form.venueFeatures.includes(trimmed)) {
      setForm((prev) => ({
        ...prev,
        venueFeatures: [...prev.venueFeatures, trimmed],
      }));
    }
    setCustomFeature("");
  };

  const removeFeature = (feat) => {
    setForm((prev) => ({
      ...prev,
      venueFeatures: prev.venueFeatures.filter((f) => f !== feat),
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPG, PNG, WebP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image size exceeds 10MB limit.");
      return;
    }

    setUploadingImage(true);
    setError("");

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result;
          const { data } = await api.post("/api/upload/direct", {
            file: base64Data,
            folder: "flipsaura/venues",
          });

          if (!data?.ok || !data?.data?.url) {
            throw new Error(data?.error || "Upload failed");
          }

          setForm((prev) => ({
            ...prev,
            images: [...prev.images, data.data.url],
          }));
        } catch (uploadErr) {
          console.error("Direct upload error:", uploadErr);
          setError(uploadErr.response?.data?.error || uploadErr.message || "Failed to upload image");
        } finally {
          setUploadingImage(false);
          e.target.value = "";
        }
      };
      reader.onerror = () => {
        setError("Could not read image file.");
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(err.message || "Image upload failed");
      setUploadingImage(false);
    }
  };

  const addDirectImage = () => {
    const url = directImageUrl.trim();
    if (!url) return;
    if (!form.images.includes(url)) {
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, url],
      }));
    }
    setDirectImageUrl("");
  };

  const removeImage = (idx) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!form.title.trim()) {
      setError("Venue Name is required.");
      return;
    }
    if (!form.city.trim()) {
      setError("City is required.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        title: form.title.trim(),
        venueType: form.venueType,
        ownerName: form.ownerName.trim(),
        contactPhone: form.contactPhone.trim(),
        contactEmail: form.contactEmail.trim(),
        address: form.address.trim(),
        locality: form.locality.trim(),
        city: form.city.trim(),
        state: form.state.trim() || "Bihar",
        pincode: form.pincode.trim(),
        guestCapacity: Number(form.guestCapacity) || 0,
        seatingCapacity: Number(form.seatingCapacity) || 0,
        floatingCapacity: Number(form.floatingCapacity) || 0,
        roomCount: Number(form.roomCount) || 0,
        rentalPrice: Number(form.rentalPrice) || 0,
        pricePerPlateVeg: Number(form.pricePerPlateVeg) || 0,
        pricePerPlateNonVeg: Number(form.pricePerPlateNonVeg) || 0,
        spaceTypes: form.spaceTypes,
        venueFeatures: form.venueFeatures,
        about: form.about.trim(),
        description: form.description.trim() || form.about.trim(),
        images: form.images.length > 0 ? form.images : ["/images/categories/venues.jpg"],
        rating: isEdit ? (initialData?.rating || 0) : 0,
        reviewsCount: isEdit ? (initialData?.reviewsCount || 0) : 0,
        active: Boolean(form.active),
        featured: Boolean(form.featured),
        sourceUrl: form.sourceUrl.trim(),
      };

      let res;
      if (isEdit) {
        res = await api.put(`/api/admin/venues/${initialData._id}`, payload);
      } else {
        res = await api.post("/api/admin/venues", payload);
      }

      if (res.data?.ok) {
        setSuccessMsg(isEdit ? "Venue updated successfully!" : "Venue created successfully!");
        setTimeout(() => {
          if (onSaved) onSaved(res.data.data?.venue);
          onClose();
        }, 600);
      } else {
        throw new Error(res.data?.error || "Failed to save venue");
      }
    } catch (err) {
      console.error("Save venue error:", err);
      setError(err.response?.data?.error || err.message || "Failed to save venue");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-brand-100 flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 bg-gradient-to-r from-brand-600 to-brand-700 text-white shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏛️</span>
              <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight">
                {isEdit ? "Edit Wedding Venue" : "Add New Wedding Venue"}
              </h2>
            </div>
            <p className="text-xs text-brand-100 mt-0.5">
              Configure venue category, guest capacity, rooms, plate pricing, rental tariffs, and amenities.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-lg transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-semibold flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm font-semibold flex items-center gap-2">
              <span>✓</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* STEP 1: Choose Primary Category */}
          <div className="bg-brand-50/50 p-4 sm:p-5 rounded-2xl border border-brand-100/80">
            <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>Step 1: Choose Primary Venue Category</span>
              <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-muted mb-3">
              Select the venue type requested by customers to filter banquet halls, marriage lawns, resorts, or small party halls.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {VENUE_PRIMARY_CATEGORIES.map((cat) => {
                const isSelected = form.venueType === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, venueType: cat.id }))}
                    className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? "bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-600/20 scale-[1.02]"
                        : "bg-white text-ink border-brand-200 hover:border-brand-400 hover:bg-brand-50/50"
                    }`}
                  >
                    <div>
                      <div className="text-2xl mb-1.5">{cat.icon}</div>
                      <div className={`font-bold text-sm ${isSelected ? "text-white" : "text-ink"}`}>
                        {cat.label}
                      </div>
                      <p className={`text-[11px] mt-1 leading-snug ${isSelected ? "text-brand-100" : "text-muted"}`}>
                        {cat.desc}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="mt-2 text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full inline-block self-start">
                        Selected ✓
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: Basic Venue Information */}
          <div className="space-y-4">
            <h3 className="font-serif font-bold text-base text-ink border-b border-brand-100 pb-2 flex items-center gap-2">
              <span>📍</span> Venue Location & Contact Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Venue Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Royal Palace Banquet & Marriage Lawn"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Locality / Area / Landmark
                </label>
                <input
                  type="text"
                  name="locality"
                  value={form.locality}
                  onChange={handleChange}
                  placeholder="e.g. Near Bus Stand, Old GT Road, Kankarbagh"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  City / District <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    className="w-1/2 px-3 py-2.5 rounded-xl border border-brand-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                    value={COMMON_CITIES.includes(form.city) ? form.city : "Other"}
                    onChange={(e) => {
                      if (e.target.value !== "Other") {
                        setForm((prev) => ({ ...prev, city: e.target.value }));
                      }
                    }}
                  >
                    {COMMON_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="Other">Other (Type below)</option>
                  </select>
                  <input
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="Enter city"
                    required
                    className="w-1/2 px-3 py-2.5 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Full Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="e.g. Station Road, Daudnagar, Aurangabad, Bihar - 824143"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Contact Phone / Mobile
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={form.contactPhone}
                  onChange={handleChange}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Contact Email / Vendor Name
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    name="ownerName"
                    value={form.ownerName}
                    onChange={handleChange}
                    placeholder="Owner / Manager"
                    className="w-full px-3 py-2.5 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                  />
                  <input
                    type="email"
                    name="contactEmail"
                    value={form.contactEmail}
                    onChange={handleChange}
                    placeholder="Email address"
                    className="w-full px-3 py-2.5 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* STEP 3: Capacity, Rooms & Space */}
          <div className="space-y-4 bg-brand-50/30 p-4 sm:p-5 rounded-2xl border border-brand-100">
            <h3 className="font-serif font-bold text-base text-ink border-b border-brand-100 pb-2 flex items-center gap-2">
              <span>👥</span> Guest Capacity, Room Count & Space Type
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Total Guest Capacity
                </label>
                <input
                  type="number"
                  min="0"
                  name="guestCapacity"
                  value={form.guestCapacity}
                  onChange={handleChange}
                  placeholder="e.g. 500"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm"
                />
                <span className="text-[10px] text-muted">Max guests capacity</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Seating Capacity
                </label>
                <input
                  type="number"
                  min="0"
                  name="seatingCapacity"
                  value={form.seatingCapacity}
                  onChange={handleChange}
                  placeholder="e.g. 300"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm"
                />
                <span className="text-[10px] text-muted">Chairs / dining seating</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Floating Capacity
                </label>
                <input
                  type="number"
                  min="0"
                  name="floatingCapacity"
                  value={form.floatingCapacity}
                  onChange={handleChange}
                  placeholder="e.g. 700"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm"
                />
                <span className="text-[10px] text-muted">Floating guests peak</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Guest Stay Rooms Count
                </label>
                <input
                  type="number"
                  min="0"
                  name="roomCount"
                  value={form.roomCount}
                  onChange={handleChange}
                  placeholder="e.g. 10"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm"
                />
                <span className="text-[10px] text-muted">Available rooms for baraat/stay</span>
              </div>
            </div>

            {/* Space Type Selector (Multiple) */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-2">
                Space Types Available (Select all that apply)
              </label>
              <div className="flex flex-wrap gap-2.5">
                {SPACE_OPTIONS.map((sp) => {
                  const active = form.spaceTypes.includes(sp.id);
                  return (
                    <button
                      key={sp.id}
                      type="button"
                      onClick={() => handleSpaceToggle(sp.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                        active
                          ? "bg-brand-600 text-white border-brand-600 shadow-xs"
                          : "bg-white text-ink border-brand-200 hover:border-brand-400"
                      }`}
                    >
                      <span>{sp.icon}</span>
                      <span>{sp.label}</span>
                      {active && <span>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* STEP 4: Pricing (Rental Cost & Price per Plate) */}
          <div className="space-y-4">
            <h3 className="font-serif font-bold text-base text-ink border-b border-brand-100 pb-2 flex items-center gap-2">
              <span>💰</span> Pricing: Rental Cost & Price Per Plate
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200">
                <label className="block text-xs font-bold text-amber-950 mb-1">
                  Venue Rental Cost (₹ / day)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-amber-700">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    name="rentalPrice"
                    value={form.rentalPrice}
                    onChange={handleChange}
                    placeholder="e.g. 75000"
                    className="w-full pl-7 pr-3 py-2 rounded-xl border border-amber-300 bg-white text-ink font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <span className="text-[10px] text-amber-800 mt-1 block">Full venue rental cost</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                <label className="block text-xs font-bold text-emerald-950 mb-1">
                  Veg Price per Plate (₹ / plate)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-700">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="20"
                    name="pricePerPlateVeg"
                    value={form.pricePerPlateVeg}
                    onChange={handleChange}
                    placeholder="e.g. 600"
                    className="w-full pl-7 pr-3 py-2 rounded-xl border border-emerald-300 bg-white text-ink font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <span className="text-[10px] text-emerald-800 mt-1 block">Veg catering food budget</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200">
                <label className="block text-xs font-bold text-rose-950 mb-1">
                  Non-Veg Price per Plate (₹ / plate)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-rose-700">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="20"
                    name="pricePerPlateNonVeg"
                    value={form.pricePerPlateNonVeg}
                    onChange={handleChange}
                    placeholder="e.g. 850"
                    className="w-full pl-7 pr-3 py-2 rounded-xl border border-rose-300 bg-white text-ink font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <span className="text-[10px] text-rose-800 mt-1 block">Non-Veg catering food budget</span>
              </div>
            </div>
          </div>

          {/* STEP 5: Features, Catering & Policies */}
          <div className="space-y-4">
            <h3 className="font-serif font-bold text-base text-ink border-b border-brand-100 pb-2 flex items-center gap-2">
              <span>✨</span> Venue Features, Catering & Facilities
            </h3>

            <div className="space-y-4">
              {FEATURE_CATEGORIES.map((catGroup) => (
                <div key={catGroup.category} className="bg-brand-50/30 p-3.5 rounded-2xl border border-brand-100/70">
                  <h4 className="text-xs font-bold text-brand-900 uppercase tracking-wider mb-2.5">
                    {catGroup.category}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {catGroup.items.map((feat) => {
                      const isChecked = form.venueFeatures.includes(feat);
                      return (
                        <label
                          key={feat}
                          className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                            isChecked
                              ? "bg-white border-brand-500 text-brand-900 shadow-xs font-semibold"
                              : "bg-white/60 border-brand-100 text-ink/80 hover:bg-white"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleFeatureToggle(feat)}
                            className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
                          />
                          <span>{feat}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Add Custom Feature */}
              <div className="flex gap-2 items-center pt-1">
                <input
                  type="text"
                  value={customFeature}
                  onChange={(e) => setCustomFeature(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomFeature();
                    }
                  }}
                  placeholder="Add custom feature / facility..."
                  className="flex-1 px-3.5 py-2 rounded-xl border border-brand-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="button"
                  onClick={addCustomFeature}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  + Add Feature
                </button>
              </div>

              {/* Selected Features Badges */}
              {form.venueFeatures.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {form.venueFeatures.map((f) => (
                    <span
                      key={f}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50 text-brand-800 border border-brand-200 text-xs font-medium"
                    >
                      <span>✓ {f}</span>
                      <button
                        type="button"
                        onClick={() => removeFeature(f)}
                        className="text-brand-400 hover:text-red-600 leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* STEP 6: About & Description */}
          <div className="space-y-3">
            <h3 className="font-serif font-bold text-base text-ink border-b border-brand-100 pb-2 flex items-center gap-2">
              <span>📝</span> Venue Description & Highlights
            </h3>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Short Overview / About Venue
              </label>
              <textarea
                rows={2}
                name="about"
                value={form.about}
                onChange={handleChange}
                placeholder="A luxury marriage resort featuring 500+ guest banquet hall and lush garden lawn..."
                className="w-full px-3.5 py-2 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Detailed Description & Wedding Policies
              </label>
              <textarea
                rows={3}
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe stage decor, catering packages, parking area, mandap setup, and rental terms..."
                className="w-full px-3.5 py-2 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* STEP 7: Photos & Gallery */}
          <div className="space-y-4">
            <h3 className="font-serif font-bold text-base text-ink border-b border-brand-100 pb-2 flex items-center gap-2">
              <span>📸</span> Venue Photos & Gallery
            </h3>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Upload Venue Photos (Cloudinary)
              </label>
              <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed border-brand-200 hover:border-brand-400 bg-brand-50/50 hover:bg-brand-50 text-brand-700 text-xs sm:text-sm font-bold cursor-pointer transition-colors">
                <span>{uploadingImage ? "⏳ Uploading photo..." : "📷 Upload Venue Photo"}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>
            </div>

            {/* Direct Image URL input */}
            <div className="flex gap-2">
              <input
                type="url"
                value={directImageUrl}
                onChange={(e) => setDirectImageUrl(e.target.value)}
                placeholder="Or paste direct image URL (https://...)"
                className="flex-1 px-3.5 py-2 rounded-xl border border-brand-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="button"
                onClick={addDirectImage}
                className="px-4 py-2 rounded-xl bg-brand-100 hover:bg-brand-200 text-brand-800 font-bold text-xs cursor-pointer"
              >
                + Add URL
              </button>
            </div>

            {/* Images Preview Grid */}
            {form.images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-2">
                {form.images.map((img, i) => (
                  <div key={i} className="relative aspect-video rounded-xl overflow-hidden border border-brand-200 group bg-slate-100">
                    <img src={img} alt="Venue" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white text-xs flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity"
                      title="Remove image"
                    >
                      ✕
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 bg-ink/70 text-white text-[9px] px-1.5 py-0.5 rounded font-semibold">
                        Cover
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Visibility and Featured toggles */}
          <div className="flex items-center gap-6 pt-2 border-t border-brand-100">
            <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
              <input
                type="checkbox"
                name="active"
                checked={form.active}
                onChange={handleChange}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />
              <span>Active (Visible on public listing)</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
              <input
                type="checkbox"
                name="featured"
                checked={form.featured}
                onChange={handleChange}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />
              <span>Featured Venue (Badge on cards)</span>
            </label>
          </div>
        </form>

        {/* Footer Buttons */}
        <div className="px-6 py-4 bg-surface border-t border-brand-100 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-brand-200 text-ink hover:bg-brand-50 text-xs font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || uploadingImage}
            className="px-7 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-md shadow-brand-600/20 transition-all cursor-pointer flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Saving Venue...</span>
              </>
            ) : (
              <span>{isEdit ? "Update Venue ✓" : "Save & Publish Venue ✓"}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

