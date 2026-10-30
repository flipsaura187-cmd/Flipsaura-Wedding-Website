"use client";
import { useState, useEffect } from "react";
import { useRouter } from "@/compat/navigation";
import Image from "@/compat/Image";
import api from "@/api/axios";
import axios from "axios";

export const VENUE_PRIMARY_CATEGORIES = [
  { id: "Banquet Halls", label: "Banquet Halls", icon: "🏛️" },
  { id: "Marriage Garden / Lawns", label: "Marriage Garden / Lawns", icon: "🌿" },
  { id: "Wedding Resorts", label: "Wedding Resorts", icon: "🏰" },
  { id: "Small Function / Party Halls", label: "Party Halls", icon: "🎉" },
];

export const VENUE_SPACE_OPTIONS = [
  { id: "Indoor", label: "Indoor (Banquet Hall)", icon: "🏛️" },
  { id: "Outdoor", label: "Outdoor (Lawn / Garden)", icon: "🌿" },
  { id: "Poolside", label: "Poolside", icon: "🏊" },
  { id: "Terrace", label: "Terrace / Rooftop", icon: "🌇" },
  { id: "Courtyard", label: "Courtyard", icon: "🏕️" },
];

export const VENUE_FEATURE_OPTIONS = [
  "In-House Catering Available",
  "Outside Catering Allowed",
  "Pure Vegetarian Available",
  "In-House Decorators Provided",
  "Outside Decorators Allowed",
  "Central Air Conditioning (AC)",
  "24/7 Power Backup Generator",
  "Valet Parking Available",
  "Bridal Dressing Room Available",
  "DJ & Sound System Allowed",
  "Hawan & Fire Rituals Permitted",
  "Baraat Allowed with Band",
  "Overnight Wedding Allowed",
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
    images: [""],
    price: "",
    city: "",
    contactPhone: "",
    contactEmail: "",
    capacity: "",
    venueType: "Banquet Halls",
    locality: "",
    rentalPrice: "",
    pricePerPlateVeg: "",
    pricePerPlateNonVeg: "",
    roomCount: "",
    spaceTypes: ["Indoor"],
    venueFeatures: [
      "In-House Catering Available",
      "Outside Catering Allowed",
      "Central Air Conditioning (AC)",
      "24/7 Power Backup Generator",
      "Bridal Dressing Room Available",
      "Valet Parking Available",
      "DJ & Sound System Allowed",
      "Hawan & Fire Rituals Permitted",
      "Baraat Allowed with Band",
    ],
    active: true,
    featured: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

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
        images: initialData.images?.length ? initialData.images : [""],
        price: initialData.price || "",
        city: initialData.city || "",
        contactPhone: initialData.contactPhone || "",
        contactEmail: initialData.contactEmail || "",
        capacity: initialData.capacity || initialData.guestCapacity || "",
        venueType: initialData.venueType || "Banquet Halls",
        locality: initialData.locality || "",
        rentalPrice: initialData.rentalPrice || initialData.price || "",
        pricePerPlateVeg: initialData.pricePerPlateVeg || "",
        pricePerPlateNonVeg: initialData.pricePerPlateNonVeg || "",
        roomCount: initialData.roomCount || "",
        spaceTypes: Array.isArray(initialData.spaceTypes) && initialData.spaceTypes.length > 0 ? initialData.spaceTypes : ["Indoor"],
        venueFeatures: Array.isArray(initialData.venueFeatures) && initialData.venueFeatures.length > 0 ? initialData.venueFeatures : [
          "In-House Catering Available",
          "Outside Catering Allowed",
          "Central Air Conditioning (AC)",
          "24/7 Power Backup Generator",
          "Bridal Dressing Room Available",
          "Valet Parking Available",
          "DJ & Sound System Allowed",
        ],
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

  const selectedCat = categories?.find((c) => String(c?._id) === String(form.category));
  const isVenueCat =
    selectedCat?.slug === "venues" ||
    /venue/i.test(selectedCat?.name || "") ||
    form.category === "venues";

  const handleSpaceToggle = (spaceId) => {
    setForm((prev) => {
      const exists = (prev.spaceTypes || []).includes(spaceId);
      const next = exists
        ? prev.spaceTypes.filter((s) => s !== spaceId)
        : [...(prev.spaceTypes || []), spaceId];
      return { ...prev, spaceTypes: next.length > 0 ? next : ["Indoor"] };
    });
  };

  const handleFeatureToggle = (feat) => {
    setForm((prev) => {
      const exists = (prev.venueFeatures || []).includes(feat);
      return {
        ...prev,
        venueFeatures: exists
          ? prev.venueFeatures.filter((f) => f !== feat)
          : [...(prev.venueFeatures || []), feat],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      ...form,
      price: Number(form.price),
      capacity: form.capacity ? Number(form.capacity) : undefined,
      guestCapacity: form.capacity ? Number(form.capacity) : undefined,
      rentalPrice: isVenueCat && form.rentalPrice ? Number(form.rentalPrice) : (isVenueCat ? Number(form.price) : undefined),
      pricePerPlateVeg: isVenueCat && form.pricePerPlateVeg ? Number(form.pricePerPlateVeg) : undefined,
      pricePerPlateNonVeg: isVenueCat && form.pricePerPlateNonVeg ? Number(form.pricePerPlateNonVeg) : undefined,
      roomCount: isVenueCat && form.roomCount ? Number(form.roomCount) : undefined,
      spaceTypes: isVenueCat ? form.spaceTypes : undefined,
      venueFeatures: isVenueCat ? form.venueFeatures : undefined,
      facilities: isVenueCat && Array.isArray(form.venueFeatures)
        ? form.venueFeatures.map((f) => ({ group: "Popular Amenities", name: f, highlight: true }))
        : form.facilities,
      specifications: form.specifications.filter((s) => s.key && s.value),
      images: form.images.filter((url) => url.trim()),
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

      {/* VENUE-SPECIFIC INPUTS (When Category is Venue/Resorts) */}
      {isVenueCat && (
        <div className="bg-brand-50/50 p-5 rounded-2xl border border-brand-100 space-y-5 animate-in fade-in duration-200">
          <div className="border-b border-brand-200/70 pb-2">
            <h3 className="font-serif font-bold text-base text-ink flex items-center gap-2">
              <span>🏛️</span> Venue Category, Pricing & Facilities
            </h3>
            <p className="text-xs text-muted mt-0.5">
              Select primary category (Banquet, Lawn, Resort, Party Hall), plate budget, rental tariff, stay rooms, and facilities.
            </p>
          </div>

          {/* Primary Category Selector */}
          <div>
            <label className={labelClass}>Step 1: Venue Primary Category *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {VENUE_PRIMARY_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, venueType: cat.id }))}
                  className={`p-3 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                    form.venueType === cat.id
                      ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                      : "bg-white text-ink border-brand-200 hover:border-brand-400"
                  }`}
                >
                  <span className="text-xl block mb-1">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Locality & Stay Rooms Count */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Locality / Area / Landmark</label>
              <input
                name="locality"
                value={form.locality || ""}
                onChange={handleChange}
                placeholder="e.g. Bailey Road, Kankarbagh, Old GT Road"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Stay Rooms Count (Room Count)</label>
              <input
                type="number"
                min="0"
                name="roomCount"
                value={form.roomCount || ""}
                onChange={handleChange}
                placeholder="e.g. 10 rooms available for stay"
                className={inputClass}
              />
            </div>
          </div>

          {/* Pricing: Rental & Food Price per Plate */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200">
              <label className="block text-xs font-bold text-amber-950 mb-1">
                Venue Rental Cost (₹ / day)
              </label>
              <input
                type="number"
                min="0"
                name="rentalPrice"
                value={form.rentalPrice || ""}
                onChange={(e) => {
                  handleChange(e);
                  if (!form.price || form.price === form.rentalPrice) {
                    setForm((prev) => ({ ...prev, price: e.target.value }));
                  }
                }}
                placeholder="e.g. 75000"
                className="w-full px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-ink text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-[10px] text-amber-800 mt-1 block">Full venue rental budget</span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <label className="block text-xs font-bold text-emerald-950 mb-1">
                Veg Price per Plate (₹ / plate)
              </label>
              <input
                type="number"
                min="0"
                name="pricePerPlateVeg"
                value={form.pricePerPlateVeg || ""}
                onChange={handleChange}
                placeholder="e.g. 600"
                className="w-full px-3 py-1.5 rounded-lg border border-emerald-300 bg-white text-ink text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-emerald-800 mt-1 block">Veg catering food budget</span>
            </div>

            <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200">
              <label className="block text-xs font-bold text-rose-950 mb-1">
                Non-Veg Price per Plate (₹ / plate)
              </label>
              <input
                type="number"
                min="0"
                name="pricePerPlateNonVeg"
                value={form.pricePerPlateNonVeg || ""}
                onChange={handleChange}
                placeholder="e.g. 850"
                className="w-full px-3 py-1.5 rounded-lg border border-rose-300 bg-white text-ink text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <span className="text-[10px] text-rose-800 mt-1 block">Non-Veg catering food budget</span>
            </div>
          </div>

          {/* Space Types */}
          <div>
            <label className={labelClass}>Spaces Available (Space Types)</label>
            <div className="flex flex-wrap gap-2">
              {VENUE_SPACE_OPTIONS.map((sp) => {
                const isSelected = (form.spaceTypes || []).includes(sp.id);
                return (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => handleSpaceToggle(sp.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-brand-600 text-white border-brand-600 shadow-xs"
                        : "bg-white text-ink border-brand-200 hover:border-brand-400"
                    }`}
                  >
                    <span>{sp.icon}</span>
                    <span>{sp.label}</span>
                    {isSelected && <span>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Features Checklist */}
          <div>
            <label className={labelClass}>Venue Features, Catering & Facilities</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {VENUE_FEATURE_OPTIONS.map((feat) => {
                const isChecked = (form.venueFeatures || []).includes(feat);
                return (
                  <label
                    key={feat}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                      isChecked
                        ? "bg-white border-brand-500 text-brand-900 font-semibold shadow-2xs"
                        : "bg-white/70 border-brand-100 text-ink/80 hover:bg-white"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleFeatureToggle(feat)}
                      className="rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span>{feat}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
