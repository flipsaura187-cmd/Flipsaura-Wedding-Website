"use client";
import { useState, useEffect } from "react";
import api from "@/api/axios";

const POPULAR_ROOM_AMENITIES = [
  { id: "ac", name: "Air Conditioning (AC)", icon: "❄️" },
  { id: "countryside_view", name: "Countryside View", icon: "🌄" },
  { id: "wifi", name: "High-Speed Wi-Fi", icon: "📶" },
  { id: "tv", name: "Flat-screen LED TV", icon: "📺" },
  { id: "hot_water", name: "24x7 Hot & Cold Water", icon: "♨️" },
  { id: "bathroom", name: "Attached Bathroom", icon: "🚿" },
  { id: "mineral_water", name: "Mineral Water Available", icon: "💧" },
  { id: "cancellation", name: "Free Cancellation Till Check-in", icon: "🛡️" },
  { id: "breakfast", name: "Complimentary Breakfast", icon: "☕" },
  { id: "room_service", name: "24x7 Room Service", icon: "🛎️" },
  { id: "geyser", name: "Geyser", icon: "🔥" },
  { id: "kettle", name: "Electric Kettle & Tea Setup", icon: "🫖" },
  { id: "balcony", name: "Balcony / Scenic View", icon: "🪟" },
  { id: "fridge", name: "Mini Refrigerator", icon: "🧊" },
  { id: "work_desk", name: "Work Desk & Chair", icon: "💼" },
  { id: "housekeeping", name: "Daily Housekeeping", icon: "🧹" },
  { id: "toiletries", name: "Complimentary Toiletries & Towels", icon: "🧼" },
  { id: "safe", name: "In-Room Electronic Safe", icon: "🔒" },
];

const ROOM_TYPES = [
  "Deluxe Room",
  "Deluxe AC Room",
  "Super Deluxe Room",
  "Standard Room",
  "Standard AC Room",
  "Standard Non-AC Room",
  "Executive Room",
  "Suite Room",
  "Executive Suite",
  "Family Suite",
  "Resort Cottage",
  "Villa",
  "Honeymoon Suite",
  "Presidential Suite",
];

const BED_TYPES = [
  "1 King Bed",
  "1 Queen Bed",
  "1 Double Bed",
  "2 Twin Beds",
  "2 Double Beds",
  "1 Single Bed",
  "1 King Bed + 1 Single Bed",
  "1 Double Bed or 2 Single Beds",
  "King Bed + Sofa Bed",
  "Custom / Extra Bed Available",
];

export default function AdminRoomFormModal({
  isOpen,
  onClose,
  onSaved,
  initialData = null,
  hotelList = [],
  preselectedHotelId = "",
}) {
  const isEdit = Boolean(initialData?._id);

  const [form, setForm] = useState({
    hotel: "",
    name: "",
    roomType: "Deluxe Room",
    pricePerNight: "",
    availableRooms: 5,
    maxGuests: 2,
    bedType: "1 King Bed",
    numberOfBeds: 1,
    roomSize: "140 sq ft (13 sq m)",
    cancellationPolicy: "Free Cancellation Till Check-in",
    facilities: [
      "Air Conditioning (AC)",
      "Countryside View",
      "High-Speed Wi-Fi",
      "Flat-screen LED TV",
      "24x7 Hot & Cold Water",
      "Attached Bathroom",
      "Mineral Water Available",
      "Free Cancellation Till Check-in",
    ],
    description: "",
    images: [],
    active: true,
  });

  const [customAmenity, setCustomAmenity] = useState("");
  const [directImageUrl, setDirectImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [showBulkUrlBox, setShowBulkUrlBox] = useState(false);
  const [bulkUrlText, setBulkUrlText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    setSuccessMsg("");

    if (initialData) {
      setForm({
        hotel: initialData.hotel?._id || initialData.hotel || preselectedHotelId || "",
        name: initialData.name || "",
        roomType: initialData.roomType || "Deluxe Room",
        pricePerNight: initialData.pricePerNight !== undefined ? initialData.pricePerNight : "",
        availableRooms: initialData.availableRooms !== undefined ? initialData.availableRooms : 5,
        maxGuests: initialData.maxGuests !== undefined ? initialData.maxGuests : 2,
        bedType: initialData.bedType || "1 King Bed",
        numberOfBeds: initialData.numberOfBeds || 1,
        roomSize: initialData.roomSize || "",
        cancellationPolicy: initialData.cancellationPolicy || "Free Cancellation Till Check-in",
        facilities: Array.isArray(initialData.facilities) ? initialData.facilities : [],
        description: initialData.description || "",
        images: Array.isArray(initialData.images) ? initialData.images : [],
        active: initialData.active !== undefined ? initialData.active : true,
      });
    } else {
      const defaultHotel = preselectedHotelId || (hotelList[0]?._id || "");
      setForm({
        hotel: defaultHotel,
        name: "",
        roomType: "Deluxe Room",
        pricePerNight: "",
        availableRooms: 5,
        maxGuests: 2,
        bedType: "1 King Bed",
        numberOfBeds: 1,
        roomSize: "140 sq ft (13 sq m)",
        cancellationPolicy: "Free Cancellation Till Check-in",
        facilities: [
          "Air Conditioning (AC)",
          "Countryside View",
          "High-Speed Wi-Fi",
          "Flat-screen LED TV",
          "24x7 Hot & Cold Water",
          "Attached Bathroom",
          "Mineral Water Available",
          "Free Cancellation Till Check-in",
        ],
        description: "",
        images: [],
        active: true,
      });
    }
  }, [isOpen, initialData, preselectedHotelId, hotelList]);

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

  const removeFacility = (name) => {
    setForm((prev) => ({
      ...prev,
      facilities: prev.facilities.filter((f) => f !== name),
    }));
  };

  const handleMultipleFilesUpload = async (e) => {
    const fileList = Array.from(e.target.files || []);
    if (fileList.length === 0) return;

    // Validate files
    const validFiles = [];
    for (const f of fileList) {
      if (!f.type.startsWith("image/")) {
        setError(`"${f.name}" is not a valid image file.`);
        return;
      }
      if (f.size > 12 * 1024 * 1024) {
        setError(`"${f.name}" exceeds 12MB limit.`);
        return;
      }
      validFiles.push(f);
    }

    setUploadingImage(true);
    setUploadProgress({ current: 0, total: validFiles.length });
    setError("");

    try {
      const uploadedUrls = [];
      for (let i = 0; i < validFiles.length; i++) {
        setUploadProgress({ current: i + 1, total: validFiles.length });
        const file = validFiles[i];
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
          reader.readAsDataURL(file);
        });

        const { data } = await api.post("/api/upload/direct", {
          file: base64Data,
          folder: "flipsaura/rooms",
        });

        if (data?.ok && data?.data?.url) {
          uploadedUrls.push(data.data.url);
        } else {
          console.warn("Failed upload for file:", file.name, data?.error);
        }
      }

      if (uploadedUrls.length > 0) {
        setForm((prev) => ({
          ...prev,
          images: [...prev.images, ...uploadedUrls],
        }));
        setSuccessMsg(`Uploaded ${uploadedUrls.length} photo${uploadedUrls.length > 1 ? "s" : ""}!`);
        setTimeout(() => setSuccessMsg(""), 3500);
      }
    } catch (uploadErr) {
      console.error("Room images batch upload error:", uploadErr);
      setError(uploadErr.response?.data?.error || uploadErr.message || "Failed to upload images");
    } finally {
      setUploadingImage(false);
      setUploadProgress({ current: 0, total: 0 });
      e.target.value = "";
    }
  };

  const addDirectImageUrl = () => {
    const trimmed = directImageUrl.trim();
    if (!trimmed) return;

    // Check if comma or space separated
    const potentialUrls = trimmed
      .split(/[\s,]+/)
      .map((u) => u.trim())
      .filter((u) => u.startsWith("http://") || u.startsWith("https://") || u.startsWith("/"));

    if (potentialUrls.length === 0) {
      setError("Please enter a valid image URL starting with http://, https:// or /");
      return;
    }

    setForm((prev) => ({
      ...prev,
      images: [...prev.images, ...potentialUrls],
    }));
    setDirectImageUrl("");
    setError("");
    setSuccessMsg(`Added ${potentialUrls.length} photo URL${potentialUrls.length > 1 ? "s" : ""}!`);
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  const handleAddBulkUrls = () => {
    if (!bulkUrlText.trim()) return;

    const urls = bulkUrlText
      .split(/[\r\n,]+/)
      .map((u) => u.trim())
      .filter((u) => u.startsWith("http://") || u.startsWith("https://") || u.startsWith("/"));

    if (urls.length === 0) {
      setError("No valid image URLs found. Please enter valid URLs starting with http:// or https://");
      return;
    }

    setForm((prev) => ({
      ...prev,
      images: [...prev.images, ...urls],
    }));
    setBulkUrlText("");
    setShowBulkUrlBox(false);
    setError("");
    setSuccessMsg(`Added ${urls.length} photo URLs to room gallery!`);
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  const makeCoverImage = (index) => {
    if (index === 0) return;
    setForm((prev) => {
      const copy = [...prev.images];
      const [chosen] = copy.splice(index, 1);
      return {
        ...prev,
        images: [chosen, ...copy],
      };
    });
  };

  const moveImage = (index, direction) => {
    setForm((prev) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.images.length) return prev;
      const copy = [...prev.images];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return { ...prev, images: copy };
    });
  };

  const removeImage = (index) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== index),
    }));
  };

  const clearAllImages = () => {
    if (!confirm("Are you sure you want to remove all photos for this room?")) return;
    setForm((prev) => ({ ...prev, images: [] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!form.hotel) {
      setError("Please select the hotel listing this room belongs to.");
      return;
    }
    if (!form.name.trim()) {
      setError("Room display name is required (e.g. Deluxe AC (Countryside View)).");
      return;
    }
    if (form.pricePerNight === "" || Number(form.pricePerNight) < 0) {
      setError("Please enter a valid price per night (₹).");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        hotel: form.hotel,
        name: form.name.trim(),
        roomType: form.roomType.trim(),
        pricePerNight: Number(form.pricePerNight),
        availableRooms: Number(form.availableRooms) || 1,
        maxGuests: Number(form.maxGuests) || 2,
        bedType: form.bedType.trim(),
        numberOfBeds: Number(form.numberOfBeds) || 1,
        roomSize: form.roomSize.trim(),
        cancellationPolicy: form.cancellationPolicy.trim(),
        facilities: form.facilities,
        description: form.description.trim(),
        images: form.images,
        active: form.active,
      };

      let response;
      if (isEdit) {
        response = await api.put(`/api/rooms/${initialData._id}`, payload);
      } else {
        response = await api.post("/api/rooms", payload);
      }

      if (!response.data?.ok) {
        throw new Error(response.data?.error || "Failed to save room");
      }

      const savedRoom = response.data.data.room;
      setSuccessMsg(isEdit ? "Room updated successfully!" : "Room created successfully!");

      setTimeout(() => {
        if (onSaved) onSaved(savedRoom);
        onClose();
      }, 700);
    } catch (err) {
      console.error("Save room error:", err);
      setError(err.response?.data?.error || err.message || "Failed to save room details.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-line flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-line bg-surface/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center text-xl shadow-2xs">
              🛏️
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-wine leading-tight">
                {isEdit ? "Edit Hotel Room" : "Add Hotel Room"}
              </h2>
              <p className="text-xs text-muted">
                {isEdit
                  ? "Update room name, tariff, bed configuration, amenities, and photos."
                  : "Create room type under selected hotel property with transparent nightly tariff."}
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

        {/* Scrollable Form */}
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

          {/* Section 1: Hotel Assignment & Room Identity */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-600" />
              1. Hotel Property & Room Title
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Hotel Selector */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Assign to Hotel Listing <span className="text-rose-500">*</span>
                </label>
                <select
                  name="hotel"
                  value={form.hotel}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-white text-ink text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">-- Choose Hotel Property --</option>
                  {hotelList.map((h) => (
                    <option key={h._id} value={h._id}>
                      {h.title} {h.city ? `(${h.city})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Room Category */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Room Category / Type <span className="text-rose-500">*</span>
                </label>
                <select
                  name="roomType"
                  value={form.roomType}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      roomType: val,
                      name: prev.name ? prev.name : val,
                    }));
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-white text-ink text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                >
                  {ROOM_TYPES.map((rt) => (
                    <option key={rt} value={rt}>
                      {rt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Room Title */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-ink mb-1">
                  Room Display Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Deluxe AC (Countryside View)"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-white text-ink text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                />
                <p className="text-[11px] text-muted mt-1">
                  Shown in large pink title on the customer room card.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Pricing, Capacity, Beds & Size */}
          <div className="space-y-4 pt-2 border-t border-line">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-600" />
              2. Tariff, Capacity, Beds & Room Size
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Price per night */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Price / Night (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    name="pricePerNight"
                    value={form.pricePerNight}
                    onChange={handleChange}
                    placeholder="3649"
                    min="0"
                    required
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-line bg-white text-ink text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Total Available rooms */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Rooms Available <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  name="availableRooms"
                  value={form.availableRooms}
                  onChange={handleChange}
                  min="0"
                  placeholder="5"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-white text-ink text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Max guests */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Max Guests <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  name="maxGuests"
                  value={form.maxGuests}
                  onChange={handleChange}
                  min="1"
                  max="20"
                  placeholder="2"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-white text-ink text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Number of beds */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  No. of Beds
                </label>
                <input
                  type="number"
                  name="numberOfBeds"
                  value={form.numberOfBeds}
                  onChange={handleChange}
                  min="1"
                  max="10"
                  placeholder="1"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-white text-ink text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Bed Type */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-ink mb-1">
                  Bed Configuration
                </label>
                <select
                  name="bedType"
                  value={form.bedType}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-white text-ink text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                >
                  {BED_TYPES.map((bt) => (
                    <option key={bt} value={bt}>
                      {bt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Room Size */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Room Size / Dimensions
                </label>
                <input
                  type="text"
                  name="roomSize"
                  value={form.roomSize}
                  onChange={handleChange}
                  placeholder="e.g. 140 sq ft (13 sq m)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-white text-ink text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Cancellation Policy */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Cancellation Policy
                </label>
                <input
                  type="text"
                  name="cancellationPolicy"
                  value={form.cancellationPolicy}
                  onChange={handleChange}
                  placeholder="e.g. Free Cancellation Till Check-in"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-white text-ink text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Facilities & Amenities (Reference Image Checklist) */}
          <div className="space-y-4 pt-2 border-t border-line">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-600" />
                3. Room Facilities & Perks (Display Pills)
              </h3>
              <span className="text-xs text-brand-700 font-semibold">
                {form.facilities.length} Selected
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {POPULAR_ROOM_AMENITIES.map((am) => {
                const isSelected = form.facilities.includes(am.name);
                return (
                  <button
                    key={am.id}
                    type="button"
                    onClick={() => toggleAmenity(am.name)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-medium transition flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? "bg-pink-50 border-brand-500 text-brand-900 font-bold shadow-2xs"
                        : "bg-white border-line text-ink/80 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-sm shrink-0">{am.icon}</span>
                    <span className="truncate">{am.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom amenity input */}
            <div className="pt-1 flex gap-2">
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
                placeholder="Add custom facility (e.g. In-Room Safe, Jacuzzi)..."
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

            {/* Currently selected amenities chips */}
            {form.facilities.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {form.facilities.map((fac, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-pink-50 text-brand-900 border border-pink-200 text-xs font-medium"
                  >
                    <span>✓ {fac}</span>
                    <button
                      type="button"
                      onClick={() => removeFacility(fac)}
                      className="text-gray-400 hover:text-rose-600 transition ml-0.5 cursor-pointer"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Room Description */}
          <div className="space-y-2 pt-2 border-t border-line">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-600" />
              4. Room Description
            </h3>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="e.g. Deluxe air-conditioned resort room with sweeping countryside views, king bed, fast Wi-Fi, and flat-screen TV."
              className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-white text-ink text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500 leading-relaxed"
            />
          </div>

          {/* Section 5: Room Photos (Multiple Photos) */}
          <div className="space-y-3 pt-2 border-t border-line">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-600" />
                  5. Room Photos & Gallery (Add Multiple Photos)
                </h3>
                <p className="text-[11px] text-muted mt-0.5">
                  Select multiple files at once or paste multiple CDN URLs. First photo is used as primary card cover.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                  {form.images.length} Photo{form.images.length === 1 ? "" : "s"}
                </span>
                {form.images.length > 1 && (
                  <button
                    type="button"
                    onClick={clearAllImages}
                    className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {/* Upload Options Row */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row gap-2.5">
                {/* 1. Multiple Files Device Upload */}
                <label className="flex-1 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleMultipleFilesUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                  <div className="h-11 px-4 rounded-xl border-2 border-dashed border-brand-300 bg-brand-50/50 hover:bg-brand-50 text-brand-700 text-xs font-bold flex items-center justify-center gap-2 transition shadow-2xs">
                    {uploadingImage ? (
                      <>
                        <div className="w-4 h-4 border-2 border-brand-300 border-t-brand-700 rounded-full animate-spin" />
                        <span>
                          Uploading {uploadProgress.current} of {uploadProgress.total} photos...
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-base">📸</span>
                        <span>Upload Multiple Photos from Device</span>
                      </>
                    )}
                  </div>
                </label>

                {/* 2. Direct Single URL */}
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
                    placeholder="Paste image URL (https://...)"
                    className="flex-1 px-3 py-2 rounded-xl border border-line bg-white text-ink text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="button"
                    onClick={addDirectImageUrl}
                    className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-ink text-xs font-semibold transition cursor-pointer shrink-0"
                  >
                    + Add
                  </button>
                </div>

                {/* 3. Bulk URLs Toggle */}
                <button
                  type="button"
                  onClick={() => setShowBulkUrlBox(!showBulkUrlBox)}
                  className={`px-3 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    showBulkUrlBox
                      ? "bg-brand-600 text-white border-brand-600"
                      : "bg-white hover:bg-gray-50 text-ink border-line"
                  }`}
                >
                  <span>📋</span>
                  <span>Bulk URLs</span>
                </button>
              </div>

              {/* Bulk URLs Textarea Modal/Dropdown */}
              {showBulkUrlBox && (
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900">
                      📋 Paste Multiple Image URLs (One URL per line or comma-separated)
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowBulkUrlBox(false)}
                      className="text-xs text-amber-700 hover:text-amber-900"
                    >
                      ✕ Close
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={bulkUrlText}
                    onChange={(e) => setBulkUrlText(e.target.value)}
                    placeholder="https://example.com/room-photo-1.jpg&#10;https://example.com/room-photo-2.jpg&#10;https://example.com/room-bathroom.jpg"
                    className="w-full p-2.5 rounded-xl border border-amber-200 bg-white text-xs font-mono text-ink placeholder:text-muted focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddBulkUrls}
                      className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
                    >
                      Add All URLs to Gallery
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Gallery Thumbnails with Reorder & Cover Selection */}
            {form.images.length > 0 ? (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-[11px] text-muted">
                  <span>💡 Tip: Click <b>&quot;★ Make Cover&quot;</b> to set any photo as the main cover photo.</span>
                  <span>Drag or use &larr; &rarr; to reorder</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {form.images.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className={`relative aspect-[4/3] rounded-2xl overflow-hidden border-2 bg-gray-50 group shadow-2xs transition-all ${
                        idx === 0
                          ? "border-brand-500 ring-2 ring-brand-200"
                          : "border-line hover:border-brand-300"
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Room photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />

                      {/* Cover Badge or Photo Number */}
                      <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                        {idx === 0 ? (
                          <span className="bg-brand-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                            ★ Cover Photo
                          </span>
                        ) : (
                          <span className="bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                            #{idx + 1}
                          </span>
                        )}
                      </div>

                      {/* Delete Button top-right */}
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center text-xs font-bold shadow transition cursor-pointer opacity-90 group-hover:opacity-100"
                        title="Delete photo"
                      >
                        ✕
                      </button>

                      {/* Bottom Controls Bar */}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-1.5 flex items-center justify-between gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-1">
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => moveImage(idx, -1)}
                              className="w-5 h-5 rounded bg-white/20 hover:bg-white/40 text-white flex items-center justify-center text-[10px] font-bold transition cursor-pointer"
                              title="Move left"
                            >
                              ←
                            </button>
                          )}
                          {idx < form.images.length - 1 && (
                            <button
                              type="button"
                              onClick={() => moveImage(idx, 1)}
                              className="w-5 h-5 rounded bg-white/20 hover:bg-white/40 text-white flex items-center justify-center text-[10px] font-bold transition cursor-pointer"
                              title="Move right"
                            >
                              →
                            </button>
                          )}
                        </div>

                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => makeCoverImage(idx)}
                            className="text-[10px] text-white hover:text-amber-300 font-bold bg-white/20 hover:bg-white/30 px-1.5 py-0.5 rounded transition cursor-pointer"
                            title="Set as primary cover"
                          >
                            ★ Cover
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-gray-200 text-center bg-gray-50/50">
                <p className="text-xs text-muted">
                  No photos added yet. Upload from device or paste image URLs to showcase this room.
                </p>
              </div>
            )}
          </div>

          {/* Section 6: Active Status */}
          <div className="pt-2 border-t border-line flex items-center">
            <label className="relative flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="active"
                checked={form.active}
                onChange={handleChange}
                className="w-4 h-4 rounded-md text-brand-600 focus:ring-brand-500 border-gray-300"
              />
              <div>
                <span className="text-xs font-bold text-ink block">
                  Active & Visible on Customer Hotel Page
                </span>
                <span className="text-[11px] text-muted">
                  Uncheck to temporarily take this room offline without deleting it.
                </span>
              </div>
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
                <span>Saving Room...</span>
              </>
            ) : isEdit ? (
              "Save Room Changes →"
            ) : (
              "+ Create Room"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
