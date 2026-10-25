"use client";
import { useState, useEffect } from "react";
import api from "@/api/axios";

const POPULAR_HOTEL_AMENITIES = [
  "Free High-Speed Wi-Fi",
  "Air Conditioning (AC)",
  "24x7 Front Desk",
  "Banquet & Wedding Hall",
  "Power Backup / Generator",
  "Free Dedicated Parking",
  "In-house Restaurant & Dining",
  "24-Hour Room Service",
  "Elevator / Lift",
  "CCTV Surveillance & Security",
  "Swimming Pool",
  "Doctor on Call",
  "Lawn & Garden Area",
  "Conference / Meeting Room",
  "Luggage Storage",
  "Daily Housekeeping",
];

const COMMON_CITIES = [
  "Daudnagar",
  "Aurangabad",
  "Patna",
  "Gaya",
  "Dehri on Sone",
  "Sasaram",
  "Jamshedpur",
  "Ranchi",
  "Bodh Gaya",
  "Muzaffarpur",
  "Bhagalpur",
  "Darbhanga",
  "Varanasi",
  "Kolkata",
  "Delhi NCR",
];

export default function AdminHotelFormModal({
  isOpen,
  onClose,
  onSaved,
  initialData = null,
}) {
  const isEdit = Boolean(initialData?._id);

  const [form, setForm] = useState({
    title: "",
    ownerName: "",
    contactPhone: "",
    contactEmail: "",
    address: "",
    city: "Daudnagar",
    state: "Bihar",
    pincode: "",
    price: "",
    about: "",
    description: "",
    facilities: [
      "Free High-Speed Wi-Fi",
      "Air Conditioning (AC)",
      "24x7 Front Desk",
      "Power Backup / Generator",
      "Daily Housekeeping",
    ],
    images: [],
    sourceUrl: "",
    active: true,
    featured: false,
  });

  const [customAmenity, setCustomAmenity] = useState("");
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
      const extractedFacilities = Array.isArray(initialData.facilities)
        ? initialData.facilities.map((f) => (typeof f === "string" ? f : f.name || ""))
        : [];

      setForm({
        title: initialData.title || "",
        ownerName: initialData.vendor?.vendorProfile?.ownerName || initialData.vendor?.name || "",
        contactPhone: initialData.contactPhone || initialData.vendor?.phone || "",
        contactEmail: initialData.contactEmail || initialData.vendor?.email || "",
        address: initialData.vendor?.vendorProfile?.address || "",
        city: initialData.city || initialData.vendor?.vendorProfile?.city || "Daudnagar",
        state: initialData.state || initialData.vendor?.vendorProfile?.state || "Bihar",
        pincode: initialData.vendor?.vendorProfile?.pincode || "",
        price: initialData.price !== undefined ? initialData.price : "",
        about: initialData.about || "",
        description: initialData.description || "",
        facilities: extractedFacilities.length > 0 ? extractedFacilities : ["Free High-Speed Wi-Fi", "Air Conditioning (AC)"],
        images: Array.isArray(initialData.images) ? initialData.images : [],
        sourceUrl: initialData.sourceUrl || "",
        active: initialData.active !== undefined ? initialData.active : true,
        featured: initialData.featured || false,
      });
    } else {
      setForm({
        title: "",
        ownerName: "",
        contactPhone: "",
        contactEmail: "",
        address: "",
        city: "Daudnagar",
        state: "Bihar",
        pincode: "",
        price: "",
        about: "",
        description: "",
        facilities: [
          "Free High-Speed Wi-Fi",
          "Air Conditioning (AC)",
          "24x7 Front Desk",
          "Power Backup / Generator",
          "Daily Housekeeping",
        ],
        images: [],
        sourceUrl: "",
        active: true,
        featured: false,
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

  const toggleAmenity = (name) => {
    setForm((prev) => {
      const exists = prev.facilities.includes(name);
      return {
        ...prev,
        facilities: exists ? prev.facilities.filter((f) => f !== name) : [...prev.facilities, name],
      };
    });
  };

  const addCustomAmenity = () => {
    const trimmed = customAmenity.trim();
    if (!trimmed) return;
    if (!form.facilities.includes(trimmed)) {
      setForm((prev) => ({
        ...prev,
        facilities: [...prev.facilities, trimmed],
      }));
    }
    setCustomAmenity("");
  };

  const removeAmenity = (name) => {
    setForm((prev) => ({
      ...prev,
      facilities: prev.facilities.filter((f) => f !== name),
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
            folder: "flipsaura/hotels",
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

  const addDirectImageUrl = () => {
    const trimmed = directImageUrl.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://") && !trimmed.startsWith("/")) {
      setError("Please enter a valid image URL (e.g. https://...)");
      return;
    }

    setForm((prev) => ({
      ...prev,
      images: [...prev.images, trimmed],
    }));
    setDirectImageUrl("");
    setError("");
  };

  const removeImage = (index) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!form.title.trim()) {
      setError("Hotel name is required.");
      return;
    }
    if (!form.city.trim()) {
      setError("City/Location is required.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        title: form.title.trim(),
        ownerName: form.ownerName.trim(),
        contactPhone: form.contactPhone.trim(),
        contactEmail: form.contactEmail.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim() || "Bihar",
        pincode: form.pincode.trim(),
        price: form.price !== "" ? Number(form.price) : 0,
        about: form.about.trim(),
        description: form.description.trim(),
        facilities: form.facilities,
        images: form.images,
        sourceUrl: form.sourceUrl.trim(),
        active: form.active,
        featured: form.featured,
      };

      let res;
      if (isEdit) {
        res = await api.put(`/api/admin/hotels/${initialData._id}`, payload);
      } else {
        res = await api.post("/api/admin/hotels", payload);
      }

      if (!res.data?.ok) {
        throw new Error(res.data?.error || "Failed to save hotel");
      }

      const savedHotel = res.data.data.hotel;
      setSuccessMsg(isEdit ? "Hotel updated successfully!" : "Hotel created successfully!");

      setTimeout(() => {
        if (onSaved) onSaved(savedHotel);
        onClose();
      }, 700);
    } catch (err) {
      console.error("Save hotel error:", err);
      setError(err.response?.data?.error || err.message || "Failed to save hotel.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-line flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-line bg-surface/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center text-xl shadow-2xs">
              🏨
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-wine leading-tight">
                {isEdit ? "Edit Hotel Vendor & Property" : "Add New Hotel (Manual Entry)"}
              </h2>
              <p className="text-xs text-muted">
                {isEdit
                  ? "Update property address, vendor contact information, and public listing attributes."
                  : "Quickly enter details collected from public listings (MakeMyTrip, Google, brochures)."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center text-sm font-bold transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-medium flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-medium flex items-center gap-2">
              <span>✅</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Section 1: Property Name & Pricing */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-600" />
              1. Hotel Identity & Rates
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-ink mb-1">
                  Hotel Name / Property Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Hotel Vaishnavi Heights, The Haweli Resorts"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-white text-ink text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Starting Price / Night (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="2500"
                    min="0"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-line bg-white text-ink text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <p className="text-[11px] text-muted mt-1">
                  Base / lowest room rate shown on category cards.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Public Listing Source URL (Optional)
                </label>
                <input
                  type="url"
                  name="sourceUrl"
                  value={form.sourceUrl}
                  onChange={handleChange}
                  placeholder="e.g. MakeMyTrip, Goibibo or Google Maps link"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-white text-ink text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                />
                <p className="text-[11px] text-muted mt-1">
                  Reference source where data was collected from.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Contact Information & Vendor Details */}
          <div className="space-y-4 pt-2 border-t border-line">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-600" />
              2. Vendor & Contact Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Contact Person / Owner Name
                </label>
                <input
                  type="text"
                  name="ownerName"
                  value={form.ownerName}
                  onChange={handleChange}
                  placeholder="Manager / Owner Name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-white text-ink text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={form.contactPhone}
                  onChange={handleChange}
                  placeholder="e.g. +91 9876543210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-white text-ink text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={form.contactEmail}
                  onChange={handleChange}
                  placeholder="hotel@domain.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-white text-ink text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Address & Location */}
          <div className="space-y-4 pt-2 border-t border-line">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-600" />
              3. Location & Address
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold text-ink mb-1">
                  Full Street Address / Landmark
                </label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Near Bus Stand, Main Road, Daudnagar"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-white text-ink text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-ink mb-1">
                  City / District <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  list="city-options"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="e.g. Daudnagar, Aurangabad"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-white text-ink text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                />
                <datalist id="city-options">
                  {COMMON_CITIES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  placeholder="Bihar"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-white text-ink text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Pincode
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={form.pincode}
                  onChange={handleChange}
                  placeholder="824143"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-white text-ink text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Description */}
          <div className="space-y-3 pt-2 border-t border-line">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-600" />
              4. Property Overview & Description
            </h3>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Short Overview / Tagline
              </label>
              <input
                type="text"
                name="about"
                value={form.about}
                onChange={handleChange}
                placeholder="Comfortable air-conditioned hotel with banquet and dining in Daudnagar."
                className="w-full px-3.5 py-2 rounded-xl border border-line bg-white text-ink text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Detailed Description
              </label>
              <textarea
                name="description"
                rows={3}
                value={form.description}
                onChange={handleChange}
                placeholder="Describe property highlights, wedding stay arrangements, room service hours, check-in/out policies..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-white text-ink text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500 leading-relaxed"
              />
            </div>
          </div>

          {/* Section 5: Hotel Facilities / Amenities */}
          <div className="space-y-3 pt-2 border-t border-line">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-600" />
                5. Popular Property Amenities
              </h3>
              <span className="text-xs text-brand-700 font-semibold">
                {form.facilities.length} Selected
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {POPULAR_HOTEL_AMENITIES.map((amenity) => {
                const isSelected = form.facilities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-medium transition flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? "bg-brand-50 border-brand-500 text-brand-900 font-bold shadow-2xs"
                        : "bg-white border-line text-ink/80 hover:bg-gray-50"
                    }`}
                  >
                    <span>{isSelected ? "✓" : "+"}</span>
                    <span className="truncate">{amenity}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={customAmenity}
                onChange={(e) => setCustomAmenity(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomAmenity();
                  }
                }}
                placeholder="Add custom amenity (e.g. Roof-top Lounge, Travel Desk)..."
                className="flex-1 px-3.5 py-2 rounded-xl border border-line bg-white text-ink text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="button"
                onClick={addCustomAmenity}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-ink text-xs font-semibold transition cursor-pointer"
              >
                + Add
              </button>
            </div>

            {form.facilities.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {form.facilities.map((fac, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-50 text-brand-900 border border-brand-200 text-xs font-medium"
                  >
                    <span>✓ {fac}</span>
                    <button
                      type="button"
                      onClick={() => removeAmenity(fac)}
                      className="text-gray-400 hover:text-rose-600 transition ml-0.5 cursor-pointer"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Section 6: Photos & Gallery */}
          <div className="space-y-3 pt-2 border-t border-line">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-600" />
                6. Hotel Photos & Gallery
              </h3>
              <span className="text-xs text-muted">
                {form.images.length} Image{form.images.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <label className="flex-1 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
                <div className="h-11 px-4 rounded-xl border border-dashed border-brand-300 bg-brand-50/50 hover:bg-brand-50 text-brand-700 text-xs font-semibold flex items-center justify-center gap-2 transition shadow-2xs">
                  {uploadingImage ? (
                    <>
                      <div className="w-4 h-4 border-2 border-brand-300 border-t-brand-700 rounded-full animate-spin" />
                      <span>Uploading photo...</span>
                    </>
                  ) : (
                    <>
                      <span>📁</span>
                      <span>Upload Hotel Photo from Device</span>
                    </>
                  )}
                </div>
              </label>

              <div className="flex-1 flex gap-2">
                <input
                  type="url"
                  value={directImageUrl}
                  onChange={(e) => setDirectImageUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addDirectImageUrl();
                    }
                  }}
                  placeholder="Or paste image URL (https://...)"
                  className="flex-1 px-3 py-2 rounded-xl border border-line bg-white text-ink text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="button"
                  onClick={addDirectImageUrl}
                  className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-ink text-xs font-semibold transition cursor-pointer"
                >
                  Add URL
                </button>
              </div>
            </div>

            {form.images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {form.images.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-[4/3] rounded-xl overflow-hidden border border-line bg-gray-50 group shadow-2xs"
                  >
                    <img
                      src={imgUrl}
                      alt={`Hotel photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {idx === 0 && (
                      <span className="absolute top-1.5 left-1.5 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center text-xs font-bold shadow transition cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 7: Status Toggles */}
          <div className="pt-2 border-t border-line flex items-center gap-6">
            <label className="relative flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="active"
                checked={form.active}
                onChange={handleChange}
                className="w-4 h-4 rounded-md text-brand-600 focus:ring-brand-500 border-gray-300"
              />
              <span className="text-xs font-bold text-ink">Active Listing</span>
            </label>

            <label className="relative flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="featured"
                checked={form.featured}
                onChange={handleChange}
                className="w-4 h-4 rounded-md text-brand-600 focus:ring-brand-500 border-gray-300"
              />
              <span className="text-xs font-bold text-ink">Featured Property</span>
            </label>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-line bg-surface/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl border border-line hover:bg-gray-100 text-ink font-semibold text-sm transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || uploadingImage}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-bold text-sm shadow-md shadow-brand-500/20 transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Saving Hotel...</span>
              </>
            ) : isEdit ? (
              "Save Hotel Changes →"
            ) : (
              "+ Create Hotel Property"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
