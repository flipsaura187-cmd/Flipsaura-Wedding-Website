"use client";
import { useState, useEffect } from "react";
import api from "@/api/axios";
import { uploadFile } from "@/lib/uploadHelper";

export const PLANNING_DECOR_GROUPS = [
  {
    key: "themes",
    name: "A. Decor Themes & Concepts",
    icon: "🎨",
    description: "Signature wedding visual themes, color palettes, and stylistic concepts.",
    subcategories: [
      "Royal Palace & Heritage Theme",
      "Floral Fairytale Theme",
      "Traditional Marwari & Bihari Setup",
      "Bohemian & Rustic Chic",
      "Minimalist Modern Pastel Theme",
      "Bollywood Glamour & Sparkle",
      "Eco-Friendly & Organic Botanical Theme",
    ],
  },
  {
    key: "mandap-stage",
    name: "B. Mandap & Stage Styling",
    icon: "🌸",
    description: "Grand wedding mandap architecture, reception stage backdrops, and floral canopies.",
    subcategories: [
      "Traditional Temple Floral Mandap",
      "Modern Geometric / Dome Mandap",
      "Floating Water Mandap Setup",
      "Shahi Glass Stage & Floral Chandeliers",
      "LED Screen & Red Carpet Stage",
      "Hanging Floral Wisteria Canopy",
    ],
  },
  {
    key: "entrance-pathway",
    name: "C. Entrance & Pathway Decor",
    icon: "✨",
    description: "Grand gate arches, illuminated walkways, and guest welcoming areas.",
    subcategories: [
      "Shahi Floral Arch Entrance Gate",
      "Fairy Lights & Crystal Bulb Tunnel",
      "Candle, Diya & Lantern Pathway",
      "Vintage Photobooth & 360 Selfie Booth",
      "Mirror Welcome Board & Calligraphy Easel",
    ],
  },
  {
    key: "pre-wedding",
    name: "D. Pre-Wedding Functions Decor",
    icon: "🎉",
    description: "Themed setups for Haldi, Mehndi, Sangeet, and Cocktail nights.",
    subcategories: [
      "Haldi Yellow Marigold & Urli Tub Setup",
      "Mehndi Bohemian Floor Seating & Canopy",
      "Sangeet Neon Signs & Disco Bar Lounge",
      "Cocktail Terrace & Cabana Setup",
      "Roka & Engagement Floral Backdrop",
    ],
  },
  {
    key: "coordination",
    name: "E. Planning & Coordination Services",
    icon: "📋",
    description: "Professional wedding management, budget planning, and day-of execution.",
    subcategories: [
      "Full Wedding Planning (End-to-End)",
      "Day-of Event Management & Coordination",
      "Vendor Sourcing, Negotiations & Logistics",
      "Guest Hospitality, Welcome Desk & RSVPs",
      "Bride & Groom Styling & Entry Coordination",
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
  "Varanasi",
  "Ranchi",
];

export default function AdminPlanningDecorFormModal({
  isOpen,
  onClose,
  onSaved,
  initialData = null,
  isVendor = false,
}) {
  const isEdit = Boolean(initialData?._id);
  const [activeTab, setActiveTab] = useState("catalogue"); // 'catalogue' | 'basic' | 'photos'

  const [form, setForm] = useState({
    title: "",
    ownerName: "",
    contactPhone: "",
    contactEmail: "",
    address: "",
    locality: "",
    city: "Daudnagar",
    state: "Bihar",
    pincode: "",
    price: "",
    about: "",
    description: "",
    images: [],
    mainCategories: [],
    subcategories: [],
    active: true,
    featured: false,
  });

  const [customSubcategoriesMap, setCustomSubcategoriesMap] = useState({});
  const [customInputs, setCustomInputs] = useState({});
  const [directImageUrl, setDirectImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    setSuccessMsg("");
    setActiveTab("catalogue");

    if (initialData) {
      setForm({
        title: initialData.title || initialData.name || "",
        ownerName: initialData.ownerName || initialData.contactPerson || "",
        contactPhone: initialData.contactPhone || "",
        contactEmail: initialData.contactEmail || "",
        address: initialData.address || "",
        locality: initialData.locality || "",
        city: initialData.city || "Daudnagar",
        state: initialData.state || "Bihar",
        pincode: initialData.pincode || "",
        price: initialData.price !== undefined ? String(initialData.price) : "",
        about: initialData.about || "",
        description: initialData.description || "",
        images: Array.isArray(initialData.images) ? initialData.images : (Array.isArray(initialData.photos) ? initialData.photos : []),
        mainCategories: Array.isArray(initialData.mainCategories) ? initialData.mainCategories : [],
        subcategories: Array.isArray(initialData.subcategories) ? initialData.subcategories : [],
        active: initialData.active !== undefined ? initialData.active : true,
        featured: Boolean(initialData.featured),
      });

      const initialCustomMap =
        initialData.customSubcategoriesMap && typeof initialData.customSubcategoriesMap === "object"
          ? { ...initialData.customSubcategoriesMap }
          : {};

      const allDefaultSubs = new Set(PLANNING_DECOR_GROUPS.flatMap((g) => g.subcategories));
      const unmappedSubs = (initialData.subcategories || []).filter((s) => !allDefaultSubs.has(s));
      if (unmappedSubs.length > 0) {
        unmappedSubs.forEach((unmapped) => {
          let found = false;
          for (const k of Object.keys(initialCustomMap)) {
            if (Array.isArray(initialCustomMap[k]) && initialCustomMap[k].includes(unmapped)) {
              found = true;
              break;
            }
          }
          if (!found) {
            const fallbackGroup = (initialData.mainCategories && initialData.mainCategories[0]) || "A. Decor Themes & Concepts";
            initialCustomMap[fallbackGroup] = [...(initialCustomMap[fallbackGroup] || []), unmapped];
          }
        });
      }
      setCustomSubcategoriesMap(initialCustomMap);
    } else {
      setCustomSubcategoriesMap({});
      setForm({
        title: "",
        ownerName: "",
        contactPhone: "",
        contactEmail: "",
        address: "",
        locality: "",
        city: "Daudnagar",
        state: "Bihar",
        pincode: "",
        price: "45000",
        about: "",
        description: "",
        images: [],
        mainCategories: [
          "A. Decor Themes & Concepts",
          "B. Mandap & Stage Styling",
          "C. Entrance & Pathway Decor",
        ],
        subcategories: [
          "Royal Palace & Heritage Theme",
          "Floral Fairytale Theme",
          "Traditional Temple Floral Mandap",
          "Shahi Glass Stage & Floral Chandeliers",
          "Shahi Floral Arch Entrance Gate",
          "Haldi Yellow Marigold & Urli Tub Setup",
        ],
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

  const toggleSubcategory = (catName, subName) => {
    setForm((prev) => {
      const isSubSelected = prev.subcategories.includes(subName);
      const nextSubcategories = isSubSelected
        ? prev.subcategories.filter((s) => s !== subName)
        : [...prev.subcategories, subName];

      const group = PLANNING_DECOR_GROUPS.find((g) => g.name === catName);
      const customItems = customSubcategoriesMap[catName] || [];
      const allKnownGroupSubs = [...(group?.subcategories || []), ...customItems];
      const anySelectedInGroup = allKnownGroupSubs.some((s) => nextSubcategories.includes(s));

      let nextMainCategories = [...prev.mainCategories];
      if (anySelectedInGroup && !nextMainCategories.includes(catName)) {
        nextMainCategories.push(catName);
      } else if (!anySelectedInGroup && nextMainCategories.includes(catName)) {
        nextMainCategories = nextMainCategories.filter((c) => c !== catName);
      }

      return {
        ...prev,
        subcategories: nextSubcategories,
        mainCategories: nextMainCategories,
      };
    });
  };

  const selectAllInGroup = (catName) => {
    const group = PLANNING_DECOR_GROUPS.find((g) => g.name === catName);
    if (!group) return;
    const customItems = customSubcategoriesMap[catName] || [];
    const allInGroup = [...group.subcategories, ...customItems];

    setForm((prev) => {
      const merged = Array.from(new Set([...prev.subcategories, ...allInGroup]));
      const nextMain = prev.mainCategories.includes(catName)
        ? prev.mainCategories
        : [...prev.mainCategories, catName];
      return {
        ...prev,
        subcategories: merged,
        mainCategories: nextMain,
      };
    });
  };

  const clearAllInGroup = (catName) => {
    const group = PLANNING_DECOR_GROUPS.find((g) => g.name === catName);
    if (!group) return;
    const customItems = customSubcategoriesMap[catName] || [];
    const allInGroup = [...group.subcategories, ...customItems];

    setForm((prev) => {
      const filtered = prev.subcategories.filter((s) => !allInGroup.includes(s));
      const nextMain = prev.mainCategories.filter((c) => c !== catName);
      return {
        ...prev,
        subcategories: filtered,
        mainCategories: nextMain,
      };
    });
  };

  const selectAllCatalogueServices = () => {
    const allSubs = PLANNING_DECOR_GROUPS.flatMap((g) => g.subcategories);
    const allCustomSubs = Object.values(customSubcategoriesMap).flat();
    const allCats = PLANNING_DECOR_GROUPS.map((g) => g.name);
    setForm((prev) => ({
      ...prev,
      subcategories: Array.from(new Set([...prev.subcategories, ...allSubs, ...allCustomSubs])),
      mainCategories: Array.from(new Set([...prev.mainCategories, ...allCats])),
    }));
  };

  const clearAllCatalogueServices = () => {
    setForm((prev) => ({
      ...prev,
      subcategories: [],
      mainCategories: [],
    }));
  };

  const handleAddCustomToGroup = (catName, catKey) => {
    const val = (customInputs[catKey] || "").trim();
    if (!val) return;

    setCustomSubcategoriesMap((prev) => {
      const existing = prev[catName] || [];
      if (existing.includes(val)) return prev;
      return { ...prev, [catName]: [...existing, val] };
    });

    setForm((prev) => {
      const nextSubs = prev.subcategories.includes(val) ? prev.subcategories : [...prev.subcategories, val];
      const nextMain = prev.mainCategories.includes(catName) ? prev.mainCategories : [...prev.mainCategories, catName];
      return {
        ...prev,
        subcategories: nextSubs,
        mainCategories: nextMain,
      };
    });

    setCustomInputs((prev) => ({ ...prev, [catKey]: "" }));
  };

  const handleRemoveCustomFromGroup = (catName, itemName) => {
    setCustomSubcategoriesMap((prev) => {
      const existing = prev[catName] || [];
      return { ...prev, [catName]: existing.filter((item) => item !== itemName) };
    });

    setForm((prev) => ({
      ...prev,
      subcategories: prev.subcategories.filter((s) => s !== itemName),
    }));
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploadingImage(true);
    setUploadProgress(`Uploading 1 of ${files.length}...`);
    setError("");

    try {
      const uploadedUrls = [];
      for (let i = 0; i < files.length; i++) {
        setUploadProgress(`Uploading ${i + 1} of ${files.length}...`);
        const file = files[i];
        const url = await uploadFile(file, "flipsaura/planningdecor");
        if (url) uploadedUrls.push(url);
      }

      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to process images.");
    } finally {
      setUploadingImage(false);
      setUploadProgress("");
      e.target.value = "";
    }
  };

  const handleAddDirectImageUrl = () => {
    const url = directImageUrl.trim();
    if (!url) return;
    setForm((prev) => ({
      ...prev,
      images: prev.images.includes(url) ? prev.images : [...prev.images, url],
    }));
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
      setError("Company or Decorator Name is required.");
      setActiveTab("basic");
      return;
    }
    if (!form.city.trim()) {
      setError("City is required.");
      setActiveTab("basic");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        title: form.title.trim(),
        name: form.title.trim(),
        ownerName: form.ownerName.trim(),
        contactPerson: form.ownerName.trim(),
        contactPhone: form.contactPhone.trim(),
        contactEmail: form.contactEmail.trim(),
        address: form.address.trim(),
        locality: form.locality.trim(),
        city: form.city.trim(),
        state: form.state.trim() || "Bihar",
        pincode: form.pincode.trim(),
        price: Number(form.price) || 0,
        rentalPrice: Number(form.price) || 0,
        about: form.about.trim(),
        description: form.description.trim() || form.about.trim(),
        images: form.images.length > 0 ? form.images : ["https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226356/flipsaura/categories/category_planning-decor.png"],
        mainCategories: form.mainCategories,
        subcategories: form.subcategories,
        customSubcategoriesMap: customSubcategoriesMap,
        active: Boolean(form.active),
        featured: Boolean(form.featured),
      };

      const endpoint = isVendor ? "/api/vendor/planning-decor" : "/api/admin/planning-decor";
      let res;
      if (isEdit) {
        res = await api.put(`${endpoint}/${initialData._id}`, payload);
      } else {
        res = await api.post(endpoint, payload);
      }

      if (res.data?.ok) {
        setSuccessMsg(isEdit ? "Planning & Decor updated successfully!" : "Planning & Decor created successfully!");
        setTimeout(() => {
          if (onSaved) onSaved(res.data.data?.item);
          onClose();
        }, 700);
      } else {
        throw new Error(res.data?.error || "Failed to save listing");
      }
    } catch (err) {
      console.error("Save error:", err);
      setError(err.response?.data?.error || err.message || "Failed to save listing");
    } finally {
      setSubmitting(false);
    }
  };

  const totalSelectedCatalogueCount = form.subcategories.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-ink/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-brand-100 flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start sm:items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4.5 bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 text-white shrink-0 gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl">🎨</span>
              <h2 className="font-serif text-lg sm:text-2xl font-bold tracking-tight truncate">
                {isEdit ? "Edit Planning & Decor Services" : "Add Planning & Decor"}
              </h2>
            </div>
            <p className="text-[11px] sm:text-xs text-rose-100/90 mt-0.5 line-clamp-1">
              Wedding themes, floral mandaps, entrance styling, Haldi/Sangeet decor & full wedding coordination.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer text-sm font-bold shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-line bg-surface/50 px-3 sm:px-6 shrink-0 overflow-x-auto gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("catalogue")}
            className={`py-2.5 sm:py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 sm:gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "catalogue"
                ? "border-rose-600 text-rose-900 bg-rose-50/50"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            <span>🌸</span>
            <span>Concepts & Themes</span>
            <span className="ml-1 text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">
              {totalSelectedCatalogueCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("basic")}
            className={`py-2.5 sm:py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 sm:gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "basic"
                ? "border-rose-600 text-rose-900 bg-rose-50/50"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            <span>📋</span>
            <span>Brand Details & Rates</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("photos")}
            className={`py-2.5 sm:py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 sm:gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "photos"
                ? "border-rose-600 text-rose-900 bg-rose-50/50"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            <span>📷</span>
            <span>Portfolio</span>
            <span className="ml-1 text-[10px] sm:text-[11px] px-1.5 py-0.2 rounded-full bg-gray-100 text-gray-700">
              {form.images.length}
            </span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
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

          {/* TAB 1: CATALOGUE */}
          {activeTab === "catalogue" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-rose-50 via-pink-50 to-rose-50 p-5 rounded-2xl border border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🌸</span>
                    <h3 className="font-serif text-lg font-bold text-rose-950">
                      Wedding Decor Themes & Planning Catalogue
                    </h3>
                  </div>
                  <p className="text-xs text-rose-900/80 mt-1">
                    Select styling themes, mandap types, and coordination capabilities you offer to couples.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {totalSelectedCatalogueCount} Selected
                  </span>
                  <button
                    type="button"
                    onClick={selectAllCatalogueServices}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white transition shadow-2xs cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={clearAllCatalogueServices}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-gray-50 text-gray-700 border border-line transition cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="space-y-5">
                {PLANNING_DECOR_GROUPS.map((group) => {
                  const customItemsForGroup = customSubcategoriesMap[group.name] || [];
                  const allGroupItems = [...group.subcategories, ...customItemsForGroup];
                  const selectedInGroup = form.subcategories.filter((s) => allGroupItems.includes(s));
                  const isAllSelected = selectedInGroup.length === allGroupItems.length && allGroupItems.length > 0;

                  return (
                    <div
                      key={group.key}
                      className="p-5 rounded-2xl bg-white border border-line hover:border-rose-300 transition-all shadow-2xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-line/60">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{group.icon}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-serif text-sm font-bold text-ink">{group.name}</h4>
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                                {selectedInGroup.length} of {allGroupItems.length} selected
                              </span>
                            </div>
                            <p className="text-[11px] text-muted mt-0.5">{group.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          {!isAllSelected && (
                            <button
                              type="button"
                              onClick={() => selectAllInGroup(group.name)}
                              className="text-[11px] font-semibold text-brand-600 hover:text-brand-800 hover:underline cursor-pointer"
                            >
                              + Select All
                            </button>
                          )}
                          {selectedInGroup.length > 0 && (
                            <button
                              type="button"
                              onClick={() => clearAllInGroup(group.name)}
                              className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        {group.subcategories.map((subName) => {
                          const isSelected = form.subcategories.includes(subName);
                          return (
                            <button
                              key={subName}
                              type="button"
                              onClick={() => toggleSubcategory(group.name, subName)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                                isSelected
                                  ? "bg-rose-600 text-white shadow-2xs border border-rose-600 hover:bg-rose-700"
                                  : "bg-surface hover:bg-rose-50 text-ink border border-line hover:border-rose-300"
                              }`}
                            >
                              <span>{isSelected ? "✓" : "+"}</span>
                              <span>{subName}</span>
                            </button>
                          );
                        })}

                        {customItemsForGroup.map((customItem) => {
                          const isSelected = form.subcategories.includes(customItem);
                          return (
                            <div
                              key={customItem}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                                isSelected ? "bg-rose-600 text-white border-rose-600" : "bg-surface text-ink border-line"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => toggleSubcategory(group.name, customItem)}
                                className="cursor-pointer"
                              >
                                <span>{isSelected ? "✓" : "+"} </span>
                                <span>{customItem}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveCustomFromGroup(group.name, customItem)}
                                title="Delete custom item"
                                className="ml-1 text-xs opacity-70 hover:opacity-100 hover:text-rose-200 cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      <div className="pt-2 flex items-center gap-2">
                        <input
                          type="text"
                          value={customInputs[group.key] || ""}
                          onChange={(e) =>
                            setCustomInputs((prev) => ({ ...prev, [group.key]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddCustomToGroup(group.name, group.key);
                            }
                          }}
                          placeholder={`+ Add custom theme/item to ${group.name}...`}
                          className="flex-1 px-3 py-1.5 rounded-xl border border-dashed border-gray-300 text-xs text-ink placeholder:text-muted focus:outline-none focus:border-brand-500 focus:bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddCustomToGroup(group.name, group.key)}
                          className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-rose-100 text-gray-800 text-xs font-semibold transition cursor-pointer shrink-0"
                        >
                          + Add Custom
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 flex justify-between items-center">
                <span className="text-xs text-muted">Proceed to specify brand details and rates.</span>
                <button
                  type="button"
                  onClick={() => setActiveTab("basic")}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer inline-flex items-center gap-1"
                >
                  Next: Company Details & Rates →
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: BASIC DETAILS */}
          {activeTab === "basic" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Company / Decorator Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="e.g. Royal Blooms Wedding Planners & Decorators"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm text-ink focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Lead Planner / Owner Name</label>
                  <input
                    type="text"
                    name="ownerName"
                    value={form.ownerName}
                    onChange={handleChange}
                    placeholder="e.g. Anjali Singhania"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm text-ink focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Contact Phone</label>
                  <input
                    type="text"
                    name="contactPhone"
                    value={form.contactPhone}
                    onChange={handleChange}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm text-ink focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Contact Email</label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={form.contactEmail}
                    onChange={handleChange}
                    placeholder="e.g. decor@flipsaura.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm text-ink focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Starting Package / Decor Rate (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="e.g. 45000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm text-ink focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    City / Base Location <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    list="decor-cities"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="e.g. Daudnagar, Patna, Aurangabad"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm text-ink focus:outline-none focus:border-brand-500"
                    required
                  />
                  <datalist id="decor-cities">
                    {COMMON_CITIES.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Locality / Studio Landmark</label>
                  <input
                    type="text"
                    name="locality"
                    value={form.locality}
                    onChange={handleChange}
                    placeholder="e.g. Boring Road, Main Market"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm text-ink focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-ink mb-1">Office / Studio Address</label>
                  <input
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="e.g. 2nd Floor, Grand Plaza, Daudnagar, Bihar"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm text-ink focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-ink mb-1">About Your Decor & Planning Company</label>
                  <textarea
                    rows={3}
                    name="about"
                    value={form.about}
                    onChange={handleChange}
                    placeholder="Describe your design aesthetics, experience with destination weddings, and custom themes..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm text-ink focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-ink mb-1">Detailed Description & Booking Policies</label>
                  <textarea
                    rows={4}
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Details about advance booking, travel charges for outstation events, customization scope..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm text-ink focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-ink">
                    <input
                      type="checkbox"
                      name="active"
                      checked={form.active}
                      onChange={handleChange}
                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span>Active & Available for Inquiries</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-ink">
                    <input
                      type="checkbox"
                      name="featured"
                      checked={form.featured}
                      onChange={handleChange}
                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span>Featured Decor Agency</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setActiveTab("catalogue")}
                  className="px-4 py-2 rounded-xl border border-line text-xs font-semibold text-ink hover:bg-gray-50 transition cursor-pointer"
                >
                  ← Back to Catalogue
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("photos")}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer inline-flex items-center gap-1"
                >
                  Next: Add Portfolio Photos →
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PHOTOS */}
          {activeTab === "photos" && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-surface border border-line space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
                  Upload Mandap, Stage & Event Decor Photos
                </h4>
                <div className="flex flex-col sm:flex-row gap-3">
                  <label className="flex-1 flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-gray-300 hover:border-brand-500 bg-white transition cursor-pointer">
                    <span className="text-3xl mb-1">📸</span>
                    <span className="text-xs font-semibold text-ink">
                      {uploadingImage ? uploadProgress : "Click to Upload Multiple Photos"}
                    </span>
                    <span className="text-[11px] text-muted mt-0.5">JPG, PNG, WebP up to 10MB each</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="url"
                    value={directImageUrl}
                    onChange={(e) => setDirectImageUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddDirectImageUrl();
                      }
                    }}
                    placeholder="Or paste direct image URL (https://...)"
                    className="flex-1 px-3.5 py-2 rounded-xl border border-line text-xs text-ink focus:outline-none focus:border-brand-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddDirectImageUrl}
                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-rose-100 text-gray-800 text-xs font-semibold transition cursor-pointer shrink-0"
                  >
                    + Add Image URL
                  </button>
                </div>
              </div>

              {form.images.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-semibold text-ink">Added Photos ({form.images.length})</h5>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {form.images.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative group rounded-xl overflow-hidden border border-line aspect-video bg-gray-100"
                      >
                        <img src={img} alt={`Decor ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center text-xs transition cursor-pointer opacity-80 group-hover:opacity-100"
                          title="Remove photo"
                        >
                          ✕
                        </button>
                        {idx === 0 && (
                          <span className="absolute bottom-1.5 left-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-600 text-white shadow-2xs">
                            Cover Image
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setActiveTab("basic")}
                  className="px-4 py-2 rounded-xl border border-line text-xs font-semibold text-ink hover:bg-gray-50 transition cursor-pointer"
                >
                  ← Back to Details
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Saving Listing..." : isEdit ? "Update Planning & Decor" : "Publish Planning & Decor"}
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-t border-line bg-surface/50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-muted text-center sm:text-left">
            <span className="font-semibold text-ink">{totalSelectedCatalogueCount}</span> decor themes & services selected.
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl border border-line text-xs font-semibold text-ink hover:bg-gray-100 transition cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer disabled:opacity-50 text-center"
            >
              {submitting ? "Saving..." : isEdit ? "Save Changes" : "Save & Publish"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

