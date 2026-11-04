"use client";
import React, { useState, useEffect } from "react";
import api from "@/api/axios";
import { uploadFile } from "@/lib/uploadHelper";

// Default Photography Catalogue Options
const DEFAULT_PHOTOGRAPHY_CATALOGUE = [
  {
    id: "styles",
    name: "A. Photography & Coverage Styles",
    icon: "📷",
    description: "Candid, traditional, drone cinematography, and specialty shoots.",
    subcategories: [
      "Candid Wedding Photography",
      "Traditional Photography",
      "Pre-Wedding Couple Shoot",
      "Post-Wedding Shoot",
      "Cinematic Wedding Film (Teaser + Movie)",
      "Traditional HD/4K Videography",
      "Drone Aerial 4K Cinematography",
      "Instagram Reels & 60-Sec Highlights",
      "Same-Day Edit / Next-Day Sangeet Teaser",
      "Engagement / Ring Ceremony Coverage",
      "Haldi & Mehndi Vibrant Shoot",
      "Maternity & Baby Shoot",
      "360 Degree Video Booth Setup",
      "Live Streaming (YouTube / Zoom)",
    ],
  },
  {
    id: "gear",
    name: "B. Production Equipment & Gear",
    icon: "🎥",
    description: "Cinema cameras, gimbals, lighting, and aerial setups.",
    subcategories: [
      "Sony FX3 / A7S III Cinema Line 4K Cameras",
      "Canon R5 / Nikon Z8 High-Resolution Bodies",
      "DJI Ronin Gimbal Stabilizers",
      "DJI 4K Cinema Drone",
      "Godox / Profoto Studio Strobes & Continuous Lights",
      "Wireless Audio Kit & Collar Mics",
      "Video Jib / Crane with Remote Head",
      "LED Wall Telecast Switcher Kit",
    ],
  },
  {
    id: "deliverables",
    name: "C. Albums & Deliverables",
    icon: "📖",
    description: "Luxury albums, digital drives, and raw coverage access.",
    subcategories: [
      "Luxury Italian Leather Flush-Mount Album (40+ Sheets)",
      "Premium Velvet Hardcover Photo Album",
      "Mini Parent / Pocket Albums",
      "High-Resolution Retouched Cloud Gallery",
      "Raw Footage & All Photos on 1TB/2TB Hard Drive",
      "Custom Wooden USB Pen Drive Box",
      "Framed Canvas Wall Enlargements",
    ],
  },
  {
    id: "team",
    name: "D. Crew, Travel & Policies",
    icon: "👥",
    description: "Team size, destination travel, and booking flexibility.",
    subcategories: [
      "Available for Destination / Outstation Shoots",
      "Crew of 2 to 4 Professional Photographers & Videographers",
      "Large Production Crew of 6+ Directors & Cinematographers",
      "Female Photographer Available for Bridal Prep",
      "Next-Day Teaser Delivery Guarantee",
    ],
  },
];

export default function AdminPhotographyFormModal({
  isOpen,
  onClose,
  initialData,
  onSaved,
  isVendor = false,
}) {
  const [activeTab, setActiveTab] = useState("basic"); // basic | options | packages | photos | albums | videos | about

  const [form, setForm] = useState({
    name: "",
    address: "",
    locality: "",
    city: "Daudnagar",
    state: "Bihar",
    pincode: "",
    contactPhone: "",
    contactEmail: "",
    about: "",
    description: "",
    photos: [],
    albums: [],
    videos: [],
    mainCategories: [],
    subcategories: [],
    customSubcategoriesMap: {},
    photographyPackages: {
      basic: {
        price: "25000",
        title: "Basic Package",
        description: "1 Day Pre-Wedding or single ceremony coverage with digital photos.",
        deliverables: [
          "1 Traditional / Candid Photographer",
          "All edited high-res digital photos",
          "Online album gallery access",
        ],
      },
      standard: {
        price: "50000",
        title: "Standard Package",
        description: "Complete 1-day wedding day photography & traditional HD video coverage.",
        deliverables: [
          "1 Candid Photographer + 1 Traditional Videographer",
          "Full HD Wedding Video (45-60 mins)",
          "1 Premium Hardcover Photo Album (30 sheets)",
          "Full raw footage on USB drive",
        ],
      },
      premium: {
        price: "95000",
        title: "Premium Package",
        description: "2-Day comprehensive wedding, sangeet & reception coverage with cinema style.",
        deliverables: [
          "2 Candid Photographers + 2 Cinematic Videographers",
          "Cinematic Wedding Film & Teaser Trailer (3-5 mins)",
          "Drone aerial coverage of venue and baraat",
          "2 Luxury Flush-Mount Photo Albums",
        ],
      },
      luxury: {
        price: "175000",
        title: "Luxury Package",
        description: "Ultra-luxury multi-day wedding celebration with dedicated celebrity crew.",
        deliverables: [
          "Master Director + 3 Candid Photographers + 3 Cinematographers",
          "4K Cinema Film + Drone Aerial Coverage",
          "Pre-Wedding & Post-Wedding Shoots included",
          "3 Handcrafted Leather Royal Albums + Parent Albums",
          "Next-day Instagram Reel Teasers",
        ],
      },
    },
    active: true,
    featured: false,
    rating: "4.8",
    reviewsCount: "0",
  });

  // Custom Category & Option states
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [customOptionInputs, setCustomOptionInputs] = useState({});

  // Direct image & album inputs
  const [directPhotoUrl, setDirectPhotoUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  // New deliverable inputs for packages
  const [newDeliverable, setNewDeliverable] = useState({
    basic: "",
    standard: "",
    premium: "",
    luxury: "",
  });

  // New album draft state
  const [newAlbum, setNewAlbum] = useState({
    title: "",
    description: "",
    coverImage: "",
    imagesText: "",
    link: "",
  });
  const [uploadingAlbumCover, setUploadingAlbumCover] = useState(false);
  const [uploadingAlbumPhotos, setUploadingAlbumPhotos] = useState(false);
  const [albumPhotosList, setAlbumPhotosList] = useState([]);

  // New video draft state
  const [newVideo, setNewVideo] = useState({
    title: "",
    url: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Load initial data on edit
  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.title || initialData.name || "",
        address: initialData.address || "",
        locality: initialData.locality || "",
        city: initialData.city || "Daudnagar",
        state: initialData.state || "Bihar",
        pincode: initialData.pincode || "",
        contactPhone: initialData.contactPhone || initialData.vendor?.phone || "",
        contactEmail: initialData.contactEmail || initialData.vendor?.email || "",
        about: initialData.about || "",
        description: initialData.description || initialData.about || "",
        photos: Array.isArray(initialData.images) ? initialData.images : [],
        albums: Array.isArray(initialData.albums) ? initialData.albums : [],
        videos: Array.isArray(initialData.videos) ? initialData.videos : [],
        mainCategories: Array.isArray(initialData.mainCategories) ? initialData.mainCategories : [],
        subcategories: Array.isArray(initialData.subcategories) ? initialData.subcategories : [],
        customSubcategoriesMap: initialData.customSubcategoriesMap || {},
        photographyPackages: {
          basic: {
            price: initialData.photographyPackages?.basic?.price !== undefined ? String(initialData.photographyPackages.basic.price) : "25000",
            title: initialData.photographyPackages?.basic?.title || "Basic Package",
            description: initialData.photographyPackages?.basic?.description || "1 Day Pre-Wedding or single ceremony coverage with digital photos.",
            deliverables: initialData.photographyPackages?.basic?.deliverables || [
              "1 Traditional / Candid Photographer",
              "All edited high-res digital photos",
              "Online album gallery access",
            ],
          },
          standard: {
            price: initialData.photographyPackages?.standard?.price !== undefined ? String(initialData.photographyPackages.standard.price) : "50000",
            title: initialData.photographyPackages?.standard?.title || "Standard Package",
            description: initialData.photographyPackages?.standard?.description || "Complete 1-day wedding day photography & traditional HD video coverage.",
            deliverables: initialData.photographyPackages?.standard?.deliverables || [
              "1 Candid Photographer + 1 Traditional Videographer",
              "Full HD Wedding Video (45-60 mins)",
              "1 Premium Hardcover Photo Album (30 sheets)",
              "Full raw footage on USB drive",
            ],
          },
          premium: {
            price: initialData.photographyPackages?.premium?.price !== undefined ? String(initialData.photographyPackages.premium.price) : "95000",
            title: initialData.photographyPackages?.premium?.title || "Premium Package",
            description: initialData.photographyPackages?.premium?.description || "2-Day comprehensive wedding, sangeet & reception coverage with cinema style.",
            deliverables: initialData.photographyPackages?.premium?.deliverables || [
              "2 Candid Photographers + 2 Cinematic Videographers",
              "Cinematic Wedding Film & Teaser Trailer (3-5 mins)",
              "Drone aerial coverage of venue and baraat",
              "2 Luxury Flush-Mount Photo Albums",
            ],
          },
          luxury: {
            price: initialData.photographyPackages?.luxury?.price !== undefined ? String(initialData.photographyPackages.luxury.price) : "175000",
            title: initialData.photographyPackages?.luxury?.title || "Luxury Package",
            description: initialData.photographyPackages?.luxury?.description || "Ultra-luxury multi-day wedding celebration with dedicated celebrity crew.",
            deliverables: initialData.photographyPackages?.luxury?.deliverables || [
              "Master Director + 3 Candid Photographers + 3 Cinematographers",
              "4K Cinema Film + Drone Aerial Coverage",
              "Pre-Wedding & Post-Wedding Shoots included",
              "3 Handcrafted Leather Royal Albums + Parent Albums",
              "Next-day Instagram Reel Teasers",
            ],
          },
        },
        active: initialData.active !== undefined ? initialData.active : true,
        featured: Boolean(initialData.featured),
        rating: initialData.rating ? String(initialData.rating) : "4.8",
        reviewsCount: initialData.reviewsCount ? String(initialData.reviewsCount) : "0",
      });
    }
  }, [initialData]);

  if (!isOpen) return null;

  // Toggle Subcategory
  const handleToggleSubcategory = (mainCatName, subcat) => {
    setForm((prev) => {
      const hasSub = prev.subcategories.includes(subcat);
      const newSubs = hasSub
        ? prev.subcategories.filter((s) => s !== subcat)
        : [...prev.subcategories, subcat];

      const newMains = new Set(prev.mainCategories);
      if (!hasSub) {
        newMains.add(mainCatName);
      }
      return {
        ...prev,
        subcategories: newSubs,
        mainCategories: Array.from(newMains),
      };
    });
  };

  // Add Custom Option under Category
  const handleAddCustomOption = (catName) => {
    const val = (customOptionInputs[catName] || "").trim();
    if (!val) return;

    setForm((prev) => {
      const map = { ...prev.customSubcategoriesMap };
      const currentList = map[catName] || [];
      if (!currentList.includes(val)) {
        map[catName] = [...currentList, val];
      }
      return {
        ...prev,
        customSubcategoriesMap: map,
        subcategories: [...new Set([...prev.subcategories, val])],
        mainCategories: [...new Set([...prev.mainCategories, catName])],
      };
    });

    setCustomOptionInputs((prev) => ({ ...prev, [catName]: "" }));
  };

  // Add Entire New Custom Category
  const handleAddNewCategory = () => {
    const catName = customCategoryName.trim();
    if (!catName) return;

    setForm((prev) => {
      const map = { ...prev.customSubcategoriesMap };
      if (!map[catName]) {
        map[catName] = [];
      }
      return {
        ...prev,
        customSubcategoriesMap: map,
        mainCategories: [...new Set([...prev.mainCategories, catName])],
      };
    });

    setCustomCategoryName("");
  };

  // Package Deliverables Handlers
  const handleAddDeliverable = (pkgKey) => {
    const itemToAdd = newDeliverable[pkgKey]?.trim();
    if (!itemToAdd) return;

    setForm((prev) => ({
      ...prev,
      photographyPackages: {
        ...prev.photographyPackages,
        [pkgKey]: {
          ...prev.photographyPackages[pkgKey],
          deliverables: [...(prev.photographyPackages[pkgKey].deliverables || []), itemToAdd],
        },
      },
    }));

    setNewDeliverable((prev) => ({ ...prev, [pkgKey]: "" }));
  };

  const handleQuickAddChip = (pkgKey, chipText) => {
    setForm((prev) => {
      const currentList = prev.photographyPackages[pkgKey].deliverables || [];
      if (currentList.includes(chipText)) return prev;
      return {
        ...prev,
        photographyPackages: {
          ...prev.photographyPackages,
          [pkgKey]: {
            ...prev.photographyPackages[pkgKey],
            deliverables: [...currentList, chipText],
          },
        },
      };
    });
  };

  const handleRemoveDeliverable = (pkgKey, idx) => {
    setForm((prev) => ({
      ...prev,
      photographyPackages: {
        ...prev.photographyPackages,
        [pkgKey]: {
          ...prev.photographyPackages[pkgKey],
          deliverables: prev.photographyPackages[pkgKey].deliverables.filter((_, i) => i !== idx),
        },
      },
    }));
  };

  // Photos Handlers
  const handleAddDirectPhoto = () => {
    if (!directPhotoUrl.trim()) return;
    setForm((prev) => ({
      ...prev,
      photos: [...prev.photos, directPhotoUrl.trim()],
    }));
    setDirectPhotoUrl("");
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
        const url = await uploadFile(file, "flipsaura/photography");
        if (url) {
          uploadedUrls.push(url);
        }
      }

      if (uploadedUrls.length > 0) {
        setForm((prev) => ({
          ...prev,
          photos: [...prev.photos, ...uploadedUrls],
        }));
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("Image upload failed. You can paste direct image URLs instead.");
    } finally {
      setUploadingImage(false);
      setUploadProgress("");
      e.target.value = "";
    }
  };

  const handleRemovePhoto = (idx) => {
    setForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== idx),
    }));
  };

  // Album Handlers & Uploads
  const handleAlbumCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAlbumCover(true);
    setError("");
    try {
      const url = await uploadFile(file, "flipsaura/albums");
      if (url) {
        setNewAlbum((prev) => ({ ...prev, coverImage: url }));
      }
    } catch (err) {
      console.error("Album cover upload error:", err);
      setError("Failed to upload album cover image.");
    } finally {
      setUploadingAlbumCover(false);
      e.target.value = "";
    }
  };

  const handleAlbumPhotosUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploadingAlbumPhotos(true);
    setError("");
    try {
      const uploaded = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadFile(files[i], "flipsaura/albums");
        if (url) uploaded.push(url);
      }
      if (uploaded.length > 0) {
        setAlbumPhotosList((prev) => [...prev, ...uploaded]);
        setNewAlbum((prev) => ({
          ...prev,
          coverImage: prev.coverImage || uploaded[0] || "",
        }));
      }
    } catch (err) {
      console.error("Album photos upload error:", err);
      setError("Failed to upload album photos.");
    } finally {
      setUploadingAlbumPhotos(false);
      e.target.value = "";
    }
  };

  const handleRemoveAlbumDraftPhoto = (idx) => {
    setAlbumPhotosList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddAlbum = () => {
    if (!newAlbum.title.trim()) {
      setError("Please enter an Album Title");
      return;
    }

    const imgsFromText = newAlbum.imagesText
      ? newAlbum.imagesText.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
      : [];
    const allImgs = Array.from(new Set([...albumPhotosList, ...imgsFromText]));

    setForm((prev) => ({
      ...prev,
      albums: [
        ...prev.albums,
        {
          title: newAlbum.title.trim(),
          description: newAlbum.description.trim(),
          coverImage: newAlbum.coverImage.trim() || allImgs[0] || "",
          images: allImgs,
          link: newAlbum.link.trim(),
        },
      ],
    }));

    setNewAlbum({ title: "", description: "", coverImage: "", imagesText: "", link: "" });
    setAlbumPhotosList([]);
    setError("");
  };

  const handleRemoveAlbum = (idx) => {
    setForm((prev) => ({
      ...prev,
      albums: prev.albums.filter((_, i) => i !== idx),
    }));
  };

  // Video Handlers
  const handleAddVideo = () => {
    if (!newVideo.url.trim()) {
      setError("Please enter a video URL (YouTube, Vimeo, Google Drive, or MP4)");
      return;
    }

    setForm((prev) => ({
      ...prev,
      videos: [
        ...prev.videos,
        {
          title: newVideo.title.trim() || "Showcase Video",
          url: newVideo.url.trim(),
        },
      ],
    }));

    setNewVideo({ title: "", url: "" });
    setError("");
  };

  const handleRemoveVideo = (idx) => {
    setForm((prev) => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== idx),
    }));
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Studio or Photographer Name is required");
      setActiveTab("basic");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessMsg("");

    try {
      const payload = {
        name: form.name.trim(),
        address: form.address.trim(),
        locality: form.locality.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        contactPhone: form.contactPhone.trim(),
        contactEmail: form.contactEmail.trim(),
        about: form.about.trim(),
        description: form.description.trim(),
        photos: form.photos,
        albums: form.albums,
        videos: form.videos,
        mainCategories: form.mainCategories,
        subcategories: form.subcategories,
        customSubcategoriesMap: form.customSubcategoriesMap,
        photographyPackages: {
          basic: {
            price: Number(form.photographyPackages.basic.price) || 0,
            title: form.photographyPackages.basic.title,
            description: form.photographyPackages.basic.description,
            deliverables: form.photographyPackages.basic.deliverables,
          },
          standard: {
            price: Number(form.photographyPackages.standard.price) || 0,
            title: form.photographyPackages.standard.title,
            description: form.photographyPackages.standard.description,
            deliverables: form.photographyPackages.standard.deliverables,
          },
          premium: {
            price: Number(form.photographyPackages.premium.price) || 0,
            title: form.photographyPackages.premium.title,
            description: form.photographyPackages.premium.description,
            deliverables: form.photographyPackages.premium.deliverables,
          },
          luxury: {
            price: Number(form.photographyPackages.luxury.price) || 0,
            title: form.photographyPackages.luxury.title,
            description: form.photographyPackages.luxury.description,
            deliverables: form.photographyPackages.luxury.deliverables,
          },
        },
        active: form.active,
        featured: form.featured,
        rating: Number(form.rating) || 4.8,
        reviewsCount: Number(form.reviewsCount) || 0,
      };

      let res;
      const endpoint = isVendor ? `/api/vendor/photography` : `/api/admin/photography`;
      if (initialData?._id) {
        res = await api.put(`${endpoint}/${initialData._id}`, payload);
      } else {
        res = await api.post(endpoint, payload);
      }

      if (res.data?.ok) {
        setSuccessMsg(initialData?._id ? "Photography listing updated successfully!" : "Photography listing created successfully!");
        if (onSaved) onSaved(res.data.data.item);
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        throw new Error(res.data?.error || "Failed to save photography listing");
      }
    } catch (err) {
      console.error("Save photography error:", err);
      setError(err.response?.data?.error || err.message || "Failed to save photography listing");
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { id: "basic", label: "Basic & Contact", icon: "📋" },
    { id: "options", label: `Services & Options (${form.subcategories.length})`, icon: "✨" },
    { id: "packages", label: "Package Pricing (4)", icon: "💰" },
    { id: "photos", label: `Photos (${form.photos.length})`, icon: "📸" },
    { id: "albums", label: `Albums (${form.albums.length})`, icon: "📖" },
    { id: "videos", label: `Videos (${form.videos.length})`, icon: "🎥" },
    { id: "about", label: "About & Bio", icon: "📝" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-brand-100 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 bg-gradient-to-r from-brand-50 to-white border-b border-brand-100 flex items-start sm:items-center justify-between shrink-0 gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center text-lg sm:text-xl shadow-sm shrink-0">
              📷
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-serif font-bold text-base sm:text-xl text-ink truncate">
                {initialData ? "Edit Photography Listing" : "Add Photography Listing"}
              </h2>
              <p className="text-[11px] sm:text-xs text-muted truncate">
                Catalogue management for wedding photographers & studios
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white border border-brand-200 text-muted hover:text-ink flex items-center justify-center transition-all cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-brand-100 px-3 sm:px-6 bg-brand-50/40 overflow-x-auto scrollbar-none gap-1.5 sm:gap-2 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-4 border-b-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "border-brand-600 text-brand-700 bg-white"
                  : "border-transparent text-muted hover:text-ink hover:bg-white/50"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2">
              <span>✓</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: BASIC INFORMATION */}
          {activeTab === "basic" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
                  Studio / Photographer Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Shutter Photography & Films"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
                    Contact Mobile Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9876543210"
                    value={form.contactPhone}
                    onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  />
                  <p className="text-[11px] text-muted mt-1">
                    Vendor can log in directly with this mobile number to manage their services.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
                    Contact Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. studio@flipsaura.com"
                    value={form.contactEmail}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
                  Complete Studio Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cinema Road, Near Town Hall, Daudnagar"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Locality / Area</label>
                  <input
                    type="text"
                    placeholder="e.g. Rapid Colony"
                    value={form.locality}
                    onChange={(e) => setForm({ ...form, locality: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-brand-200 text-xs focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Daudnagar"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-brand-200 text-xs focus:ring-2 focus:ring-brand-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">State *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bihar"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-brand-200 text-xs focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">PIN Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 824143"
                    value={form.pincode}
                    onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-brand-200 text-xs focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-brand-100">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="photoActive"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    className="w-4 h-4 text-brand-600 rounded border-brand-300 focus:ring-brand-500"
                  />
                  <label htmlFor="photoActive" className="text-xs font-semibold text-ink">
                    Active (Visible to customers on FlipsAura)
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="photoFeatured"
                    checked={form.featured}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                    className="w-4 h-4 text-brand-600 rounded border-brand-300 focus:ring-brand-500"
                  />
                  <label htmlFor="photoFeatured" className="text-xs font-semibold text-ink">
                    Featured Studio (Highlight on top of listings)
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OPTIONS & SERVICES CATALOGUE */}
          {activeTab === "options" && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-brand-50 border border-brand-200 text-brand-900 text-xs">
                <b>💡 Photography Services, Equipment & Add-on Options:</b> Select the coverage styles, cinema equipment, and album deliverables provided by this studio. You can also add custom categories and custom options below.
              </div>

              {/* Standard Catalogue Sections */}
              {DEFAULT_PHOTOGRAPHY_CATALOGUE.map((cat) => {
                const customItemsForCat = form.customSubcategoriesMap[cat.name] || [];
                const allSubcats = [...cat.subcategories, ...customItemsForCat];
                const selectedCount = allSubcats.filter((s) => form.subcategories.includes(s)).length;

                return (
                  <div key={cat.id} className="p-4 rounded-2xl border border-line bg-white shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{cat.icon}</span>
                        <div>
                          <h4 className="font-bold text-sm text-ink">{cat.name}</h4>
                          <p className="text-xs text-muted">{cat.description}</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-50 text-brand-800 border border-brand-200">
                        {selectedCount} selected
                      </span>
                    </div>

                    {/* Chips grid */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {allSubcats.map((subcat) => {
                        const isSelected = form.subcategories.includes(subcat);
                        return (
                          <button
                            key={subcat}
                            type="button"
                            onClick={() => handleToggleSubcategory(cat.name, subcat)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? "bg-brand-600 text-white shadow-xs font-semibold"
                                : "bg-surface hover:bg-brand-50 text-ink/80 border border-line"
                            }`}
                          >
                            <span>{isSelected ? "✓" : "+"}</span>
                            <span>{subcat}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom option input for this category */}
                    <div className="pt-2 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder={`+ Add custom option to ${cat.name}...`}
                        value={customOptionInputs[cat.name] || ""}
                        onChange={(e) =>
                          setCustomOptionInputs({ ...customOptionInputs, [cat.name]: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCustomOption(cat.name);
                          }
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-line text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddCustomOption(cat.name)}
                        className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold"
                      >
                        Add Option
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Dynamic User-Added Categories */}
              {Object.keys(form.customSubcategoriesMap)
                .filter((catName) => !DEFAULT_PHOTOGRAPHY_CATALOGUE.some((c) => c.name === catName))
                .map((customCatName) => {
                  const items = form.customSubcategoriesMap[customCatName] || [];
                  return (
                    <div key={customCatName} className="p-4 rounded-2xl border border-brand-300 bg-brand-50/30 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🌟</span>
                          <div>
                            <h4 className="font-bold text-sm text-ink">{customCatName}</h4>
                            <span className="text-[11px] text-brand-800 font-semibold">Custom Category</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        {items.map((subcat) => {
                          const isSelected = form.subcategories.includes(subcat);
                          return (
                            <button
                              key={subcat}
                              type="button"
                              onClick={() => handleToggleSubcategory(customCatName, subcat)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                                isSelected
                                  ? "bg-brand-600 text-white shadow-xs font-semibold"
                                  : "bg-white hover:bg-brand-50 text-ink/80 border border-line"
                              }`}
                            >
                              <span>{isSelected ? "✓" : "+"}</span>
                              <span>{subcat}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="pt-2 flex items-center gap-2">
                        <input
                          type="text"
                          placeholder={`+ Add option to ${customCatName}...`}
                          value={customOptionInputs[customCatName] || ""}
                          onChange={(e) =>
                            setCustomOptionInputs({ ...customOptionInputs, [customCatName]: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddCustomOption(customCatName);
                            }
                          }}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-line text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddCustomOption(customCatName)}
                          className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold"
                        >
                          Add Option
                        </button>
                      </div>
                    </div>
                  );
                })}

              {/* Add Brand New Category Button */}
              <div className="p-4 rounded-xl border border-dashed border-brand-300 bg-brand-50/20 flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  placeholder="+ Create completely new custom category (e.g. Specialty Drones & VFX)..."
                  value={customCategoryName}
                  onChange={(e) => setCustomCategoryName(e.target.value)}
                  className="flex-1 w-full px-3.5 py-2 rounded-xl border border-line text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddNewCategory}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-semibold text-xs shadow-2xs whitespace-nowrap"
                >
                  + Add Custom Category
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PACKAGE PRICING */}
          {activeTab === "packages" && (
            <div className="space-y-6">
              <div className="p-3 bg-brand-50 rounded-xl border border-brand-100 text-xs text-brand-800">
                💡 <b>FlipsAura Tiered Packages:</b> Configure pricing and deliverables for <b>Basic</b>, <b>Standard</b>, <b>Premium</b>, and <b>Luxury</b> tiers. Use quick-add chips or add custom deliverables to each package.
              </div>

              {["basic", "standard", "premium", "luxury"].map((pkgKey) => {
                const pkg = form.photographyPackages[pkgKey];
                const badgeColors = {
                  basic: "bg-blue-50 text-blue-700 border-blue-200",
                  standard: "bg-emerald-50 text-emerald-700 border-emerald-200",
                  premium: "bg-purple-50 text-purple-700 border-purple-200",
                  luxury: "bg-amber-50 text-amber-800 border-amber-200",
                }[pkgKey];

                const suggestedDeliverables =
                  pkgKey === "basic"
                    ? ["1 Traditional Photographer", "1 Candid Photographer", "All Edited High-Res Photos", "Online Album Access", "Pre-Wedding Shoot"]
                    : pkgKey === "standard"
                    ? ["1 Candid + 1 Traditional Videographer", "Full HD Wedding Video (60m)", "1 Hardcover Photo Album (30 sheets)", "Raw Footage on Drive", "Teaser Trailer (3m)"]
                    : pkgKey === "premium"
                    ? ["2 Candid + 2 Cinema Videographers", "Drone 4K Aerial Coverage", "Cinematic Wedding Film & Teaser", "2 Luxury Flush-Mount Albums", "Instagram Reel Teaser"]
                    : ["Master Director + 3 Candid + 3 Cinema Crew", "4K Cinema Film + Drone Shoots", "Pre-Wedding & Post-Wedding Shoots", "3 Handcrafted Royal Leather Albums + Parent Albums", "Same-Day Edit / Next-Day Teaser"];

                return (
                  <div key={pkgKey} className="p-4 sm:p-5 rounded-xl border border-brand-100 bg-white shadow-xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-50 pb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${badgeColors}`}>
                          {pkgKey}
                        </span>
                        <input
                          type="text"
                          value={pkg.title}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              photographyPackages: {
                                ...prev.photographyPackages,
                                [pkgKey]: { ...prev.photographyPackages[pkgKey], title: e.target.value },
                              },
                            }))
                          }
                          className="font-serif font-bold text-ink text-sm sm:text-base border-b border-dashed border-brand-300 focus:outline-none focus:border-brand-600 bg-transparent"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-muted">Price (₹):</span>
                        <input
                          type="number"
                          placeholder="e.g. 25000"
                          value={pkg.price}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              photographyPackages: {
                                ...prev.photographyPackages,
                                [pkgKey]: { ...prev.photographyPackages[pkgKey], price: e.target.value },
                              },
                            }))
                          }
                          className="w-32 px-3 py-1.5 rounded-lg border border-brand-200 font-bold text-sm text-brand-700 focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-muted mb-1">Package Summary</label>
                      <input
                        type="text"
                        placeholder="e.g. Coverage scope, days, and major deliverables"
                        value={pkg.description}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            photographyPackages: {
                              ...prev.photographyPackages,
                              [pkgKey]: { ...prev.photographyPackages[pkgKey], description: e.target.value },
                            },
                          }))
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-brand-100 text-xs focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    {/* Quick Add Chips */}
                    <div>
                      <span className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">
                        ⚡ Quick Add Deliverable Option:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestedDeliverables.map((chip) => {
                          const alreadyAdded = (pkg.deliverables || []).includes(chip);
                          return (
                            <button
                              key={chip}
                              type="button"
                              onClick={() => handleQuickAddChip(pkgKey, chip)}
                              className={`text-[11px] px-2.5 py-1 rounded-lg border transition flex items-center gap-1 ${
                                alreadyAdded
                                  ? "bg-brand-50 text-brand-800 border-brand-300 font-semibold"
                                  : "bg-surface hover:bg-brand-50 text-ink/70 border-line"
                              }`}
                            >
                              <span>{alreadyAdded ? "✓" : "+"}</span>
                              <span>{chip}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Deliverables List */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-ink mb-1.5">
                        Deliverables & Features Included ({pkg.deliverables.length})
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {pkg.deliverables.map((item, dIdx) => (
                          <span
                            key={dIdx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-50 border border-brand-200 text-xs font-medium text-ink"
                          >
                            <span>✓</span>
                            <span>{item}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveDeliverable(pkgKey, dIdx)}
                              className="text-muted hover:text-rose-600 font-bold ml-1 text-xs"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>

                      {/* Add Custom Deliverable input */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Type custom deliverable & press Add..."
                          value={newDeliverable[pkgKey]}
                          onChange={(e) =>
                            setNewDeliverable((prev) => ({ ...prev, [pkgKey]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddDeliverable(pkgKey);
                            }
                          }}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-brand-200 text-xs focus:ring-2 focus:ring-brand-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddDeliverable(pkgKey)}
                          className="px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-semibold hover:bg-brand-700 cursor-pointer shadow-xs"
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 4: PHOTOS */}
          {activeTab === "photos" && (
            <div className="space-y-4">
              <div className="p-3 bg-brand-50 rounded-xl border border-brand-100 text-xs text-brand-800">
                📸 <b>Studio Photos & Portfolio Showcase:</b> Upload multiple high-res photos or paste direct image links.
              </div>

              {/* Upload Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-brand-50/50 rounded-xl border border-brand-100">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-ink">Upload Image Files</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploadingImage}
                    className="block w-full text-xs text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-600 file:text-white hover:file:bg-brand-700 cursor-pointer"
                  />
                  {uploadingImage && (
                    <p className="text-xs text-brand-600 font-medium animate-pulse">{uploadProgress}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-ink">Or Paste Direct Image URL</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://example.com/photo.jpg"
                      value={directPhotoUrl}
                      onChange={(e) => setDirectPhotoUrl(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-brand-200 text-xs focus:ring-2 focus:ring-brand-500 bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddDirectPhoto}
                      className="px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-semibold hover:bg-brand-700 cursor-pointer shrink-0"
                    >
                      Add URL
                    </button>
                  </div>
                </div>
              </div>

              {/* Photos Grid */}
              {form.photos.length === 0 ? (
                <div className="py-8 border border-dashed border-brand-200 rounded-xl text-center text-muted text-xs">
                  No photos added yet. Upload files or paste image URLs above.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {form.photos.map((src, idx) => (
                    <div key={idx} className="relative aspect-[4/3] rounded-xl overflow-hidden border border-brand-100 bg-brand-50 group">
                      <img src={src} alt={`Studio Photo ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-600 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-xs"
                      >
                        ✕
                      </button>
                      <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px]">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ALBUMS */}
          {activeTab === "albums" && (
            <div className="space-y-4">
              <div className="p-3 bg-brand-50 rounded-xl border border-brand-100 text-xs text-brand-800">
                📖 <b>Previous Work Albums:</b> Add wedding stories, couple names, cover photos, and external gallery links.
              </div>

              {/* New Album Form */}
              <div className="p-4 bg-brand-50/50 rounded-xl border border-brand-100 space-y-3.5">
                <h4 className="font-bold text-xs uppercase tracking-wider text-ink flex items-center justify-between">
                  <span>+ Add New Album</span>
                  {(uploadingAlbumCover || uploadingAlbumPhotos) && (
                    <span className="text-xs text-brand-600 font-semibold animate-pulse">
                      Uploading image(s)...
                    </span>
                  )}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Album Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul & Priya — Royal Heritage Sangeet"
                      value={newAlbum.title}
                      onChange={(e) => setNewAlbum({ ...newAlbum, title: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-brand-200 text-xs focus:ring-2 focus:ring-brand-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Short Description</label>
                    <input
                      type="text"
                      placeholder="e.g. 2-Day Destination wedding in Rajgir"
                      value={newAlbum.description}
                      onChange={(e) => setNewAlbum({ ...newAlbum, description: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-brand-200 text-xs focus:ring-2 focus:ring-brand-500 bg-white"
                    />
                  </div>
                </div>

                {/* Album Cover Section */}
                <div className="p-3 bg-white rounded-xl border border-brand-200/70 space-y-2">
                  <label className="block text-xs font-bold text-ink">
                    1. Album Cover Image
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingAlbumCover}
                        onChange={handleAlbumCoverUpload}
                        className="block w-full text-xs text-muted file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-600 file:text-white hover:file:bg-brand-700 cursor-pointer"
                      />
                    </div>
                    <div>
                      <input
                        type="url"
                        placeholder="Or paste direct cover image URL"
                        value={newAlbum.coverImage}
                        onChange={(e) => setNewAlbum({ ...newAlbum, coverImage: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg border border-brand-200 text-xs focus:ring-2 focus:ring-brand-500 bg-white"
                      />
                    </div>
                  </div>

                  {newAlbum.coverImage && (
                    <div className="flex items-center gap-2 pt-1">
                      <img
                        src={newAlbum.coverImage}
                        alt="Album Cover Preview"
                        className="w-14 h-14 object-cover rounded-lg border border-brand-200"
                      />
                      <div className="text-xs">
                        <span className="font-semibold text-emerald-700 block">✓ Cover Selected</span>
                        <button
                          type="button"
                          onClick={() => setNewAlbum({ ...newAlbum, coverImage: "" })}
                          className="text-rose-600 hover:underline font-medium text-[11px]"
                        >
                          ✕ Remove Cover
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Album Photos Section */}
                <div className="p-3 bg-white rounded-xl border border-brand-200/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-ink">
                      2. Album Photos ({albumPhotosList.length})
                    </label>
                    {albumPhotosList.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setAlbumPhotosList([])}
                        className="text-[11px] text-rose-600 hover:underline font-semibold"
                      >
                        Clear Uploaded ({albumPhotosList.length})
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-muted mb-1">Choose Files from Device</label>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        disabled={uploadingAlbumPhotos}
                        onChange={handleAlbumPhotosUpload}
                        className="block w-full text-xs text-muted file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-600 file:text-white hover:file:bg-brand-700 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-muted mb-1">Or Paste Direct URLs (comma separated)</label>
                      <input
                        type="text"
                        placeholder="https://.../img1.jpg, https://.../img2.jpg"
                        value={newAlbum.imagesText}
                        onChange={(e) => setNewAlbum({ ...newAlbum, imagesText: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg border border-brand-200 text-xs focus:ring-2 focus:ring-brand-500 bg-white"
                      />
                    </div>
                  </div>

                  {albumPhotosList.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1 max-h-36 overflow-y-auto p-1 bg-brand-50/50 rounded-lg border border-brand-100">
                      {albumPhotosList.map((photoUrl, pIdx) => (
                        <div key={pIdx} className="relative aspect-square rounded-md overflow-hidden border border-brand-200 group">
                          <img src={photoUrl} alt={`Album photo ${pIdx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveAlbumDraftPhoto(pIdx)}
                            className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">External Gallery Link (Optional)</label>
                    <input
                      type="url"
                      placeholder="e.g. Google Drive, WedMeGood, or Web Link"
                      value={newAlbum.link}
                      onChange={(e) => setNewAlbum({ ...newAlbum, link: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-brand-200 text-xs focus:ring-2 focus:ring-brand-500 bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleAddAlbum}
                    className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 cursor-pointer shadow-xs"
                  >
                    + Add Album to Portfolio
                  </button>
                </div>
              </div>

              {/* Albums List */}
              {form.albums.length === 0 ? (
                <div className="py-8 border border-dashed border-brand-200 rounded-xl text-center text-muted text-xs">
                  No sample albums added yet. Use the form above to add an album.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {form.albums.map((alb, aIdx) => (
                    <div
                      key={aIdx}
                      className="p-3.5 rounded-xl border border-brand-100 bg-white shadow-xs flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {alb.coverImage ? (
                          <img
                            src={alb.coverImage}
                            alt={alb.title}
                            className="w-16 h-16 rounded-lg object-cover shrink-0 border border-brand-100"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-xl shrink-0">
                            📖
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs sm:text-sm text-ink truncate">{alb.title}</h4>
                          {alb.description && <p className="text-[11px] text-muted truncate">{alb.description}</p>}
                          <span className="text-[10px] text-brand-600 font-semibold block mt-1">
                            {alb.images?.length || 0} Photos Included
                          </span>
                          {Array.isArray(alb.images) && alb.images.length > 0 && (
                            <div className="flex items-center gap-1 mt-1.5 overflow-hidden">
                              {alb.images.slice(0, 4).map((img, iIdx) => (
                                <img key={iIdx} src={img} alt="" className="w-6 h-6 rounded object-cover border border-brand-100" />
                              ))}
                              {alb.images.length > 4 && (
                                <span className="text-[10px] text-muted px-1 font-medium">+{alb.images.length - 4}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAlbum(aIdx)}
                        className="text-muted hover:text-rose-600 font-bold text-xs p-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: VIDEOS */}
          {activeTab === "videos" && (
            <div className="space-y-4">
              <div className="p-3 bg-brand-50 rounded-xl border border-brand-100 text-xs text-brand-800">
                🎥 <b>Showcase Videos & Wedding Films:</b> Add YouTube trailers, Instagram reels, or cloud video links.
              </div>

              {/* Add Video Form */}
              <div className="p-4 bg-brand-50/50 rounded-xl border border-brand-100 space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-ink">+ Add Showcase Video</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Video Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Cinematic Wedding Teaser 4K"
                      value={newVideo.title}
                      onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-brand-200 text-xs focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Video URL *</label>
                    <input
                      type="url"
                      placeholder="https://youtube.com/watch?v=... or MP4 link"
                      value={newVideo.url}
                      onChange={(e) => setNewVideo({ ...newVideo, url: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-brand-200 text-xs focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleAddVideo}
                    className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 cursor-pointer shadow-xs"
                  >
                    + Add Video Link
                  </button>
                </div>
              </div>

              {/* Videos List */}
              {form.videos.length === 0 ? (
                <div className="py-8 border border-dashed border-brand-200 rounded-xl text-center text-muted text-xs">
                  No showcase videos added yet. Paste YouTube/Vimeo/Drive links above.
                </div>
              ) : (
                <div className="space-y-2">
                  {form.videos.map((vid, vIdx) => (
                    <div
                      key={vIdx}
                      className="p-3 rounded-xl border border-brand-100 bg-white shadow-xs flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                          ▶
                        </span>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-ink truncate">{vid.title}</h4>
                          <a
                            href={vid.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-muted hover:text-brand-600 truncate block"
                          >
                            {vid.url}
                          </a>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveVideo(vIdx)}
                        className="text-muted hover:text-rose-600 font-bold text-xs p-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: ABOUT SECTION */}
          {activeTab === "about" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
                  About Section (Short Summary / Bio) *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Award-winning wedding photography studio specializing in candid bridal portraits, cinematic sangeet teasers, and royal pre-wedding shoots with 7+ years of experience."
                  value={form.about}
                  onChange={(e) => setForm({ ...form, about: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
                  Detailed Service Description
                </label>
                <textarea
                  rows={6}
                  placeholder="Describe photography philosophy, team size, cameras and cinema lenses used (e.g. Sony FX3 / A7IV, G-Master lenses, DJI Ronin gimbals, Mavic 3 Pro drones), editing turnaround time, album delivery timeline, and travel availability across Bihar & India."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-brand-100">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Customer Rating (0-5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={form.rating}
                    onChange={(e) => setForm({ ...form, rating: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-brand-200 text-xs focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Reviews Count</label>
                  <input
                    type="number"
                    min="0"
                    value={form.reviewsCount}
                    onChange={(e) => setForm({ ...form, reviewsCount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-brand-200 text-xs focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer Action Bar */}
          <div className="pt-4 border-t border-brand-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
              {activeTab !== "basic" && (
                <button
                  type="button"
                  onClick={() => {
                    const idx = tabs.findIndex((t) => t.id === activeTab);
                    if (idx > 0) setActiveTab(tabs[idx - 1].id);
                  }}
                  className="px-3 py-2 text-xs font-semibold text-ink bg-white border border-brand-200 rounded-xl hover:bg-brand-50 cursor-pointer"
                >
                  ← Previous
                </button>
              )}
              {activeTab !== "about" && (
                <button
                  type="button"
                  onClick={() => {
                    const idx = tabs.findIndex((t) => t.id === activeTab);
                    if (idx < tabs.length - 1) setActiveTab(tabs[idx + 1].id);
                  }}
                  className="px-3 py-2 text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200 rounded-xl hover:bg-brand-100 ml-auto sm:ml-0 cursor-pointer"
                >
                  Next →
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:text-ink border border-line hover:border-brand-200 text-center cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-600/20 disabled:opacity-60 cursor-pointer transition-all text-center"
              >
                {submitting ? "Saving..." : initialData ? "Save Changes" : "Save Listing"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
