"use client";
import { useState, useRef } from "react";
import api from "@/api/axios";

const PRICING_MODELS = [
  { value: "per_event", label: "Per Event" },
  { value: "per_day", label: "Per Day" },
  { value: "per_hour", label: "Per Hour" },
  { value: "per_unit", label: "Per Unit / Piece" },
  { value: "custom_quotation", label: "Custom Quotation (Contact for Price)" },
];

export default function HomeSetupServiceForm({
  isOpen,
  onClose,
  onSaved,
  mainCategory,
  subcategory,
  initialData = null,
}) {
  const isEdit = Boolean(initialData);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: initialData?.name || "",
    shortDescription: initialData?.shortDescription || "",
    description: initialData?.description || "",
    pricingModel: initialData?.pricingModel || "per_event",
    startingPrice: initialData?.startingPrice || "",
    additionalCharges: initialData?.additionalCharges || "",
    minimumBookingQty: initialData?.minimumBookingQty || "",
    isAvailable: initialData?.isAvailable !== false,
    customizationAvailable: initialData?.customizationAvailable || false,
    setupCharge: initialData?.setupCharge || "",
    dismantlingCharge: initialData?.dismantlingCharge || "",
    transportationCharge: initialData?.transportationCharge || "",
    additionalNotes: initialData?.additionalNotes || "",
    status: initialData?.status || "draft",
  });

  const [images, setImages] = useState(initialData?.images || []);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleChange = (field, value) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingImages(true);
    setError("");
    try {
      const uploaded = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await api.post("/api/upload", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (res.data?.ok && res.data.data?.url) {
          uploaded.push(res.data.data.url);
        }
      }
      setImages((prev) => [...prev, ...uploaded]);
    } catch (err) {
      setError(err.response?.data?.error || "Image upload failed.");
    } finally {
      setUploadingImages(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (idx) =>
    setImages((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (statusOverride) => {
    if (!form.name.trim()) {
      setError("Service/package name is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        mainCategory,
        subcategory,
        images,
        startingPrice: Number(form.startingPrice) || 0,
        minimumBookingQty: form.minimumBookingQty ? Number(form.minimumBookingQty) : undefined,
        setupCharge: form.setupCharge ? Number(form.setupCharge) : undefined,
        dismantlingCharge: form.dismantlingCharge ? Number(form.dismantlingCharge) : undefined,
        transportationCharge: form.transportationCharge ? Number(form.transportationCharge) : undefined,
        status: statusOverride || form.status,
      };

      if (isEdit) {
        await api.put(`/api/vendor/home-setup-v2/services/${initialData._id}`, payload);
      } else {
        await api.post("/api/vendor/home-setup-v2/services", payload);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save service.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border border-amber-200 my-4 max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 rounded-t-3xl flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-serif text-lg font-bold text-amber-900">
                {isEdit ? "Edit Service" : "Add New Service"}
              </h2>
              <p className="text-xs text-amber-700 mt-0.5">
                <span className="font-semibold">{mainCategory}</span>
                {subcategory && subcategory !== mainCategory && (
                  <span> → {subcategory}</span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-amber-600 hover:text-rose-600 font-bold text-xl leading-none flex-shrink-0 cursor-pointer"
            >
              ×
            </button>
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Basic Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Basic Info</h3>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Service / Package Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder={`e.g. Premium ${subcategory || mainCategory} Package`}
                className="w-full px-3 py-2.5 rounded-xl border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Short Description</label>
              <input
                type="text"
                value={form.shortDescription}
                onChange={(e) => handleChange("shortDescription", e.target.value)}
                placeholder="One-line summary shown in search results"
                className="w-full px-3 py-2.5 rounded-xl border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Full Description</label>
              <textarea
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Detailed description: what's included, setup time, special features..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pricing</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Pricing Model</label>
                <select
                  value={form.pricingModel}
                  onChange={(e) => handleChange("pricingModel", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  {PRICING_MODELS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              {form.pricingModel !== "custom_quotation" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Starting Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.startingPrice}
                    onChange={(e) => handleChange("startingPrice", e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full px-3 py-2.5 rounded-xl border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Setup Charge (₹) <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.setupCharge}
                  onChange={(e) => handleChange("setupCharge", e.target.value)}
                  placeholder="e.g. 1000"
                  className="w-full px-3 py-2.5 rounded-xl border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Transport Charge (₹) <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.transportationCharge}
                  onChange={(e) => handleChange("transportationCharge", e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full px-3 py-2.5 rounded-xl border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Additional Charges Note <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={form.additionalCharges}
                onChange={(e) => handleChange("additionalCharges", e.target.value)}
                placeholder="e.g. Dismantling charge extra, Electricity not included"
                className="w-full px-3 py-2.5 rounded-xl border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Photos */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Photos</h3>

            {/* Image grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {images.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={url}
                      alt={`Photo ${idx + 1}`}
                      className="w-full aspect-square object-cover rounded-xl border border-amber-100"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-rose-600"
                    >
                      ×
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-full">
                        Cover
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <label className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/50 cursor-pointer hover:bg-amber-50 transition-colors">
              <span className="text-2xl">{uploadingImages ? "⏳" : "📷"}</span>
              <span className="text-sm font-semibold text-amber-800">
                {uploadingImages ? "Uploading..." : "Click to upload photos"}
              </span>
              <span className="text-xs text-amber-600">
                JPG, PNG up to 10MB each. First photo = cover image.
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
                disabled={uploadingImages}
              />
            </label>
          </div>

          {/* Availability & Options */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Availability & Options</h3>

            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isAvailable}
                  onChange={(e) => handleChange("isAvailable", e.target.checked)}
                  className="w-4 h-4 rounded accent-amber-500"
                />
                <span className="text-sm font-medium text-gray-700">Currently Available</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.customizationAvailable}
                  onChange={(e) => handleChange("customizationAvailable", e.target.checked)}
                  className="w-4 h-4 rounded accent-amber-500"
                />
                <span className="text-sm font-medium text-gray-700">Customization Available</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Additional Notes <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={form.additionalNotes}
                onChange={(e) => handleChange("additionalNotes", e.target.value)}
                placeholder="Terms, conditions, what to expect, booking process..."
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-amber-100 flex items-center justify-between gap-3 bg-gray-50/50 rounded-b-3xl flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleSubmit("draft")}
              disabled={saving || uploadingImages}
              className="px-4 py-2 rounded-xl border border-amber-300 bg-white hover:bg-amber-50 text-amber-800 text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Saving..." : "Save Draft"}
            </button>
            <button
              type="button"
              onClick={() => handleSubmit("published")}
              disabled={saving || uploadingImages}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Publishing..." : isEdit ? "Update & Publish ✓" : "Publish ✓"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

