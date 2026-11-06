"use client";
import { useState, useEffect } from "react";
import api from "@/api/axios";
import { uploadFile } from "@/lib/uploadHelper";
import { CATALOGUE_GROUPS } from "@/constants/catalogue";

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

export default function AdminHomeSetupFormModal({
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
    rentalPrice: "",
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
  const [categoryPhotosMap, setCategoryPhotosMap] = useState({});
  const [activePhotoCategory, setActivePhotoCategory] = useState("general");
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
        rentalPrice: initialData.rentalPrice !== undefined ? String(initialData.rentalPrice) : (initialData.price ? String(initialData.price) : ""),
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

      // Detect any unmapped subcategories
      const allDefaultSubs = new Set(CATALOGUE_GROUPS.flatMap((g) => g.subcategories));
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
            const fallbackGroup = (initialData.mainCategories && initialData.mainCategories[0]) || "Tent & Pandal";
            initialCustomMap[fallbackGroup] = [...(initialCustomMap[fallbackGroup] || []), unmapped];
          }
        });
      }
      setCustomSubcategoriesMap(initialCustomMap);

      const initialCatPhotosMap = {};
      CATALOGUE_GROUPS.forEach((g) => {
        initialCatPhotosMap[g.name] = [];
      });
      if (initialData.categoryPhotosMap && typeof initialData.categoryPhotosMap === "object") {
        for (const [k, v] of Object.entries(initialData.categoryPhotosMap)) {
          if (Array.isArray(v)) initialCatPhotosMap[k] = [...v];
        }
      } else if (Array.isArray(initialData.categoryPhotos)) {
        initialData.categoryPhotos.forEach((cp) => {
          if (cp?.categoryName && Array.isArray(cp.images)) {
            initialCatPhotosMap[cp.categoryName] = [...cp.images];
          }
        });
      }
      setCategoryPhotosMap(initialCatPhotosMap);
      setActivePhotoCategory("general");
    } else {
      setCustomSubcategoriesMap({});
      const defaultCatPhotosMap = {};
      CATALOGUE_GROUPS.forEach((g) => {
        defaultCatPhotosMap[g.name] = [];
      });
      setCategoryPhotosMap(defaultCatPhotosMap);
      setActivePhotoCategory("general");
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
        price: "25000",
        rentalPrice: "25000",
        about: "",
        description: "",
        images: [],
        mainCategories: [
          "Tent & Pandal",
          "Furniture & Seating",
          "Stage & Decoration",
          "DJ & Sound System",
          "Lighting & Special Effects",
          "Power & Generator",
        ],
        subcategories: [
          "Waterproof Tent",
          "Wedding Pandal",
          "Plastic & Banquet Chairs",
          "VIP Sofa",
          "Wedding Stage",
          "Mandap Decoration",
          "Professional DJ",
          "Line Array Sound System",
          "LED Par Lights",
          "Generator (5 KVA / 10 KVA / 25 KVA / 62.5 KVA)",
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

  // Catalogue toggle helpers
  const toggleSubcategory = (catName, subName) => {
    setForm((prev) => {
      const isSubSelected = prev.subcategories.includes(subName);
      const nextSubcategories = isSubSelected
        ? prev.subcategories.filter((s) => s !== subName)
        : [...prev.subcategories, subName];

      const group = CATALOGUE_GROUPS.find((g) => g.name === catName);
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
    const group = CATALOGUE_GROUPS.find((g) => g.name === catName);
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
    const group = CATALOGUE_GROUPS.find((g) => g.name === catName);
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
    const allSubs = CATALOGUE_GROUPS.flatMap((g) => g.subcategories);
    const allCustomSubs = Object.values(customSubcategoriesMap).flat();
    const allCats = CATALOGUE_GROUPS.map((g) => g.name);
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

  // Custom Item Handlers
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

  // Image upload & category photo handlers
  const allCategoryPhotosFlat = Object.values(categoryPhotosMap).flat();
  const allUniquePhotos = Array.from(new Set([...form.images, ...allCategoryPhotosFlat])).filter(Boolean);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const invalid = files.find((f) => !f.type.startsWith("image/"));
    if (invalid) {
      setError("Please select valid image files (JPG, PNG, WebP).");
      return;
    }

    setUploadingImage(true);
    const catLabel = activePhotoCategory === "general" ? "Main Listing Cover" : activePhotoCategory;
    setUploadProgress(`Uploading 1 of ${files.length} for ${catLabel}...`);
    setError("");

    try {
      const uploadedUrls = [];
      for (let i = 0; i < files.length; i++) {
        setUploadProgress(`Uploading ${i + 1} of ${files.length} for ${catLabel}...`);
        const file = files[i];
        const url = await uploadFile(file, "flipsaura/homesetup");
        if (url) uploadedUrls.push(url);
      }

      if (activePhotoCategory === "general") {
        setForm((prev) => ({
          ...prev,
          images: [...prev.images, ...uploadedUrls],
        }));
      } else {
        setCategoryPhotosMap((prev) => {
          const current = prev[activePhotoCategory] || [];
          return {
            ...prev,
            [activePhotoCategory]: Array.from(new Set([...current, ...uploadedUrls])),
          };
        });
        setForm((prev) => ({
          ...prev,
          images: Array.from(new Set([...prev.images, ...uploadedUrls])),
        }));
      }
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

    if (activePhotoCategory === "general") {
      setForm((prev) => ({
        ...prev,
        images: prev.images.includes(url) ? prev.images : [...prev.images, url],
      }));
    } else {
      setCategoryPhotosMap((prev) => {
        const current = prev[activePhotoCategory] || [];
        if (current.includes(url)) return prev;
        return {
          ...prev,
          [activePhotoCategory]: [...current, url],
        };
      });
      setForm((prev) => ({
        ...prev,
        images: prev.images.includes(url) ? prev.images : [...prev.images, url],
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

  const removeCategoryPhoto = (catName, targetUrl) => {
    setCategoryPhotosMap((prev) => {
      const current = prev[catName] || [];
      return {
        ...prev,
        [catName]: current.filter((u) => u !== targetUrl),
      };
    });
  };

  const setAsCoverPhoto = (targetUrl) => {
    setForm((prev) => {
      const remaining = prev.images.filter((u) => u !== targetUrl);
      return {
        ...prev,
        images: [targetUrl, ...remaining],
      };
    });
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!form.title.trim()) {
      setError("Business or Setup Title is required.");
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
      const allCatPhotos = [];
      const allCatImagesFlat = [];
      for (const [catName, imgs] of Object.entries(categoryPhotosMap)) {
        if (Array.isArray(imgs) && imgs.length > 0) {
          const grp = CATALOGUE_GROUPS.find((g) => g.name === catName);
          allCatPhotos.push({
            categoryName: catName,
            icon: grp?.icon || "🎪",
            images: imgs,
          });
          allCatImagesFlat.push(...imgs);
        }
      }

      const combinedImages = Array.from(new Set([...form.images, ...allCatImagesFlat])).filter(Boolean);

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
        price: Number(form.rentalPrice || form.price) || 0,
        rentalPrice: Number(form.rentalPrice || form.price) || 0,
        about: form.about.trim(),
        description: form.description.trim() || form.about.trim(),
        images: combinedImages.length > 0 ? combinedImages : ["https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226355/flipsaura/categories/category_home_setup.png"],
        categoryPhotosMap,
        categoryPhotos: allCatPhotos,
        mainCategories: form.mainCategories,
        subcategories: form.subcategories,
        customSubcategoriesMap: customSubcategoriesMap,
        active: Boolean(form.active),
        featured: Boolean(form.featured),
      };

      const endpoint = isVendor ? "/api/vendor/home-setup" : "/api/admin/home-setup";
      let res;
      if (isEdit) {
        res = await api.put(`${endpoint}/${initialData._id}`, payload);
      } else {
        res = await api.post(endpoint, payload);
      }

      if (res.data?.ok) {
        setSuccessMsg(isEdit ? "Home Setup updated successfully!" : "Home Setup created successfully!");
        setTimeout(() => {
          if (onSaved) onSaved(res.data.data?.item);
          onClose();
        }, 700);
      } else {
        throw new Error(res.data?.error || "Failed to save Home Setup listing");
      }
    } catch (err) {
      console.error("Save home setup error:", err);
      setError(err.response?.data?.error || err.message || "Failed to save home setup listing");
    } finally {
      setSubmitting(false);
    }
  };

  const totalSelectedCatalogueCount = form.subcategories.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-ink/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-brand-100 flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start sm:items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4.5 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white shrink-0 gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl">🎪</span>
              <h2 className="font-serif text-lg sm:text-2xl font-bold tracking-tight truncate">
                {isEdit ? "Edit Home Setup & Event Services" : "Add Home Setup (Ghar Setup)"}
              </h2>
            </div>
            <p className="text-[11px] sm:text-xs text-amber-100/90 mt-0.5 line-clamp-1">
              Complete home wedding setup: Tents, Pandals, Furniture, Mandap, DJ, Lighting, Generators & Facilities.
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
                ? "border-amber-600 text-amber-900 bg-amber-50/50"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            <span>🎪</span>
            <span>Catalogue & Equipment</span>
            <span className="ml-1 text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
              {totalSelectedCatalogueCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("basic")}
            className={`py-2.5 sm:py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 sm:gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "basic"
                ? "border-amber-600 text-amber-900 bg-amber-50/50"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            <span>📋</span>
            <span>Details & Rates</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("photos")}
            className={`py-2.5 sm:py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 sm:gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "photos"
                ? "border-amber-600 text-amber-900 bg-amber-50/50"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            <span>📷</span>
            <span>Category Photos</span>
            <span className="ml-1 text-[10px] sm:text-[11px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold">
              {allUniquePhotos.length}
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

          {/* TAB 1: CATALOGUE & EQUIPMENT SETUP */}
          {activeTab === "catalogue" && (
            <div className="space-y-6">
              {/* Catalogue Summary Header */}
              <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 p-5 rounded-2xl border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🎪</span>
                    <h3 className="font-serif text-lg font-bold text-amber-950">
                      Event Services Catalogue & Equipment Setup
                    </h3>
                  </div>
                  <p className="text-xs text-amber-900/80 mt-1">
                    Click on services to select or deselect. Selected items appear on customer search and your public home setup profile.
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

              {/* 7 Interactive Catalogue Groups */}
              <div className="space-y-5">
                {CATALOGUE_GROUPS.map((group, gIdx) => {
                  const letter = String.fromCharCode(65 + gIdx); // A, B, C, D...
                  const customItemsForGroup = customSubcategoriesMap[group.name] || [];
                  const allGroupItems = [...group.subcategories, ...customItemsForGroup];
                  const selectedInGroup = form.subcategories.filter((s) => allGroupItems.includes(s));
                  const isAllSelected = selectedInGroup.length === allGroupItems.length && allGroupItems.length > 0;

                  return (
                    <div
                      key={group.key}
                      className="p-5 rounded-2xl bg-white border border-line hover:border-amber-300 transition-all shadow-2xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-line/60">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{group.icon}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-serif text-sm font-bold text-ink">
                                {letter}. {group.name}
                              </h4>
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
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

                      {/* Items Chips */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {/* Standard Subcategories */}
                        {group.subcategories.map((subName) => {
                          const isSelected = form.subcategories.includes(subName);
                          return (
                            <button
                              key={subName}
                              type="button"
                              onClick={() => toggleSubcategory(group.name, subName)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                                isSelected
                                  ? "bg-emerald-600 text-white shadow-2xs border border-emerald-600 hover:bg-emerald-700"
                                  : "bg-surface hover:bg-amber-50 text-ink border border-line hover:border-amber-300"
                              }`}
                            >
                              <span>{isSelected ? "✓" : "+"}</span>
                              <span>{subName}</span>
                            </button>
                          );
                        })}

                        {/* Custom Added Subcategories */}
                        {customItemsForGroup.map((customItem) => {
                          const isSelected = form.subcategories.includes(customItem);
                          return (
                            <div
                              key={customItem}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                                isSelected
                                  ? "bg-emerald-600 text-white border-emerald-600"
                                  : "bg-surface text-ink border-line"
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

                      {/* Custom Item Input */}
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
                          placeholder={`+ Add custom item to ${group.name}...`}
                          className="flex-1 px-3 py-1.5 rounded-xl border border-dashed border-gray-300 text-xs text-ink placeholder:text-muted focus:outline-none focus:border-brand-500 focus:bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddCustomToGroup(group.name, group.key)}
                          className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-amber-100 text-gray-800 text-xs font-semibold transition cursor-pointer shrink-0"
                        >
                          + Add Custom
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 flex justify-between items-center">
                <span className="text-xs text-muted">
                  Proceed to review setup name and contact details.
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab("basic")}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer inline-flex items-center gap-1"
                >
                  Next: Business Details & Rates →
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: BASIC INFORMATION & PRICING */}
          {activeTab === "basic" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Home Setup / Business Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="e.g. Royal Pandal & Ghar Wedding Setup Services"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm text-ink focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Owner / Contact Person</label>
                  <input
                    type="text"
                    name="ownerName"
                    value={form.ownerName}
                    onChange={handleChange}
                    placeholder="e.g. Ramesh Kumar Verma"
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
                    placeholder="e.g. vendor@flipsaura.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm text-ink focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Package / Starting Rate (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="rentalPrice"
                    value={form.rentalPrice}
                    onChange={handleChange}
                    placeholder="e.g. 25000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm text-ink focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    City / Location <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    list="home-setup-cities"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="e.g. Daudnagar, Aurangabad, Patna"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm text-ink focus:outline-none focus:border-brand-500"
                    required
                  />
                  <datalist id="home-setup-cities">
                    {COMMON_CITIES.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Locality / Landmark</label>
                  <input
                    type="text"
                    name="locality"
                    value={form.locality}
                    onChange={handleChange}
                    placeholder="e.g. Old GT Road, Main Market"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm text-ink focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-ink mb-1">Address / Base Office</label>
                  <input
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="e.g. Near Bus Stand, Daudnagar, Bihar"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm text-ink focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-ink mb-1">About Your Home Setup Services</label>
                  <textarea
                    rows={3}
                    name="about"
                    value={form.about}
                    onChange={handleChange}
                    placeholder="Brief summary of your ghar wedding pandal, tent, mandap, sound and generator setups..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm text-ink focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-ink mb-1">Detailed Description & Policies</label>
                  <textarea
                    rows={4}
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Mention customisation options, outstation travel, booking advance, setup time required..."
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
                    <span>Active & Available for Bookings</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-ink">
                    <input
                      type="checkbox"
                      name="featured"
                      checked={form.featured}
                      onChange={handleChange}
                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span>Showcase as Featured Setup</span>
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
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer inline-flex items-center gap-1"
                >
                  Next: Add Photos →
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: CATEGORY-WISE PHOTOS & SHOWCASE */}
          {activeTab === "photos" && (
            <div className="space-y-6">
              {/* Category-Wise Photos Explainer Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start sm:items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center text-xl shrink-0 shadow-xs">
                    📸
                  </span>
                  <div>
                    <h4 className="font-serif font-bold text-sm sm:text-base text-amber-950">
                      Category-Wise Setup Photos & Equipment Showcase
                    </h4>
                    <p className="text-xs text-amber-900/80 mt-0.5">
                      Upload photos separately for each equipment category (DJ, Tent, Stage, Furniture, Lighting, etc.). Customers can now view your real photos under each exact service!
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    Total {allUniquePhotos.length} Photos
                  </span>
                </div>
              </div>

              {/* Category Selection Tabs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                    <span>📁</span>
                    <span>Select Service Category to Manage Photos:</span>
                  </label>
                  <span className="text-[11px] text-muted">Click any category tab below</span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {/* General / Cover Button */}
                  <button
                    type="button"
                    onClick={() => setActivePhotoCategory("general")}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
                      activePhotoCategory === "general"
                        ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                        : "bg-white text-gray-700 border-line hover:border-amber-300 hover:bg-amber-50/50"
                    }`}
                  >
                    <span>🌟</span>
                    <span>Main Cover / General</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        activePhotoCategory === "general"
                          ? "bg-white/20 text-white"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {form.images.length}
                    </span>
                  </button>

                  {/* 7 Catalogue Group Tabs */}
                  {CATALOGUE_GROUPS.map((grp) => {
                    const isSelectedInCatalogue = form.mainCategories.includes(grp.name);
                    const count = (categoryPhotosMap[grp.name] || []).length;
                    const isActive = activePhotoCategory === grp.name;

                    return (
                      <button
                        key={grp.key}
                        type="button"
                        onClick={() => setActivePhotoCategory(grp.name)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
                          isActive
                            ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                            : isSelectedInCatalogue
                            ? "bg-white text-ink border-amber-200 hover:border-amber-400 hover:bg-amber-50/40"
                            : "bg-gray-50/90 text-muted border-line hover:border-gray-300 hover:text-ink"
                        }`}
                      >
                        <span>{grp.icon}</span>
                        <span>{grp.name}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            isActive
                              ? "bg-white/20 text-white"
                              : count > 0
                              ? "bg-amber-100 text-amber-900 border border-amber-300"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}

                  {/* View All Combined Tab */}
                  <button
                    type="button"
                    onClick={() => setActivePhotoCategory("all_overview")}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                      activePhotoCategory === "all_overview"
                        ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                        : "bg-white text-gray-700 border-line hover:border-amber-300"
                    }`}
                  >
                    <span>🖼️</span>
                    <span>All Photos Overview</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        activePhotoCategory === "all_overview"
                          ? "bg-white/20 text-white"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {allUniquePhotos.length}
                    </span>
                  </button>
                </div>
              </div>

              {/* ACTIVE CATEGORY UPLOADER & SHOWCASE */}
              {activePhotoCategory !== "all_overview" ? (
                <div className="space-y-4">
                  {/* Category Info Header */}
                  {(() => {
                    const guidance = {
                      "Tent & Pandal": {
                        icon: "⛺",
                        title: "Tent & Pandal Photos",
                        desc: "Upload photos of waterproof tents, German hangers, royal shamianas, entrance canopies, and luxury pandal setups.",
                      },
                      "Furniture & Seating": {
                        icon: "🪑",
                        title: "Furniture & Seating Photos",
                        desc: "Upload photos of VIP sofas, bride & groom seating, banquet chairs, round dining tables, and lounge setups.",
                      },
                      "Stage & Decoration": {
                        icon: "🌸",
                        title: "Stage & Decoration Photos",
                        desc: "Upload photos of wedding stages, floral mandap setups, LED backdrop screens, and red carpet entrance decor.",
                      },
                      "DJ & Sound System": {
                        icon: "🔊",
                        title: "DJ & Sound System Photos",
                        desc: "Upload photos of professional DJ consoles, line array systems, heavy bass subwoofers, live microphones, and dance floors.",
                      },
                      "Lighting & Special Effects": {
                        icon: "💡",
                        title: "Lighting & Special Effects Photos",
                        desc: "Upload photos of LED par lights, moving heads, lasers, serial lights, disco floors, and cold pyro celebrations.",
                      },
                      "Power & Generator": {
                        icon: "⚡",
                        title: "Power & Generator Photos",
                        desc: "Upload photos of silent DG sets, heavy power backup generators, distribution boards, and electrical switchgear.",
                      },
                      "Additional Facilities": {
                        icon: "🚪",
                        title: "Additional Facilities Photos",
                        desc: "Upload photos of portable green rooms, bridal changing rooms, AC/cooler setups, mist fans, and parking arrangements.",
                      },
                      general: {
                        icon: "🌟",
                        title: "Main Listing Cover & General Setup Photos",
                        desc: "Upload primary photos for your search card cover, exterior pandal views, and overall wedding portfolio.",
                      },
                    };
                    const curMeta = guidance[activePhotoCategory] || {
                      icon: "🎪",
                      title: `${activePhotoCategory} Photos`,
                      desc: `Upload photos specifically for ${activePhotoCategory}. Customers viewing this service will see these photos.`,
                    };

                    const currentCategoryPhotos =
                      activePhotoCategory === "general"
                        ? form.images
                        : (categoryPhotosMap[activePhotoCategory] || []);

                    return (
                      <div className="p-5 rounded-2xl bg-surface border border-line space-y-4">
                        <div className="flex items-center justify-between gap-3 border-b border-line/70 pb-3">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{curMeta.icon}</span>
                            <div>
                              <h4 className="font-bold text-sm text-ink">{curMeta.title}</h4>
                              <p className="text-[11px] text-muted mt-0.5">{curMeta.desc}</p>
                            </div>
                          </div>
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200 shrink-0">
                            {currentCategoryPhotos.length} {currentCategoryPhotos.length === 1 ? "Photo" : "Photos"}
                          </span>
                        </div>

                        {/* File Upload Dropzone */}
                        <div className="flex flex-col sm:flex-row gap-3">
                          <label className="flex-1 flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-amber-300 hover:border-amber-500 bg-white transition cursor-pointer group shadow-2xs">
                            <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">
                              {curMeta.icon || "📸"}
                            </span>
                            <span className="text-xs font-semibold text-ink">
                              {uploadingImage ? uploadProgress : `Click to Upload Photos for ${curMeta.title}`}
                            </span>
                            <span className="text-[11px] text-muted mt-0.5">
                              JPG, PNG, WebP up to 10MB each (Multi-select allowed)
                            </span>
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

                        {/* Direct URL Input */}
                        <div className="pt-1 flex items-center gap-2">
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
                            placeholder={`Or paste direct image URL for ${curMeta.title} (https://...)`}
                            className="flex-1 px-3.5 py-2 rounded-xl border border-line text-xs text-ink focus:outline-none focus:border-amber-500 bg-white"
                          />
                          <button
                            type="button"
                            onClick={handleAddDirectImageUrl}
                            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition cursor-pointer shrink-0 shadow-2xs"
                          >
                            + Add Image URL
                          </button>
                        </div>

                        {/* Photos Grid for this Active Category */}
                        {currentCategoryPhotos.length > 0 ? (
                          <div className="pt-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-bold text-ink">
                                Uploaded Photos ({currentCategoryPhotos.length})
                              </h5>
                              <span className="text-[11px] text-muted">
                                Top photo or set cover becomes main listing card image
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {currentCategoryPhotos.map((img, idx) => {
                                const isMainCover = form.images?.[0] === img;
                                return (
                                  <div
                                    key={idx}
                                    className="relative group rounded-xl overflow-hidden border border-line aspect-video bg-gray-100 shadow-2xs"
                                  >
                                    <img
                                      src={img}
                                      alt={`${curMeta.title} ${idx + 1}`}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />

                                    {/* Action buttons */}
                                    <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (activePhotoCategory === "general") {
                                            removeImage(idx);
                                          } else {
                                            removeCategoryPhoto(activePhotoCategory, img);
                                          }
                                        }}
                                        className="w-7 h-7 rounded-full bg-black/75 hover:bg-rose-600 text-white flex items-center justify-center text-xs transition cursor-pointer shadow"
                                        title="Remove this photo"
                                      >
                                        ✕
                                      </button>
                                    </div>

                                    {/* Set as Cover button on hover */}
                                    {!isMainCover && (
                                      <button
                                        type="button"
                                        onClick={() => setAsCoverPhoto(img)}
                                        className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition px-2 py-0.5 rounded-md bg-black/70 hover:bg-amber-600 text-white text-[10px] font-bold shadow-xs cursor-pointer"
                                      >
                                        Set as Cover
                                      </button>
                                    )}

                                    {isMainCover && (
                                      <span className="absolute bottom-1.5 left-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-600 text-white shadow-2xs">
                                        ⭐ Main Cover
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="p-8 rounded-xl border-2 border-dashed border-gray-200 bg-white/70 text-center space-y-2">
                            <span className="text-3xl block">{curMeta.icon}</span>
                            <p className="text-xs font-semibold text-ink">
                              No photos added for {curMeta.title} yet
                            </p>
                            <p className="text-[11px] text-muted max-w-sm mx-auto">
                              Add photos above so customers can see your actual equipment and setup work when viewing {curMeta.title}!
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* ALL PHOTOS OVERVIEW VIEW */
                <div className="space-y-6">
                  {/* General Cover Photos */}
                  <div className="p-5 rounded-2xl bg-white border border-line space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🌟</span>
                        <h4 className="font-bold text-sm text-ink">Main Cover & General Photos</h4>
                      </div>
                      <span className="text-xs font-bold text-muted bg-gray-100 px-2 py-0.5 rounded-full">
                        {form.images.length} Photos
                      </span>
                    </div>

                    {form.images.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {form.images.map((img, idx) => (
                          <div
                            key={idx}
                            className="relative group rounded-xl overflow-hidden border border-line aspect-video bg-gray-100"
                          >
                            <img src={img} alt={`General ${idx + 1}`} className="w-full h-full object-cover" />
                            {idx === 0 && (
                              <span className="absolute bottom-1.5 left-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-600 text-white shadow-2xs">
                                ⭐ Primary Cover
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted italic">No general photos added.</p>
                    )}
                  </div>

                  {/* Each Subcategory Breakdown */}
                  {CATALOGUE_GROUPS.map((grp) => {
                    const imgs = categoryPhotosMap[grp.name] || [];
                    if (imgs.length === 0) return null;

                    return (
                      <div key={grp.key} className="p-5 rounded-2xl bg-white border border-line space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{grp.icon}</span>
                            <h4 className="font-bold text-sm text-ink">{grp.name}</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                              {imgs.length} Photos
                            </span>
                            <button
                              type="button"
                              onClick={() => setActivePhotoCategory(grp.name)}
                              className="text-xs font-semibold text-amber-600 hover:text-amber-700 underline cursor-pointer"
                            >
                              Manage
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {imgs.map((img, iIdx) => (
                            <div
                              key={iIdx}
                              className="relative group rounded-xl overflow-hidden border border-line aspect-video bg-gray-100"
                            >
                              <img src={img} alt={`${grp.name} ${iIdx + 1}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeCategoryPhoto(grp.name, img)}
                                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center text-xs transition cursor-pointer opacity-80 group-hover:opacity-100"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
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
                  {submitting ? "Saving Listing..." : isEdit ? "Update Home Setup Listing" : "Publish Home Setup Listing"}
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-t border-line bg-surface/50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-muted text-center sm:text-left">
            <span className="font-semibold text-ink">{totalSelectedCatalogueCount}</span> services selected across{" "}
            <span className="font-semibold text-ink">{form.mainCategories.length}</span> groups.
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
              className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer disabled:opacity-50 text-center"
            >
              {submitting ? "Saving..." : isEdit ? "Save Changes" : "Save & Publish Setup"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

