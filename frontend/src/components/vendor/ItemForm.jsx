"use client";
import { useState, useEffect } from "react";
import { useRouter } from "@/compat/navigation";
import Image from "@/compat/Image";
import api from "@/api/axios";
import axios from "axios";

export const POPULAR_ROOM_FACILITIES = [
  "Air Conditioning (AC)",
  "High-Speed Wi-Fi",
  "Attached Private Bathroom",
  "Geyser / 24x7 Hot Water",
  "Flat-screen / Smart TV",
  "Free Breakfast",
  "Room Service",
  "Electric Kettle / Tea Maker",
  "Balcony / City View",
  "Daily Housekeeping",
  "Mini Bar / Refrigerator",
  "Wardrobe / Closet",
];

export const ROOM_TYPES = [
  "Deluxe Room",
  "Standard Room",
  "Executive Suite",
  "Presidential Suite",
  "Family Suite",
  "AC Room",
  "Non-AC Room",
  "Villa / Cottage",
];

export const BED_TYPES = [
  "1 King Bed",
  "1 Queen Bed",
  "2 Single Beds",
  "2 Double Beds",
  "1 Double Bed",
  "3 Single Beds",
];

export default function ItemForm({ onSaved, initialData = null, categories }) {
  const router = useRouter();
  const isEdit = !!initialData?._id;
  const [form, setForm] = useState({
    title: "",
    slug: "",
    category: "",
    about: "",
    description: "",
    specifications: [{ key: "", value: "" }],
    facilities: [],
    images: [""],
    price: "",
    city: "",
    contactPhone: "",
    contactEmail: "",
    capacity: "",
    active: true,
    featured: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  // Hotel Rooms state for when category is "hotels"
  const [rooms, setRooms] = useState([]);
  const [uploadingRoomIdx, setUploadingRoomIdx] = useState(null);
  const [customAmenityInputs, setCustomAmenityInputs] = useState({});
  const [roomUrlInputs, setRoomUrlInputs] = useState({});

  const selectedCategory = categories?.find(
    (c) => String(c?._id || c?.id) === String(form.category)
  );
  const isHotelCategory = Boolean(
    selectedCategory?.slug === "hotels" ||
    (selectedCategory?.name || "").toLowerCase().includes("hotel")
  );

  // Auto-initialize 1 room when category is Hotels and rooms is empty
  useEffect(() => {
    if (isHotelCategory && rooms.length === 0 && !initialData?._id) {
      setRooms([
        {
          name: form.title ? `${form.title} - Deluxe AC Room` : "Deluxe AC Room",
          roomType: "Deluxe Room",
          pricePerNight: form.price ? Number(form.price) : 2500,
          availableRooms: 5,
          maxGuests: 2,
          bedType: "1 King Bed",
          numberOfBeds: 1,
          facilities: [
            "Air Conditioning (AC)",
            "High-Speed Wi-Fi",
            "Attached Private Bathroom",
            "Geyser / 24x7 Hot Water",
            "Flat-screen / Smart TV",
          ],
          description: "",
          images: form.images?.filter((u) => u && u.trim()) || [],
          active: true,
        },
      ]);
    }
  }, [isHotelCategory, form.title]);

  // Load existing rooms when editing an item
  useEffect(() => {
    if (initialData?._id) {
      const catId = initialData.category?._id || initialData.category;
      const cat = categories?.find((c) => String(c._id) === String(catId));
      if (cat?.slug === "hotels" || (cat?.name || "").toLowerCase().includes("hotel")) {
        api.get(`/api/rooms?hotelId=${initialData._id}`)
          .then((res) => {
            if (res.data?.ok && res.data.data?.rooms?.length > 0) {
              setRooms(res.data.data.rooms);
            }
          })
          .catch(() => {});
      }
    }
  }, [initialData, categories]);

  const addRoom = () => {
    setRooms((prev) => [
      ...prev,
      {
        name: `Room Type ${prev.length + 1}`,
        roomType: "Deluxe Room",
        pricePerNight: form.price ? Number(form.price) : 2500,
        availableRooms: 5,
        maxGuests: 2,
        bedType: "1 King Bed",
        numberOfBeds: 1,
        facilities: [
          "Air Conditioning (AC)",
          "High-Speed Wi-Fi",
          "Attached Private Bathroom",
        ],
        description: "",
        images: [],
        active: true,
      },
    ]);
  };

  const removeRoom = (idx) => {
    setRooms((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateRoom = (idx, field, value) => {
    setRooms((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const toggleRoomFacility = (idx, facName) => {
    setRooms((prev) => {
      const copy = [...prev];
      const curFacilities = copy[idx].facilities || [];
      const exists = curFacilities.includes(facName);
      copy[idx] = {
        ...copy[idx],
        facilities: exists
          ? curFacilities.filter((f) => f !== facName)
          : [...curFacilities, facName],
      };
      return copy;
    });
  };

  const addRoomCustomAmenity = (idx) => {
    const customText = (customAmenityInputs[idx] || "").trim();
    if (!customText) return;
    setRooms((prev) => {
      const copy = [...prev];
      const curFacilities = copy[idx].facilities || [];
      if (!curFacilities.includes(customText)) {
        copy[idx] = {
          ...copy[idx],
          facilities: [...curFacilities, customText],
        };
      }
      return copy;
    });
    setCustomAmenityInputs((prev) => ({ ...prev, [idx]: "" }));
  };

  const handleRoomImageUpload = async (idx, file) => {
    if (!file) return;
    setUploadingRoomIdx(idx);
    try {
      const { data: sigData } = await api.post("/api/upload", {
        folder: "flipsaura/rooms",
      });
      if (!sigData.ok) throw new Error(sigData.error || "Failed to get upload signature");

      const { signature, timestamp, apiKey, cloudName } = sigData.data;

      const cloudForm = new FormData();
      cloudForm.append("file", file);
      cloudForm.append("api_key", apiKey);
      cloudForm.append("timestamp", timestamp);
      cloudForm.append("signature", signature);
      cloudForm.append("folder", "flipsaura/rooms");

      const { data: uploadData } = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        cloudForm
      );
      if (!uploadData.secure_url) throw new Error("Upload failed");

      setRooms((prev) => {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          images: [...(copy[idx].images || []), uploadData.secure_url],
        };
        return copy;
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to upload room image");
    } finally {
      setUploadingRoomIdx(null);
    }
  };

  const addRoomImageUrl = (idx) => {
    const url = (roomUrlInputs[idx] || "").trim();
    if (!url) return;
    setRooms((prev) => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        images: [...(copy[idx].images || []), url],
      };
      return copy;
    });
    setRoomUrlInputs((prev) => ({ ...prev, [idx]: "" }));
  };

  const removeRoomImage = (roomIdx, imgIdx) => {
    setRooms((prev) => {
      const copy = [...prev];
      copy[roomIdx] = {
        ...copy[roomIdx],
        images: (copy[roomIdx].images || []).filter((_, i) => i !== imgIdx),
      };
      return copy;
    });
  };

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title || "",
        slug: initialData.slug || "",
        category: initialData.category?._id || initialData.category || "",
        about: initialData.about || "",
        description: initialData.description || "",
        specifications: initialData.specifications?.length
          ? initialData.specifications
          : [{ key: "", value: "" }],
        facilities: initialData.facilities?.length ? initialData.facilities : [],
        images: initialData.images?.length ? initialData.images : [""],
        price: initialData.price || "",
        city: initialData.city || "",
        contactPhone: initialData.contactPhone || "",
        contactEmail: initialData.contactEmail || "",
        capacity: initialData.capacity || "",
        active: initialData.active !== undefined ? initialData.active : true,
        featured: initialData.featured || false,
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSpecChange = (idx, field, value) => {
    const updated = [...form.specifications];
    updated[idx][field] = value;
    setForm((prev) => ({ ...prev, specifications: updated }));
  };

  const addSpec = () =>
    setForm((prev) => ({ ...prev, specifications: [...prev.specifications, { key: "", value: "" }] }));

  const removeSpec = (idx) =>
    setForm((prev) => ({ ...prev, specifications: prev.specifications.filter((_, i) => i !== idx) }));

  const uploadImage = async (file) => {
    setUploading(true);
    try {
      const { data: sigData } = await api.post("/api/upload", {
        folder: "flipsaura/items",
      });
      if (!sigData.ok) throw new Error(sigData.error || "Failed to get upload signature");

      const { signature, timestamp, apiKey, cloudName } = sigData.data;

      const cloudForm = new FormData();
      cloudForm.append("file", file);
      cloudForm.append("api_key", apiKey);
      cloudForm.append("timestamp", timestamp);
      cloudForm.append("signature", signature);
      cloudForm.append("folder", "flipsaura/items");

      const { data: uploadData } = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        cloudForm
      );
      if (!uploadData.secure_url) throw new Error("Upload failed");

      const newImages = [...form.images];
      const lastIndex = newImages.length - 1;
      if (newImages[lastIndex] === "") {
        newImages[lastIndex] = uploadData.secure_url;
        newImages.push("");
      } else {
        newImages.push(uploadData.secure_url, "");
      }
      setForm((prev) => ({ ...prev, images: newImages.filter((url) => url !== "") }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) uploadImage(file);
    e.target.value = "";
  };

  const handleImageChange = (idx, value) => {
    const updated = [...form.images];
    updated[idx] = value;
    setForm((prev) => ({ ...prev, images: updated }));
  };

  const addImage = () => setForm((prev) => ({ ...prev, images: [...prev.images, ""] }));

  const removeImage = (idx) =>
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      ...form,
      price: Number(form.price),
      capacity: form.capacity ? Number(form.capacity) : undefined,
      specifications: form.specifications.filter((s) => s.key && s.value),
      facilities: (form.facilities || []).filter((f) => f && f.name?.trim()),
      images: form.images.filter((url) => url.trim()),
      rooms: isHotelCategory
        ? rooms.filter((r) => r && r.name && r.name.trim())
        : undefined,
    };

    try {
      const url = isEdit ? `/api/items/${initialData._id}` : "/api/items";
      const method = isEdit ? "PUT" : "POST";
      const { data } =
        method === "PUT" ? await api.put(url, payload) : await api.post(url, payload);
      if (!data.ok) throw new Error(data.error || "Something went wrong");
      if (onSaved) onSaved(data.data.item);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-3.5 py-2.5 rounded-xl border border-brand-200 text-sm text-ink placeholder:text-muted/60 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500";
  const labelClass = "block text-xs font-semibold text-ink/80 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border-b border-brand-100 pb-3">
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink">
          {isEdit ? "Edit Item" : "Create New Item"}
        </h2>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Title *</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Slug (optional)</label>
          <input
            name="slug"
            value={form.slug}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Category *</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            required
            className={inputClass}
          >
            <option value="">Select Category</option>
            {categories?.map((item, index) => (
              <option key={index} value={item?._id}>
                {item?.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Price * (₹)</label>
          <input
            name="price"
            type="number"
            value={form.price}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>City</label>
          <input
            name="city"
            value={form.city}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Contact Phone</label>
          <input
            name="contactPhone"
            value={form.contactPhone}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Contact Email</label>
          <input
            name="contactEmail"
            type="email"
            value={form.contactEmail}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Capacity (guests)</label>
          <input
            name="capacity"
            type="number"
            value={form.capacity}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        <div className="flex items-center gap-6 pt-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-ink">
            <input
              name="active"
              type="checkbox"
              checked={form.active}
              onChange={handleChange}
              className="w-4 h-4 accent-brand-600 rounded cursor-pointer"
            />
            Active
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-ink">
            <input
              name="featured"
              type="checkbox"
              checked={form.featured}
              onChange={handleChange}
              className="w-4 h-4 accent-brand-600 rounded cursor-pointer"
            />
            Featured
          </label>
        </div>
      </div>

      <div>
        <label className={labelClass}>About (short description)</label>
        <textarea
          name="about"
          rows="2"
          value={form.about}
          onChange={handleChange}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Full Description</label>
        <textarea
          name="description"
          rows="4"
          value={form.description}
          onChange={handleChange}
          className={inputClass}
        />
      </div>

      {/* Specifications */}
      <div className="space-y-3">
        <label className={labelClass}>Specifications</label>
        {form.specifications.map((spec, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <input
              placeholder="Key (e.g. Area, Cuisine, AC)"
              value={spec.key}
              onChange={(e) => handleSpecChange(idx, "key", e.target.value)}
              className={inputClass}
            />
            <input
              placeholder="Value (e.g. 5000 sq ft, Vegetarian, Yes)"
              value={spec.value}
              onChange={(e) => handleSpecChange(idx, "value", e.target.value)}
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => removeSpec(idx)}
              className="text-rose-600 hover:text-rose-800 text-lg font-bold px-2"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addSpec}
          className="px-3 py-1.5 rounded-lg border border-brand-200 text-brand-700 hover:bg-brand-50 text-xs font-semibold transition"
        >
          + Add Specification
        </button>
      </div>

      {/* Facilities & Amenities */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className={labelClass}>Amenities & Facilities (Optional Listing Specific)</label>
          <span className="text-[11px] text-muted">
            If left empty, listing inherits category amenities from onboarding.
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(form.facilities || []).map((fac, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-brand-50 border border-brand-200 text-xs font-semibold text-brand-700"
            >
              <span>✓ {fac.name}</span>
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    facilities: prev.facilities.filter((_, i) => i !== idx),
                  }))
                }
                className="text-rose-500 hover:text-rose-700 ml-1 text-xs cursor-pointer"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            id="newItemFacilityInput"
            placeholder="Add specific amenity (e.g. Free Wi-Fi, Valet Parking, Buffet)"
            className={inputClass}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const val = e.currentTarget.value.trim();
                if (val) {
                  setForm((prev) => ({
                    ...prev,
                    facilities: [
                      ...(prev.facilities || []),
                      { name: val, group: "Popular Amenities", highlight: false },
                    ],
                  }));
                  e.currentTarget.value = "";
                }
              }
            }}
          />
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById("newItemFacilityInput");
              if (el && el.value.trim()) {
                setForm((prev) => ({
                  ...prev,
                  facilities: [
                    ...(prev.facilities || []),
                    { name: el.value.trim(), group: "Popular Amenities", highlight: false },
                  ],
                }));
                el.value = "";
              }
            }}
            className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold shrink-0 hover:bg-brand-700 transition cursor-pointer"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Hotel Rooms Section - ONLY when category is Hotels */}
      {isHotelCategory && (
        <div className="space-y-4 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-purple-50/50 via-white to-brand-50/30 border-2 border-purple-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🏨</span>
                <h3 className="font-serif text-lg font-bold text-wine">
                  Hotel Room Types & Tariffs
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800">
                  {rooms.length} {rooms.length === 1 ? "Room Type" : "Room Types"}
                </span>
              </div>
              <p className="text-xs text-muted mt-1">
                Since you selected the <b>Hotels</b> category, define the room types available at your property (e.g. Deluxe, Suite, AC Room) along with prices per night, guest capacity, and amenities.
              </p>
            </div>
            <button
              type="button"
              onClick={addRoom}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition cursor-pointer self-start sm:self-auto"
            >
              <span>+</span>
              <span>Add Another Room</span>
            </button>
          </div>

          {rooms.length === 0 ? (
            <div className="p-6 text-center border-2 border-dashed border-purple-200 rounded-xl bg-white/60">
              <p className="text-sm text-muted mb-3">No rooms added yet for this hotel.</p>
              <button
                type="button"
                onClick={addRoom}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition"
              >
                + Add First Room Type
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {rooms.map((room, rIdx) => (
                <div
                  key={rIdx}
                  className="p-4 sm:p-5 rounded-xl bg-white border border-purple-100 shadow-xs space-y-4"
                >
                  {/* Room Card Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center">
                        {rIdx + 1}
                      </span>
                      <h4 className="text-sm font-bold text-ink">
                        {room.name || `Room Type ${rIdx + 1}`}
                      </h4>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-semibold border border-purple-200">
                        {room.roomType || "Deluxe Room"}
                      </span>
                      <span className="text-xs font-bold text-wine">
                        ₹{room.pricePerNight ? Number(room.pricePerNight).toLocaleString("en-IN") : 0} / night
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs font-medium text-ink cursor-pointer">
                        <input
                          type="checkbox"
                          checked={room.active !== false}
                          onChange={(e) => updateRoom(rIdx, "active", e.target.checked)}
                          className="w-3.5 h-3.5 accent-brand-600 rounded cursor-pointer"
                        />
                        Active
                      </label>
                      {rooms.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRoom(rIdx)}
                          className="text-rose-500 hover:text-rose-700 text-xs font-bold px-2 py-1 rounded-md hover:bg-rose-50 transition cursor-pointer"
                        >
                          ✕ Remove
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Room Fields Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    <div>
                      <label className={labelClass}>Room Name / Title *</label>
                      <input
                        type="text"
                        placeholder="e.g. Deluxe AC Room, Presidential Suite"
                        value={room.name || ""}
                        onChange={(e) => updateRoom(rIdx, "name", e.target.value)}
                        className={inputClass}
                        required
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Room Type</label>
                      <select
                        value={room.roomType || "Deluxe Room"}
                        onChange={(e) => updateRoom(rIdx, "roomType", e.target.value)}
                        className={inputClass}
                      >
                        {ROOM_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>Price Per Night (₹) *</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 2500"
                        value={room.pricePerNight || ""}
                        onChange={(e) => updateRoom(rIdx, "pricePerNight", e.target.value)}
                        className={inputClass}
                        required
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Number of Available Rooms</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 5"
                        value={room.availableRooms || 1}
                        onChange={(e) => updateRoom(rIdx, "availableRooms", e.target.value)}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Max Guests (Capacity)</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 2 adults"
                        value={room.maxGuests || 2}
                        onChange={(e) => updateRoom(rIdx, "maxGuests", e.target.value)}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Bed Configuration</label>
                      <select
                        value={room.bedType || "1 King Bed"}
                        onChange={(e) => updateRoom(rIdx, "bedType", e.target.value)}
                        className={inputClass}
                      >
                        {BED_TYPES.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Room Description */}
                  <div>
                    <label className={labelClass}>Room Description (Optional)</label>
                    <textarea
                      rows="2"
                      placeholder="e.g. Spacious 350 sq ft room with plush king bedding, garden view, premium toiletries, and tea maker."
                      value={room.description || ""}
                      onChange={(e) => updateRoom(rIdx, "description", e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  {/* Room Amenities */}
                  <div className="space-y-2">
                    <label className={labelClass}>Room Facilities & Amenities</label>
                    <div className="flex flex-wrap gap-1.5">
                      {POPULAR_ROOM_FACILITIES.map((fac) => {
                        const isChecked = (room.facilities || []).includes(fac);
                        return (
                          <button
                            key={fac}
                            type="button"
                            onClick={() => toggleRoomFacility(rIdx, fac)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer border ${
                              isChecked
                                ? "bg-purple-600 text-white border-purple-600 shadow-2xs"
                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-purple-50 hover:border-purple-200"
                            }`}
                          >
                            {isChecked ? "✓ " : "+ "}
                            {fac}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Amenities added by vendor */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(room.facilities || [])
                        .filter((f) => !POPULAR_ROOM_FACILITIES.includes(f))
                        .map((customFac, cIdx) => (
                          <span
                            key={cIdx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-50 text-purple-800 border border-purple-200"
                          >
                            <span>✓ {customFac}</span>
                            <button
                              type="button"
                              onClick={() => toggleRoomFacility(rIdx, customFac)}
                              className="text-rose-500 hover:text-rose-700 ml-1 cursor-pointer font-bold"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                    </div>

                    {/* Add Custom Amenity input */}
                    <div className="flex gap-2 max-w-md pt-1">
                      <input
                        placeholder="Add other amenity (e.g. Jacuzzi, Soundproofing)"
                        value={customAmenityInputs[rIdx] || ""}
                        onChange={(e) =>
                          setCustomAmenityInputs((prev) => ({
                            ...prev,
                            [rIdx]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addRoomCustomAmenity(rIdx);
                          }
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-ink focus:outline-none focus:border-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() => addRoomCustomAmenity(rIdx)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-semibold shrink-0 hover:bg-slate-900 transition cursor-pointer"
                      >
                        + Add
                      </button>
                    </div>
                  </div>

                  {/* Room Photos */}
                  <div className="space-y-2 pt-1 border-t border-slate-100">
                    <label className={labelClass}>Room Photos</label>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold hover:bg-purple-100 cursor-pointer transition">
                        <span>📷</span>
                        <span>{uploadingRoomIdx === rIdx ? "Uploading..." : "Upload Room Photo"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingRoomIdx === rIdx}
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) handleRoomImageUpload(rIdx, file);
                            e.target.value = "";
                          }}
                          className="hidden"
                        />
                      </label>

                      <div className="flex gap-2 flex-1 max-w-sm">
                        <input
                          placeholder="Or paste direct Image URL"
                          value={roomUrlInputs[rIdx] || ""}
                          onChange={(e) =>
                            setRoomUrlInputs((prev) => ({
                              ...prev,
                              [rIdx]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addRoomImageUrl(rIdx);
                            }
                          }}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-ink focus:outline-none focus:border-purple-500"
                        />
                        <button
                          type="button"
                          onClick={() => addRoomImageUrl(rIdx)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-semibold shrink-0 hover:bg-slate-900 transition cursor-pointer"
                        >
                          + Add URL
                        </button>
                      </div>
                    </div>

                    {/* Previews */}
                    {room.images && room.images.length > 0 && (
                      <div className="flex flex-wrap gap-2.5 pt-2">
                        {room.images.map((imgUrl, imgIdx) => (
                          <div
                            key={imgIdx}
                            className="relative w-20 h-20 rounded-xl overflow-hidden border border-purple-200 bg-slate-100 group shadow-2xs"
                          >
                            <Image
                              src={imgUrl}
                              alt={`Room Photo ${imgIdx + 1}`}
                              fill
                              className="object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeRoomImage(rIdx, imgIdx)}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center opacity-90 hover:opacity-100 shadow-sm cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Images */}
      <div className="space-y-3">
        <label className={labelClass}>Images</label>
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="text-xs text-muted file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
          />
          {uploading && <span className="text-xs text-brand-600 font-medium">Uploading...</span>}
        </div>

        <div className="space-y-2">
          {form.images.map((url, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-surface p-2 rounded-xl border border-brand-100">
              {url !== "" ? (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-brand-200 flex-shrink-0">
                  <Image src={url} alt="Image" fill className="object-cover" />
                </div>
              ) : (
                <input
                  placeholder="Or paste direct Image URL"
                  value={url}
                  onChange={(e) => handleImageChange(idx, e.target.value)}
                  className={inputClass}
                />
              )}
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="text-rose-600 hover:text-rose-800 text-lg font-bold px-2 ml-auto"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addImage}
          className="px-3 py-1.5 rounded-lg border border-brand-200 text-brand-700 hover:bg-brand-50 text-xs font-semibold transition"
        >
          + Add URL field
        </button>
        <p className="text-[11px] text-muted">
          Tip: You can upload files directly to Cloudinary or paste web image URLs above.
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-brand-100">
        <button
          type="button"
          className="px-5 py-2.5 rounded-xl border border-brand-200 text-ink hover:bg-brand-50 text-sm font-semibold transition"
          onClick={() => onSaved && onSaved(null)}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-7 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-sm transition disabled:opacity-50"
        >
          {loading ? "Saving..." : isEdit ? "Update Item" : "Create Item"}
        </button>
      </div>
    </form>
  );
}
