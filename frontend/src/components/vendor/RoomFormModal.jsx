"use client";
import { useState, useEffect } from "react";
import api from "@/api/axios";

const POPULAR_AMENITIES = [
  { id: "ac", name: "Air Conditioning (AC)", icon: "❄️" },
  { id: "wifi", name: "High-Speed Wi-Fi", icon: "📶" },
  { id: "tv", name: "Flat-screen / Smart TV", icon: "📺" },
  { id: "bathroom", name: "Attached Private Bathroom", icon: "🚿" },
  { id: "geyser", name: "Geyser / 24x7 Hot Water", icon: "♨️" },
  { id: "breakfast", name: "Complimentary Breakfast", icon: "☕" },
  { id: "room_service", name: "24x7 Room Service", icon: "🛎️" },
  { id: "housekeeping", name: "Daily Housekeeping", icon: "🧹" },
  { id: "kettle", name: "Electric Kettle & Tea Setup", icon: "🫖" },
  { id: "balcony", name: "Balcony / Scenic View", icon: "🌄" },
  { id: "fridge", name: "Mini Refrigerator", icon: "🧊" },
  { id: "work_desk", name: "Work Desk & Chair", icon: "💼" },
  { id: "toiletries", name: "Free Toiletries & Towels", icon: "🧼" },
  { id: "safe", name: "In-Room Electronic Safe", icon: "🔒" },
  { id: "wardrobe", name: "Wardrobe / Clothes Rack", icon: "👗" },
  { id: "bathtub", name: "Luxury Bathtub / Jacuzzi", icon: "🛁" },
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
  "Villa / Cottage",
  "Dormitory / Shared",
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
  "2 Queen Beds",
  "3 Single Beds",
  "Bunk Beds",
  "Custom / Extra Bed Available",
];

export default function RoomFormModal({
  isOpen,
  onClose,
  onSaved,
  initialData = null,
  hotelItems = [],
}) {
  const isEdit = Boolean(initialData?._id);

  const [form, setForm] = useState({
    hotel: "",
    name: "",
    roomType: "Deluxe Room",
    pricePerNight: "",
    availableRooms: 1,
    maxGuests: 2,
    bedType: "1 King Bed",
    numberOfBeds: 1,
    roomSize: "",
    cancellationPolicy: "Free Cancellation Till Check-in",
    facilities: ["Air Conditioning (AC)", "High-Speed Wi-Fi", "Attached Private Bathroom"],
    description: "",
    images: [],
    active: true,
  });

  const [isCustomRoomType, setIsCustomRoomType] = useState(false);
  const [customRoomTypeInput, setCustomRoomTypeInput] = useState("");
  const [customRoomTypeSelected, setCustomRoomTypeSelected] = useState("");
  const [isCustomBedType, setIsCustomBedType] = useState(false);
  const [customBedTypeInput, setCustomBedTypeInput] = useState("");
  const [customBedsList, setCustomBedsList] = useState([]);

  const [customAmenity, setCustomAmenity] = useState("");
  const [directImageUrl, setDirectImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [showBulkUrlBox, setShowBulkUrlBox] = useState(false);
  const [bulkUrlText, setBulkUrlText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Populate form on edit or open
  useEffect(() => {
    if (!isOpen) return;

    setError("");
    setSuccessMsg("");

    if (initialData) {
      const initRt = initialData.roomType || "Deluxe Room";
      const isCustomRt = Boolean(initRt && !ROOM_TYPES.includes(initRt));
      setIsCustomRoomType(isCustomRt);
      setCustomRoomTypeInput("");
      setCustomRoomTypeSelected(isCustomRt ? initRt : "");

      const initBt = initialData.bedType || "1 King Bed";
      const isCustomBt = Boolean(initBt && !BED_TYPES.includes(initBt));
      setIsCustomBedType(isCustomBt);
      setCustomBedTypeInput("");
      if (isCustomBt && initBt) {
        const splitBeds = initBt.split(" + ").map((s) => s.trim()).filter(Boolean);
        setCustomBedsList(splitBeds.length > 0 ? splitBeds : [initBt]);
      } else {
        setCustomBedsList([]);
      }

      setForm({
        hotel: initialData.hotel?._id || initialData.hotel || "",
        name: initialData.name || "",
        roomType: initRt,
        pricePerNight: initialData.pricePerNight !== undefined ? initialData.pricePerNight : "",
        availableRooms: initialData.availableRooms !== undefined ? initialData.availableRooms : 1,
        maxGuests: initialData.maxGuests !== undefined ? initialData.maxGuests : 2,
        bedType: initBt,
        numberOfBeds: initialData.numberOfBeds || 1,
        roomSize: initialData.roomSize || "",
        cancellationPolicy: initialData.cancellationPolicy || "Free Cancellation Till Check-in",
        facilities: Array.isArray(initialData.facilities) ? initialData.facilities : [],
        description: initialData.description || "",
        images: Array.isArray(initialData.images) ? initialData.images : [],
        active: initialData.active !== undefined ? initialData.active : true,
      });
    } else {
      setIsCustomRoomType(false);
      setCustomRoomTypeInput("");
      setCustomRoomTypeSelected("");
      setIsCustomBedType(false);
      setCustomBedTypeInput("");
      setCustomBedsList([]);

      // Auto-select hotel if only 1 exists
      const defaultHotelId = hotelItems.length === 1 ? hotelItems[0]._id : (hotelItems[0]?._id || "");
      setForm({
        hotel: defaultHotelId,
        name: "",
        roomType: "Deluxe Room",
        pricePerNight: "",
        availableRooms: 1,
        maxGuests: 2,
        bedType: "1 King Bed",
        numberOfBeds: 1,
        roomSize: "",
        cancellationPolicy: "Free Cancellation Till Check-in",
        facilities: ["Air Conditioning (AC)", "High-Speed Wi-Fi", "Attached Private Bathroom"],
        description: "",
        images: [],
        active: true,
      });
    }
  }, [isOpen, initialData, hotelItems]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const toggleAmenity = (amenityName) => {
    setForm((prev) => {
      const exists = prev.facilities.includes(amenityName);
      return {
        ...prev,
        facilities: exists
          ? prev.facilities.filter((f) => f !== amenityName)
          : [...prev.facilities, amenityName],
      };
    });
  };

  const handleAddCustomRoomType = () => {
    const val = customRoomTypeInput.trim();
    if (!val) return;
    setCustomRoomTypeSelected(val);
    setForm((prev) => ({
      ...prev,
      roomType: val,
      name: !prev.name || prev.name === prev.roomType ? val : prev.name,
    }));
    setCustomRoomTypeInput("");
  };

  const handleRemoveCustomRoomType = () => {
    setCustomRoomTypeSelected("");
    setForm((prev) => ({
      ...prev,
      roomType: "",
    }));
  };

  const handleAddCustomBed = () => {
    const val = customBedTypeInput.trim();
    if (!val) return;
    if (!customBedsList.includes(val)) {
      const updated = [...customBedsList, val];
      setCustomBedsList(updated);
      setForm((prev) => ({ ...prev, bedType: updated.join(" + ") }));
    }
    setCustomBedTypeInput("");
  };

  const handleRemoveCustomBed = (indexToRemove) => {
    const updated = customBedsList.filter((_, idx) => idx !== indexToRemove);
    setCustomBedsList(updated);
    setForm((prev) => ({
      ...prev,
      bedType: updated.length > 0 ? updated.join(" + ") : "",
    }));
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

  const removeFacility = (amenityName) => {
    setForm((prev) => ({
      ...prev,
      facilities: prev.facilities.filter((f) => f !== amenityName),
    }));
  };

  // Image Upload handler for multiple files via backend directUpload
  const handleMultipleFilesUpload = async (e) => {
    const fileList = Array.from(e.target.files || []);
    if (fileList.length === 0) return;

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
          console.warn("Upload failed for file:", file.name, data?.error);
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
      console.error("Direct upload error:", uploadErr);
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

  const removeImage = (indexToRemove) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove),
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

    // Validation
    if (!form.hotel) {
      setError("Please select the hotel listing this room belongs to.");
      return;
    }
    if (!form.name.trim()) {
      setError("Room name / title is required (e.g. Deluxe Room, Suite).");
      return;
    }
    if (form.pricePerNight === "" || Number(form.pricePerNight) < 0) {
      setError("Please enter a valid price per night (₹).");
      return;
    }
    if (Number(form.availableRooms) < 0) {
      setError("Available rooms count cannot be negative.");
      return;
    }
    if (Number(form.maxGuests) < 1) {
      setError("Maximum guests allowed must be at least 1.");
      return;
    }

    const finalRoomType = (isCustomRoomType ? (customRoomTypeSelected.trim() || customRoomTypeInput.trim()) : form.roomType.trim()) || "Deluxe Room";

    const allCustomBeds = [
      ...customBedsList,
      ...(customBedTypeInput.trim() && !customBedsList.includes(customBedTypeInput.trim()) ? [customBedTypeInput.trim()] : []),
    ];
    const finalBedType = (isCustomBedType ? (allCustomBeds.length > 0 ? allCustomBeds.join(" + ") : "") : form.bedType.trim()) || "1 King Bed";

    if (isCustomRoomType && !finalRoomType) {
      setError("Please write and add your custom room category name.");
      return;
    }
    if (isCustomBedType && !finalBedType) {
      setError("Please write and add your custom bed configuration.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        hotel: form.hotel,
        name: form.name.trim(),
        roomType: finalRoomType,
        pricePerNight: Number(form.pricePerNight),
        availableRooms: Number(form.availableRooms),
        maxGuests: Number(form.maxGuests),
        bedType: finalBedType,
        numberOfBeds: Number(form.numberOfBeds),
        roomSize: form.roomSize.trim(),
        cancellationPolicy: form.cancellationPolicy.trim(),
        facilities: form.facilities,
        description: form.description.trim(),
        images: form.images,
        active: form.active,
      };

      let response;
      try {
        if (isEdit) {
          response = await api.put(`/api/rooms/${initialData._id}`, payload);
        } else {
          response = await api.post("/api/rooms", payload);
        }
      } catch (reqErr) {
        if (reqErr.response?.status === 404) {
          if (isEdit) {
            response = await api.put(`/api/vendor/rooms/${initialData._id}`, payload);
          } else {
            response = await api.post("/api/vendor/rooms", payload);
          }
        } else {
          throw reqErr;
        }
      }

      if (!response.data?.ok) {
        throw new Error(response.data?.error || "Failed to save room");
      }

      const savedRoom = response.data.data.room;
      setSuccessMsg(isEdit ? "Room updated successfully!" : "Room added successfully!");

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
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-line bg-surface/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center text-xl shadow-2xs">
              🛏️
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-wine leading-tight">
                {isEdit ? "Edit Hotel Room" : "Add New Hotel Room"}
              </h2>
              <p className="text-xs text-muted">
                {isEdit
                  ? "Update room tariff, availability, and guest amenities."
                  : "Create a room type (Deluxe, Suite, AC) for your hotel guests."}
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Error & Success Messages */}
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

          {/* Section 1: Hotel Selection & Basic Room Identity */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-600" />
              1. Hotel & Room Identity
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
                  <option value="">-- Select Your Hotel --</option>
                  {hotelItems.map((h) => (
                    <option key={h._id} value={h._id}>
                      {h.title} {h.city ? `(${h.city})` : ""}
                    </option>
                  ))}
                </select>
                {hotelItems.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    ⚠️ No hotel items found. Please ensure you have a listed hotel under My Services.
                  </p>
                )}
              </div>

              {/* Room Type Preset & Custom */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-ink">
                    Room Category / Type <span className="text-rose-500">*</span>
                  </label>
                  {!isCustomRoomType ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomRoomType(true);
                        if (!customRoomTypeSelected && form.roomType && !ROOM_TYPES.includes(form.roomType)) {
                          setCustomRoomTypeSelected(form.roomType);
                        }
                      }}
                      className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 underline cursor-pointer"
                    >
                      + Custom Category
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomRoomType(false);
                        const fallbackType = ROOM_TYPES.includes(form.roomType) ? form.roomType : ROOM_TYPES[0];
                        setForm((prev) => ({
                          ...prev,
                          roomType: fallbackType,
                          name: !prev.name || prev.name === customRoomTypeSelected ? fallbackType : prev.name,
                        }));
                      }}
                      className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 underline cursor-pointer"
                    >
                      ← Choose from Presets
                    </button>
                  )}
                </div>

                {!isCustomRoomType ? (
                  <select
                    name="roomType"
                    value={form.roomType}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "__custom__") {
                        setIsCustomRoomType(true);
                        const initialCustom = customRoomTypeInput || "";
                        setForm((prev) => ({
                          ...prev,
                          roomType: initialCustom,
                          name: !prev.name || prev.name === prev.roomType ? initialCustom : prev.name,
                        }));
                      } else {
                        setForm((prev) => ({
                          ...prev,
                          roomType: val,
                          name: !prev.name || prev.name === prev.roomType ? val : prev.name,
                        }));
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-white text-ink text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  >
                    <optgroup label="Popular Room Categories">
                      {ROOM_TYPES.map((rt) => (
                        <option key={rt} value={rt}>
                          {rt}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Personalized / Custom">
                      <option value="__custom__">✨ + Add Custom Room Category / Type...</option>
                    </optgroup>
                  </select>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customRoomTypeInput}
                        onChange={(e) => setCustomRoomTypeInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCustomRoomType();
                          }
                        }}
                        placeholder="Write custom room category (e.g. Royal Suite)..."
                        autoFocus
                        className="flex-1 px-3.5 py-2.5 rounded-xl border-2 border-brand-500 bg-white text-ink text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-brand-500 placeholder:font-normal placeholder:text-muted/60"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomRoomType}
                        className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1 shrink-0 active:scale-95"
                      >
                        + Add
                      </button>
                    </div>

                    {customRoomTypeSelected ? (
                      <div className="space-y-1.5 mt-1.5">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-50 border-2 border-brand-300 text-brand-900 font-bold text-xs shadow-xs">
                            <span>👑 {customRoomTypeSelected}</span>
                            <button
                              type="button"
                              onClick={handleRemoveCustomRoomType}
                              className="w-5 h-5 rounded-full bg-rose-100 hover:bg-rose-600 hover:text-white text-rose-700 flex items-center justify-center font-black text-xs cursor-pointer transition ml-1"
                              title="Remove room category"
                            >
                              ✕
                            </button>
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-700 font-medium">
                          ✓ Category added! Click <strong>✕</strong> to remove.
                        </p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted">
                        Type room category above and click <strong>+ Add</strong>.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Room Name / Title */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-ink mb-1">
                  Room Display Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Deluxe Room with Balcony, King Executive Suite"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-white text-ink text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                />
                <p className="text-[11px] text-muted mt-1">
                  The exact room title displayed on your hotel's customer page.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Pricing, Availability & Capacity */}
          <div className="space-y-4 pt-2 border-t border-line">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-600" />
              2. Tariff, Capacity & Beds
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
                    placeholder="2500"
                    min="0"
                    step="1"
                    required
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-line bg-white text-ink text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Rooms available */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Total Rooms <span className="text-rose-500">*</span>
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
                  Max Guests Allowed <span className="text-rose-500">*</span>
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-ink">
                    Bed Configuration
                  </label>
                  {!isCustomBedType ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomBedType(true);
                        if (customBedsList.length === 0 && form.bedType && !BED_TYPES.includes(form.bedType)) {
                          const splitBeds = form.bedType.split(" + ").map((s) => s.trim()).filter(Boolean);
                          setCustomBedsList(splitBeds.length > 0 ? splitBeds : [form.bedType]);
                        }
                      }}
                      className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 underline cursor-pointer"
                    >
                      + Custom Bed Config
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomBedType(false);
                        const fallbackBed = BED_TYPES.includes(form.bedType) ? form.bedType : BED_TYPES[0];
                        setForm((prev) => ({ ...prev, bedType: fallbackBed }));
                      }}
                      className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 underline cursor-pointer"
                    >
                      ← Choose from Presets
                    </button>
                  )}
                </div>

                {!isCustomBedType ? (
                  <select
                    name="bedType"
                    value={form.bedType}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "__custom__") {
                        setIsCustomBedType(true);
                        const initialCustom = customBedTypeInput || "";
                        setForm((prev) => ({ ...prev, bedType: initialCustom }));
                      } else {
                        setForm((prev) => ({ ...prev, bedType: val }));
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-white text-ink text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  >
                    <optgroup label="Standard Bed Types">
                      {BED_TYPES.map((bt) => (
                        <option key={bt} value={bt}>
                          {bt}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Personalized / Custom">
                      <option value="__custom__">✨ + Add Custom Bed Configuration...</option>
                    </optgroup>
                  </select>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customBedTypeInput}
                        onChange={(e) => setCustomBedTypeInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCustomBed();
                          }
                        }}
                        placeholder="Write custom bed (e.g. Single Bed, Double Bed)..."
                        autoFocus
                        className="flex-1 px-3.5 py-2.5 rounded-xl border-2 border-brand-500 bg-white text-ink text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-brand-500 placeholder:font-normal placeholder:text-muted/60"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomBed}
                        className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1 shrink-0 active:scale-95"
                      >
                        + Add
                      </button>
                    </div>

                    {customBedsList.length > 0 ? (
                      <div className="space-y-1.5 mt-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          {customBedsList.map((bed, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-50 border-2 border-brand-300 text-brand-900 font-bold text-xs shadow-xs animate-in fade-in"
                            >
                              <span>🛏️ {bed}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveCustomBed(idx)}
                                className="w-5 h-5 rounded-full bg-rose-100 hover:bg-rose-600 hover:text-white text-rose-700 flex items-center justify-center font-black text-xs cursor-pointer transition ml-1"
                                title="Remove this bed"
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                        <p className="text-[11px] text-emerald-700 font-medium">
                          ✓ Bed added! Click <strong>✕</strong> on any tag to remove it, or type another to add more.
                        </p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted">
                        Type bed configuration above and click <strong>+ Add</strong>.
                      </p>
                    )}
                  </div>
                )}
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
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {[
                    "Free Cancellation Till Check-in",
                    "Free Cancellation (Up to 24 hrs)",
                    "Non-Refundable (Best Rate)",
                    "50% Refund Till 48 hrs",
                  ].map((policy) => (
                    <button
                      key={policy}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, cancellationPolicy: policy }))}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition cursor-pointer ${
                        form.cancellationPolicy === policy
                          ? "bg-brand-100 border-brand-400 text-brand-800 font-bold"
                          : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {policy}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Toggle */}
              <div className="sm:col-span-2 flex items-center pt-2">
                <label className="relative flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="active"
                    checked={form.active}
                    onChange={handleChange}
                    className="w-5 h-5 rounded-md text-brand-600 focus:ring-brand-500 border-gray-300"
                  />
                  <div>
                    <span className="text-xs font-bold text-ink block">
                      Active & Visible to Customers
                    </span>
                    <span className="text-[11px] text-muted">
                      Uncheck to temporarily hide this room from public booking.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Section 3: Facilities & Amenities */}
          <div className="space-y-4 pt-2 border-t border-line">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-600" />
                3. Room Facilities & Amenities
              </h3>
              <span className="text-xs text-brand-700 font-semibold">
                {form.facilities.length} Selected
              </span>
            </div>

            {/* Quick Toggle Checkbox Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {POPULAR_AMENITIES.map((am) => {
                const isSelected = form.facilities.includes(am.name);
                return (
                  <button
                    key={am.id}
                    type="button"
                    onClick={() => toggleAmenity(am.name)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-medium transition flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? "bg-brand-50/80 border-brand-500 text-brand-900 font-bold shadow-2xs"
                        : "bg-white border-line text-ink/80 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-sm shrink-0">{am.icon}</span>
                    <span className="truncate">{am.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Amenity input */}
            <div className="pt-2 flex gap-2">
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
                placeholder="Add custom facility (e.g. In-room Espresso Machine, Jacuzzi)..."
                className="flex-1 px-3.5 py-2 rounded-xl border border-line bg-white text-ink text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="button"
                onClick={addCustomAmenity}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-ink text-xs font-semibold transition"
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
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-50 text-brand-900 border border-brand-200 text-xs font-medium"
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
              placeholder="Describe the room ambiance, layout, view, floor space, or special perks for wedding guests..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-white text-ink text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500 leading-relaxed"
            />
          </div>

          {/* Section 5: Room Images Upload (Multiple Photos) */}
          <div className="space-y-4 pt-2 border-t border-line">
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

            {/* Upload & Direct URL Controls */}
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
                    className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-ink text-xs font-semibold transition shrink-0 cursor-pointer"
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

              {/* Bulk URLs Textarea */}
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

            {/* Image Preview Grid with Reorder & Cover Selection */}
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

                      {/* Remove Button top-right */}
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center text-xs font-bold shadow transition cursor-pointer opacity-90 group-hover:opacity-100"
                        title="Remove image"
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
        </form>

        {/* Footer Buttons */}
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
