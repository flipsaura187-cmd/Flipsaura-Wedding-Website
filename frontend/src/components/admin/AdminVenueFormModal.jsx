"use client";
import { useState, useEffect } from "react";
import api from "@/api/axios";
import { uploadFile } from "@/lib/uploadHelper";

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

export const VENUE_FACILITY_GROUPS = [
  {
    group: "CATERING & FOOD",
    items: [
      "In-House Catering Available",
      "Outside Catering Allowed",
      "Pure Vegetarian Menu Available",
      "Live Food Counters Permitted",
    ],
  },
  {
    group: "DECORATION & THEMES",
    items: [
      "In-House Decorators Provided",
      "Outside Decorators Allowed",
      "Stage & Mandap Setup Included",
    ],
  },
  {
    group: "MUSIC & ENTERTAINMENT",
    items: [
      "DJ & Sound System Allowed",
      "Late Night Music Permitted",
      "Live Orchestra / Band Space",
    ],
  },
  {
    group: "COMFORT & AMENITIES",
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
    group: "RITUALS & POLICIES",
    items: [
      "Hawan & Fire Rituals Permitted",
      "Baraat Allowed with Band",
      "Firecrackers Permitted",
      "Overnight Wedding Allowed",
      "Alcohol License Allowed",
    ],
  },
];

export const ESSENTIAL_VENUE_AMENITIES = [
  { id: "Central Air Conditioning (AC)", label: "Central AC", icon: "❄️" },
  { id: "24/7 Power Backup Generator", label: "24/7 Power Backup", icon: "⚡" },
  { id: "In-House Catering Available", label: "In-House Catering", icon: "🍽️" },
  { id: "Outside Catering Allowed", label: "Outside Catering Allowed", icon: "🍲" },
  { id: "Bridal Dressing Room Available", label: "Bridal Dressing Room", icon: "👰" },
  { id: "Valet Parking Available", label: "Valet / Ample Parking", icon: "🚗" },
  { id: "DJ & Sound System Allowed", label: "DJ & Music Allowed", icon: "🎵" },
  { id: "Baraat Allowed with Band", label: "Baraat with Band Allowed", icon: "🥁" },
  { id: "Hawan & Fire Rituals Permitted", label: "Hawan & Rituals Allowed", icon: "🔥" },
  { id: "Complimentary Guest Rooms", label: "Guest Stay Rooms", icon: "🛏️" },
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

export const getDefaultsForCategory = (catId) => {
  switch (catId) {
    case "Marriage Garden / Lawns":
      return {
        title: "",
        guestCapacity: "",
        seatingCapacity: "",
        floatingCapacity: "",
        roomCount: "",
        rentalPrice: "",
        pricePerPlateVeg: "",
        pricePerPlateNonVeg: "",
        vegMenu: [],
        nonVegMenu: [],
        vegMenuDescription: "",
        nonVegMenuDescription: "",
        spaceTypes: ["Outdoor"],
        spaceAreas: {
          Outdoor: { name: "Royal Wedding Lawn", seating: "", floating: "" },
        },
        venueFeatures: [
          "24/7 Power Backup Generator",
          "Hawan & Fire Rituals Permitted",
          "Baraat Allowed with Band",
          "Valet Parking Available",
          "Outside Catering Allowed",
          "In-House Catering Available",
          "Bridal Dressing Room Available",
          "DJ & Sound System Allowed",
        ],
        about: "",
        description: "",
        images: [],
        videos: [],
      };

    case "Wedding Resorts":
      return {
        title: "",
        guestCapacity: "",
        seatingCapacity: "",
        floatingCapacity: "",
        roomCount: "12",
        rentalPrice: "",
        pricePerPlateVeg: "",
        pricePerPlateNonVeg: "",
        vegMenu: [],
        nonVegMenu: [],
        vegMenuDescription: "",
        nonVegMenuDescription: "",
        spaceTypes: ["Outdoor", "Indoor", "Poolside"],
        spaceAreas: {
          Outdoor: { name: "Resort Central Lawn", seating: "", floating: "" },
          Indoor: { name: "Royal Banquet Ballroom", seating: "", floating: "" },
          Poolside: { name: "Poolside Deck & Lawn", seating: "", floating: "" },
        },
        venueFeatures: [
          "Complimentary Guest Rooms",
          "Central Air Conditioning (AC)",
          "24/7 Power Backup Generator",
          "Valet Parking Available",
          "In-House Catering Available",
          "Outside Catering Allowed",
          "Bridal Dressing Room Available",
          "Baraat Allowed with Band",
          "DJ & Sound System Allowed",
        ],
        about: "",
        description: "",
        images: [],
        videos: [],
      };

    case "Small Function / Party Halls":
      return {
        title: "",
        guestCapacity: "",
        seatingCapacity: "",
        floatingCapacity: "",
        roomCount: "",
        rentalPrice: "",
        pricePerPlateVeg: "",
        pricePerPlateNonVeg: "",
        vegMenu: [],
        nonVegMenu: [],
        vegMenuDescription: "",
        nonVegMenuDescription: "",
        spaceTypes: ["Indoor"],
        spaceAreas: {
          Indoor: { name: "Celebration Party Hall", seating: "", floating: "" },
        },
        venueFeatures: [
          "Central Air Conditioning (AC)",
          "24/7 Power Backup Generator",
          "DJ & Sound System Allowed",
          "In-House Catering Available",
          "Outside Catering Allowed",
          "Valet Parking Available",
        ],
        about: "",
        description: "",
        images: [],
        videos: [],
      };

    case "Banquet Halls":
    default:
      return {
        title: "",
        guestCapacity: "",
        seatingCapacity: "",
        floatingCapacity: "",
        roomCount: "",
        rentalPrice: "",
        pricePerPlateVeg: "",
        pricePerPlateNonVeg: "",
        vegMenu: [],
        nonVegMenu: [],
        vegMenuDescription: "",
        nonVegMenuDescription: "",
        spaceTypes: ["Indoor"],
        spaceAreas: {
          Indoor: { name: "Main AC Banquet Hall", seating: "", floating: "" },
        },
        venueFeatures: [
          "Central Air Conditioning (AC)",
          "24/7 Power Backup Generator",
          "Bridal Dressing Room Available",
          "In-House Catering Available",
          "Outside Catering Allowed",
          "Valet Parking Available",
          "DJ & Sound System Allowed",
          "Baraat Allowed with Band",
        ],
        about: "",
        description: "",
        images: [],
        videos: [],
      };
  }
};

export default function AdminVenueFormModal({
  isOpen,
  onClose,
  onSaved,
  initialData = null,
  isVendor = false,
  initialCategory = null,
}) {
  const isEdit = Boolean(initialData?._id);

  // Common shared details across the venue property
  const [commonInfo, setCommonInfo] = useState({
    ownerName: "",
    contactPhone: "",
    contactEmail: "",
    address: "",
    locality: "",
    city: "Daudnagar",
    state: "Bihar",
    pincode: "",
    active: true,
    featured: false,
    sourceUrl: "",
  });

  // Active subcategory tab currently being edited
  const [activeCategoryTab, setActiveCategoryTab] = useState(() => {
    return initialCategory || initialData?.venueType || "Banquet Halls";
  });

  // Track which subcategories have already been saved to the database in this session
  // Format: { "Banquet Halls": "venueId_123", ... }
  const [savedCategoryMap, setSavedCategoryMap] = useState({});

  // Per-category form data
  const [categoryForms, setCategoryForms] = useState(() => {
    const initial = {};
    VENUE_PRIMARY_CATEGORIES.forEach((cat) => {
      initial[cat.id] = getDefaultsForCategory(cat.id);
    });
    return initial;
  });

  const [customFeature, setCustomFeature] = useState("");
  const [customSpaceName, setCustomSpaceName] = useState("");
  const [directImageUrl, setDirectImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newVideoTitle, setNewVideoTitle] = useState("");

  const handleAddVideo = () => {
    const url = newVideoUrl.trim();
    if (!url) return;
    updateActiveCategory((prev) => ({
      ...prev,
      videos: [
        ...(Array.isArray(prev.videos) ? prev.videos : []),
        {
          title: newVideoTitle.trim() || `${activeCategoryTab} Video Tour`,
          url,
        },
      ],
    }));
    setNewVideoUrl("");
    setNewVideoTitle("");
  };

  const handleRemoveVideo = (idx) => {
    updateActiveCategory((prev) => ({
      ...prev,
      videos: (Array.isArray(prev.videos) ? prev.videos : []).filter((_, i) => i !== idx),
    }));
  };

  const [vegItemInput, setVegItemInput] = useState("");
  const [nonVegItemInput, setNonVegItemInput] = useState("");

  const handleAddVegItem = () => {
    const raw = vegItemInput.trim();
    if (!raw) return;
    const items = raw.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
    if (!items.length) return;
    updateActiveCategory((prev) => ({
      ...prev,
      vegMenu: [...(Array.isArray(prev.vegMenu) ? prev.vegMenu : []), ...items],
    }));
    setVegItemInput("");
  };

  const handleRemoveVegItem = (idx) => {
    updateActiveCategory((prev) => ({
      ...prev,
      vegMenu: (Array.isArray(prev.vegMenu) ? prev.vegMenu : []).filter((_, i) => i !== idx),
    }));
  };

  const handleAddNonVegItem = () => {
    const raw = nonVegItemInput.trim();
    if (!raw) return;
    const items = raw.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
    if (!items.length) return;
    updateActiveCategory((prev) => ({
      ...prev,
      nonVegMenu: [...(Array.isArray(prev.nonVegMenu) ? prev.nonVegMenu : []), ...items],
    }));
    setNonVegItemInput("");
  };

  const handleRemoveNonVegItem = (idx) => {
    updateActiveCategory((prev) => ({
      ...prev,
      nonVegMenu: (Array.isArray(prev.nonVegMenu) ? prev.nonVegMenu : []).filter((_, i) => i !== idx),
    }));
  };

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    setSuccessMsg("");

    if (initialData) {
      const vType = initialData.venueType || initialCategory || "Banquet Halls";
      setActiveCategoryTab(vType);
      setSavedCategoryMap({ [vType]: initialData._id });

      setCommonInfo({
        ownerName: initialData.vendor?.vendorProfile?.ownerName || initialData.vendor?.name || initialData.ownerName || "",
        contactPhone: initialData.contactPhone || initialData.vendor?.phone || "",
        contactEmail: initialData.contactEmail || initialData.vendor?.email || "",
        address: initialData.vendor?.vendorProfile?.address || initialData.address || "",
        locality: initialData.locality || "",
        city: initialData.city || initialData.vendor?.vendorProfile?.city || "Daudnagar",
        state: initialData.state || initialData.vendor?.vendorProfile?.state || "Bihar",
        pincode: initialData.vendor?.vendorProfile?.pincode || initialData.pincode || "",
        active: initialData.active !== undefined ? initialData.active : true,
        featured: Boolean(initialData.featured),
        sourceUrl: initialData.sourceUrl || "",
      });

      setCategoryForms((prev) => ({
        ...prev,
        [vType]: {
          title: initialData.title || "",
          guestCapacity: initialData.guestCapacity || initialData.capacity || "",
          seatingCapacity: initialData.seatingCapacity || "",
          floatingCapacity: initialData.floatingCapacity || "",
          roomCount: initialData.roomCount || "",
          rentalPrice: initialData.rentalPrice || initialData.price || "",
          pricePerPlateVeg: initialData.pricePerPlateVeg || "",
          pricePerPlateNonVeg: initialData.pricePerPlateNonVeg || "",
          vegMenu: Array.isArray(initialData.vegMenu) ? initialData.vegMenu : [],
          nonVegMenu: Array.isArray(initialData.nonVegMenu) ? initialData.nonVegMenu : [],
          vegMenuDescription: initialData.vegMenuDescription || "",
          nonVegMenuDescription: initialData.nonVegMenuDescription || "",
          spaceTypes: Array.isArray(initialData.spaceTypes) && initialData.spaceTypes.length > 0
            ? initialData.spaceTypes
            : [vType === "Marriage Garden / Lawns" ? "Outdoor" : "Indoor"],
          spaceAreas: (initialData.spaceAreas && typeof initialData.spaceAreas === "object")
            ? initialData.spaceAreas
            : {},
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
          videos: Array.isArray(initialData.videos) ? initialData.videos : [],
        },
      }));
    } else {
      const targetCat = initialCategory || "Banquet Halls";
      setActiveCategoryTab(targetCat);
      setSavedCategoryMap({});

      const initialForms = {};
      VENUE_PRIMARY_CATEGORIES.forEach((cat) => {
        initialForms[cat.id] = getDefaultsForCategory(cat.id);
      });
      setCategoryForms(initialForms);

      setCommonInfo({
        ownerName: "",
        contactPhone: "",
        contactEmail: "",
        address: "",
        locality: "",
        city: "Daudnagar",
        state: "Bihar",
        pincode: "",
        active: true,
        featured: false,
        sourceUrl: "",
      });
    }
  }, [isOpen, initialData, initialCategory]);

  if (!isOpen) return null;

  // Active form data for the currently selected subcategory tab
  const activeForm = categoryForms[activeCategoryTab] || getDefaultsForCategory(activeCategoryTab);
  const savedCategoryIds = Object.keys(savedCategoryMap);
  const isCurrentSaved = Boolean(savedCategoryMap[activeCategoryTab]);

  // Find next available subcategory that has not been saved yet
  const nextAvailableCategory = VENUE_PRIMARY_CATEGORIES.find(
    (c) => c.id !== activeCategoryTab && !savedCategoryMap[c.id]
  )?.id;

  // Helper to update active subcategory data
  const updateActiveCategory = (updater) => {
    setCategoryForms((prev) => {
      const current = prev[activeCategoryTab] || getDefaultsForCategory(activeCategoryTab);
      const updated = typeof updater === "function" ? updater(current) : { ...current, ...updater };
      return {
        ...prev,
        [activeCategoryTab]: updated,
      };
    });
  };

  const handleCommonChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCommonInfo((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleActiveFieldChange = (e) => {
    const { name, value, type, checked } = e.target;
    updateActiveCategory((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSelectCategoryTab = (catId) => {
    setActiveCategoryTab(catId);
    setError("");
  };

  const handleSpaceToggle = (spaceId) => {
    updateActiveCategory((prev) => {
      const exists = prev.spaceTypes.includes(spaceId);
      const next = exists
        ? prev.spaceTypes.filter((s) => s !== spaceId)
        : [...prev.spaceTypes, spaceId];
      const newAreas = { ...prev.spaceAreas };
      if (exists) {
        delete newAreas[spaceId];
      } else if (!newAreas[spaceId]) {
        const defaultName =
          spaceId === "Indoor"
            ? "Main AC Banquet Hall"
            : spaceId === "Outdoor"
            ? "Royal Wedding Lawn"
            : spaceId === "Poolside"
            ? "Poolside Deck"
            : spaceId === "Terrace"
            ? "Rooftop Terrace"
            : `${spaceId} Area`;
        newAreas[spaceId] = { name: defaultName, seating: "", floating: "" };
      }
      return {
        ...prev,
        spaceTypes: next.length > 0 ? next : ["Indoor"],
        spaceAreas: newAreas,
      };
    });
  };

  const handleSpaceAreaChange = (spaceId, field, value) => {
    updateActiveCategory((prev) => ({
      ...prev,
      spaceAreas: {
        ...prev.spaceAreas,
        [spaceId]: {
          ...(prev.spaceAreas[spaceId] || {}),
          [field]: value,
        },
      },
    }));
  };

  const addCustomSpace = () => {
    const trimmed = customSpaceName.trim();
    if (!trimmed) return;
    updateActiveCategory((prev) => {
      if (prev.spaceTypes.includes(trimmed)) return prev;
      return {
        ...prev,
        spaceTypes: [...prev.spaceTypes, trimmed],
        spaceAreas: {
          ...prev.spaceAreas,
          [trimmed]: { name: trimmed, seating: "", floating: "" },
        },
      };
    });
    setCustomSpaceName("");
  };

  const removeSpace = (spId) => {
    updateActiveCategory((prev) => {
      const next = prev.spaceTypes.filter((s) => s !== spId);
      const newAreas = { ...prev.spaceAreas };
      delete newAreas[spId];
      return {
        ...prev,
        spaceTypes: next.length > 0 ? next : ["Indoor"],
        spaceAreas: newAreas,
      };
    });
  };

  const handleFeatureToggle = (feature) => {
    updateActiveCategory((prev) => {
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
    updateActiveCategory((prev) => {
      if (prev.venueFeatures.includes(trimmed)) return prev;
      return {
        ...prev,
        venueFeatures: [...prev.venueFeatures, trimmed],
      };
    });
    setCustomFeature("");
  };

  const removeFeature = (feat) => {
    updateActiveCategory((prev) => ({
      ...prev,
      venueFeatures: prev.venueFeatures.filter((f) => f !== feat),
    }));
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const invalid = files.find((f) => !f.type.startsWith("image/"));
    if (invalid) {
      setError("Please select valid image files (JPG, PNG, WebP).");
      return;
    }

    const oversize = files.find((f) => f.size > 10 * 1024 * 1024);
    if (oversize) {
      setError("One or more images exceed the 10MB limit.");
      return;
    }

    setUploadingImage(true);
    setUploadProgress(`Uploading 1 of ${files.length}...`);
    setError("");

    try {
      const uploadedUrls = [];
      for (let i = 0; i < files.length; i++) {
        setUploadProgress(`Uploading ${i + 1} of ${files.length}...`);
        const file = files[i];
        const url = await uploadFile(file, "flipsaura/venues");
        if (url) uploadedUrls.push(url);
      }

      updateActiveCategory((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));
    } catch (err) {
      console.error("Multiple image upload error:", err);
      setError(err.response?.data?.error || err.message || "Failed to upload one or more images");
    } finally {
      setUploadingImage(false);
      setUploadProgress("");
      e.target.value = "";
    }
  };

  const addDirectImage = () => {
    const raw = directImageUrl.trim();
    if (!raw) return;

    const splitUrls = raw
      .split(/[\s,\n]+/)
      .map((u) => u.trim())
      .filter((u) => u.startsWith("http://") || u.startsWith("https://") || u.startsWith("/"));

    if (splitUrls.length === 0) {
      setError("Please enter valid URL(s) starting with http://, https://, or /");
      return;
    }

    updateActiveCategory((prev) => {
      const nextImages = [...prev.images];
      splitUrls.forEach((u) => {
        if (!nextImages.includes(u)) nextImages.push(u);
      });
      return { ...prev, images: nextImages };
    });
    setDirectImageUrl("");
  };

  const removeImage = (idx) => {
    updateActiveCategory((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
    }));
  };

  const handleCopyPhotosAndFeaturesToAll = () => {
    const curImages = activeForm.images;
    const curFeatures = activeForm.venueFeatures;
    setCategoryForms((prev) => {
      const next = { ...prev };
      VENUE_PRIMARY_CATEGORIES.forEach((cat) => {
        if (cat.id !== activeCategoryTab) {
          next[cat.id] = {
            ...next[cat.id],
            images: curImages.length > 0 ? [...curImages] : next[cat.id].images,
            venueFeatures: curFeatures.length > 0 ? [...curFeatures] : next[cat.id].venueFeatures,
          };
        }
      });
      return next;
    });
    setSuccessMsg(`✓ Copied photos & amenities from ${activeCategoryTab} to all other venue categories!`);
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  // Save the currently active category listing
  // addAnother = true: save this category and smoothly advance to next available category
  // addAnother = false: save this category and finish/close
  const handleSaveCurrent = async (addAnother = false) => {
    setError("");
    setSuccessMsg("");

    if (!commonInfo.city.trim()) {
      setError("City / District is required.");
      return;
    }

    if (!activeForm.title?.trim()) {
      setError(`Please enter a Listing / Venue Name for ${activeCategoryTab}.`);
      return;
    }

    setSubmitting(true);
    const endpoint = isVendor ? `/api/vendor/venues` : `/api/admin/venues`;
    const catId = activeCategoryTab;
    const catData = activeForm;

    const payload = {
      title: catData.title.trim(),
      venueType: catId,
      venueTypes: [catId],
      ownerName: commonInfo.ownerName.trim(),
      contactPhone: commonInfo.contactPhone.trim(),
      contactEmail: commonInfo.contactEmail.trim(),
      address: commonInfo.address.trim(),
      locality: commonInfo.locality.trim(),
      city: commonInfo.city.trim(),
      state: commonInfo.state.trim() || "Bihar",
      pincode: commonInfo.pincode.trim(),
      guestCapacity: Number(catData.guestCapacity) || 0,
      seatingCapacity: Number(catData.seatingCapacity) || 0,
      floatingCapacity: Number(catData.floatingCapacity) || 0,
      roomCount: Number(catData.roomCount) || 0,
      rentalPrice: Number(catData.rentalPrice) || 0,
      pricePerPlateVeg: Number(catData.pricePerPlateVeg) || 0,
      pricePerPlateNonVeg: Number(catData.pricePerPlateNonVeg) || 0,
      vegMenu: Array.isArray(catData.vegMenu) ? catData.vegMenu : [],
      nonVegMenu: Array.isArray(catData.nonVegMenu) ? catData.nonVegMenu : [],
      vegMenuDescription: catData.vegMenuDescription || "",
      nonVegMenuDescription: catData.nonVegMenuDescription || "",
      spaceTypes: catData.spaceTypes,
      spaceAreas: catData.spaceAreas,
      venueFeatures: catData.venueFeatures,
      about: catData.about.trim(),
      description: catData.description.trim() || catData.about.trim(),
      images: catData.images.length > 0 ? catData.images : ["/images/categories/venues.jpg"],
      videos: Array.isArray(catData.videos) ? catData.videos : [],
      rating: initialData?.rating || 0,
      reviewsCount: initialData?.reviewsCount || 0,
      active: Boolean(commonInfo.active),
      featured: Boolean(commonInfo.featured),
      sourceUrl: commonInfo.sourceUrl.trim(),
    };

    try {
      const existingSavedId = isEdit ? initialData._id : savedCategoryMap[catId];
      let res;
      if (existingSavedId) {
        // Update already saved listing
        res = await api.put(`${endpoint}/${existingSavedId}`, payload);
      } else {
        // Create new listing
        res = await api.post(endpoint, payload);
      }

      if (res.data?.ok) {
        const savedVenue = res.data.data?.venue;
        const newVenueId = savedVenue?._id || existingSavedId;

        // Mark this category as saved in database
        setSavedCategoryMap((prev) => ({
          ...prev,
          [catId]: newVenueId,
        }));

        if (onSaved) onSaved(savedVenue);

        if (addAnother && nextAvailableCategory) {
          setSuccessMsg(`✓ ${catId} saved & published successfully! Now choose/fill ${nextAvailableCategory} below.`);
          setActiveCategoryTab(nextAvailableCategory);
          // Scroll to top of modal smoothly
          const modalBody = document.getElementById("venue-form-scrollable-body");
          if (modalBody) modalBody.scrollTo({ top: 0, behavior: "smooth" });
          setTimeout(() => setSuccessMsg(""), 4500);
        } else {
          setSuccessMsg(`✓ ${catId} saved & published successfully!`);
          setTimeout(() => {
            onClose();
          }, 800);
        }
      } else {
        throw new Error(res.data?.error || `Failed to save ${catId}`);
      }
    } catch (err) {
      console.error("Save venue error:", err);
      setError(err.response?.data?.error || err.message || `Failed to save ${catId}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinish = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-7xl bg-white rounded-3xl shadow-2xl border border-brand-100 flex flex-col max-h-[95vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 bg-gradient-to-r from-brand-600 to-brand-700 text-white shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">
                {activeCategoryTab === "Marriage Garden / Lawns"
                  ? "🌿"
                  : activeCategoryTab === "Wedding Resorts"
                  ? "🏰"
                  : activeCategoryTab === "Small Function / Party Halls"
                  ? "🎉"
                  : "🏛️"}
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight">
                {isEdit
                  ? `Edit ${activeCategoryTab}`
                  : `Add ${activeCategoryTab}`}
              </h2>
            </div>
            <p className="text-xs text-brand-100 mt-0.5">
              Fill details for each venue subcategory, click <strong>"Save & Add Another"</strong> to publish it and move to the next. Add as many venues as you offer!
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
        <form
          id="venue-form-scrollable-body"
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveCurrent(false);
          }}
          className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6"
        >
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-semibold flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-2xs">
              <span className="text-base">✓</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* STEP 1: Venue Subcategories Selector & Progress */}
          <div className="bg-brand-50/50 p-4 sm:p-5 rounded-2xl border border-brand-100/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
              <label className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                <span>Step 1: Choose Venue Subcategory to Configure</span>
                <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {savedCategoryIds.length > 0 && (
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 shadow-2xs">
                    ✓ {savedCategoryIds.length} Saved in Database
                  </span>
                )}
                <span className="text-[11px] font-semibold text-brand-700 bg-brand-100/80 px-2.5 py-0.5 rounded-full border border-brand-200">
                  Currently Editing: {activeCategoryTab}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted mb-3">
              Jo jo category details aap bharte jaayenge, use <strong>"Save & Add Another"</strong> karke save karein aur agla subcategory choose karein.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {VENUE_PRIMARY_CATEGORIES.map((cat) => {
                const isCurrentActive = activeCategoryTab === cat.id;
                const isSaved = Boolean(savedCategoryMap[cat.id]);

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectCategoryTab(cat.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                      isCurrentActive
                        ? "bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-600/20 scale-[1.01]"
                        : isSaved
                        ? "bg-emerald-50 text-emerald-950 border-emerald-300 hover:border-emerald-500 hover:bg-emerald-100/60"
                        : "bg-white text-ink border-brand-200 hover:border-brand-400 hover:bg-brand-50/50"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="text-2xl">{cat.icon}</div>
                        <div
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition ${
                            isCurrentActive
                              ? "bg-white/25 text-white"
                              : isSaved
                              ? "bg-emerald-200 text-emerald-800"
                              : "bg-brand-100/70 text-brand-700"
                          }`}
                        >
                          {isSaved ? "✓ Saved" : isCurrentActive ? "Active" : "+ Select"}
                        </div>
                      </div>
                      <div className={`font-bold text-sm ${isCurrentActive ? "text-white" : "text-ink"}`}>
                        {cat.label}
                      </div>
                      <p className={`text-[11px] mt-1 leading-snug ${isCurrentActive ? "text-brand-100" : "text-muted"}`}>
                        {cat.desc}
                      </p>
                    </div>

                    <div className="mt-2.5 text-[10px] font-bold">
                      {isSaved ? (
                        <span className={isCurrentActive ? "text-white" : "text-emerald-700"}>
                          ✓ Saved & Live (Click to edit)
                        </span>
                      ) : isCurrentActive ? (
                        <span className="text-white">Editing Form Below ↓</span>
                      ) : (
                        <span className="text-brand-600">Click to fill details →</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: Basic Property Location & Contact Information (Shared across property) */}
          <div className="space-y-4">
            <h3 className="font-serif font-bold text-base text-ink border-b border-brand-100 pb-2 flex items-center gap-2">
              <span>📍</span> Property Location & Contact Details (Shared for all venues)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  City / District <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    className="w-1/2 px-3 py-2.5 rounded-xl border border-brand-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                    value={COMMON_CITIES.includes(commonInfo.city) ? commonInfo.city : "Other"}
                    onChange={(e) => {
                      if (e.target.value !== "Other") {
                        setCommonInfo((prev) => ({ ...prev, city: e.target.value }));
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
                    value={commonInfo.city}
                    onChange={handleCommonChange}
                    placeholder="Enter city"
                    required
                    className="w-1/2 px-3 py-2.5 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Locality / Area / Landmark
                </label>
                <input
                  type="text"
                  name="locality"
                  value={commonInfo.locality}
                  onChange={handleCommonChange}
                  placeholder="e.g. Near Bus Stand, Old GT Road, Kankarbagh"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Full Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={commonInfo.address}
                  onChange={handleCommonChange}
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
                  value={commonInfo.contactPhone}
                  onChange={handleCommonChange}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Owner / Manager Name & Email
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    name="ownerName"
                    value={commonInfo.ownerName}
                    onChange={handleCommonChange}
                    placeholder="Owner / Manager"
                    className="w-full px-3 py-2.5 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                  />
                  <input
                    type="email"
                    name="contactEmail"
                    value={commonInfo.contactEmail}
                    onChange={handleCommonChange}
                    placeholder="Email address"
                    className="w-full px-3 py-2.5 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* STEP 3: Subcategory-Specific Details (Dedicated for Active Tab) */}
          <div className="bg-brand-50/20 p-4 sm:p-5 rounded-2xl border border-brand-200 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-brand-200 pb-2.5 gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">
                  {activeCategoryTab === "Marriage Garden / Lawns"
                    ? "🌿"
                    : activeCategoryTab === "Wedding Resorts"
                    ? "🏰"
                    : activeCategoryTab === "Small Function / Party Halls"
                    ? "🎉"
                    : "🏛️"}
                </span>
                <h3 className="font-serif font-bold text-base text-ink">
                  Specific Details for {activeCategoryTab}
                </h3>
                {isCurrentSaved && (
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                    ✓ Saved
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleCopyPhotosAndFeaturesToAll}
                className="text-[11px] font-semibold text-brand-700 hover:text-brand-900 bg-brand-100/60 hover:bg-brand-100 px-3 py-1 rounded-lg border border-brand-200 transition cursor-pointer self-start sm:self-auto"
              >
                📋 Copy Photos & Amenities to Other Categories
              </button>
            </div>

            {/* Venue / Subcategory Name */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Listing / Venue Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={activeForm.title}
                onChange={handleActiveFieldChange}
                placeholder={
                  activeCategoryTab === "Marriage Garden / Lawns"
                    ? "e.g. Shagun Vatika & Marriage Garden"
                    : activeCategoryTab === "Wedding Resorts"
                    ? "e.g. Heritage Luxury Wedding Resort & Spa"
                    : activeCategoryTab === "Small Function / Party Halls"
                    ? "e.g. Utsav Party Hall & Celebrations"
                    : "e.g. Royal Grand Palace Banquet Hall"
                }
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm bg-white"
              />
            </div>

            {/* Capacities & Rooms */}
            <div className="space-y-4 bg-white p-4 sm:p-5 rounded-2xl border border-brand-100">
              <h4 className="font-serif font-bold text-sm text-ink border-b border-brand-100 pb-2 flex items-center gap-2">
                <span>👥</span> Guest Capacity & Rooms for {activeCategoryTab}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Total Guest Capacity
                  </label>
                  <input
                    type="number"
                    min="0"
                    name="guestCapacity"
                    value={activeForm.guestCapacity}
                    onChange={handleActiveFieldChange}
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
                    value={activeForm.seatingCapacity}
                    onChange={handleActiveFieldChange}
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
                    value={activeForm.floatingCapacity}
                    onChange={handleActiveFieldChange}
                    placeholder="e.g. 700"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm"
                  />
                  <span className="text-[10px] text-muted">Floating guests peak</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    {activeCategoryTab === "Wedding Resorts" ? (
                      <span className="text-brand-700 font-bold">Guest Stay Rooms / Cottages *</span>
                    ) : (
                      <span>Guest / Bridal Rooms (Optional)</span>
                    )}
                  </label>
                  <input
                    type="number"
                    min="0"
                    name="roomCount"
                    value={activeForm.roomCount}
                    onChange={handleActiveFieldChange}
                    placeholder={activeCategoryTab === "Wedding Resorts" ? "e.g. 15" : "e.g. 2"}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm"
                  />
                  <span className="text-[10px] text-muted">
                    {activeCategoryTab === "Wedding Resorts"
                      ? "Resort accommodation rooms for destination wedding"
                      : "Bridal green room or guest stay rooms"}
                  </span>
                </div>
              </div>

              {/* Space Types & Areas */}
              <div className="pt-2 space-y-3">
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-2">
                  Space Types Available in {activeCategoryTab}
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {SPACE_OPTIONS.map((sp) => {
                    const active = activeForm.spaceTypes.includes(sp.id);
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

                {/* Per-space area detail inputs */}
                {activeForm.spaceTypes.length > 0 && (
                  <div className="space-y-3 pt-1">
                    <p className="text-[11px] text-muted font-medium">
                      📐 Add area name & capacity for each selected space (shown on customer venue page):
                    </p>
                    {activeForm.spaceTypes.map((spId) => {
                      const spOpt = SPACE_OPTIONS.find((s) => s.id === spId);
                      const area = activeForm.spaceAreas[spId] || {};
                      return (
                        <div
                          key={spId}
                          className="bg-brand-50/30 border border-brand-200 rounded-2xl p-3.5 flex flex-col sm:flex-row gap-3 items-start sm:items-center shadow-2xs"
                        >
                          <div className="flex items-center justify-between sm:justify-start gap-2 shrink-0 w-full sm:w-44">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{spOpt?.icon || "🏛️"}</span>
                              <span className="text-xs font-bold text-ink truncate">{spOpt?.label || spId}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeSpace(spId)}
                              className="sm:hidden text-gray-400 hover:text-rose-600 p-1 text-xs"
                              title="Remove space"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1 w-full">
                            <div>
                              <label className="text-[10px] text-muted font-semibold block mb-1">Area / Hall Name</label>
                              <input
                                type="text"
                                placeholder={
                                  spId === "Indoor"
                                    ? "e.g. Grand AC Banquet Hall"
                                    : spId === "Outdoor"
                                    ? "e.g. Royal Wedding Lawn"
                                    : spId === "Poolside"
                                    ? "e.g. Poolside Lawn & Deck"
                                    : "e.g. Space / Hall Name"
                                }
                                value={area.name || ""}
                                onChange={(e) => handleSpaceAreaChange(spId, "name", e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-brand-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted font-semibold block mb-1">Seating Capacity</label>
                              <input
                                type="number"
                                min="0"
                                placeholder="e.g. 200"
                                value={area.seating || ""}
                                onChange={(e) => handleSpaceAreaChange(spId, "seating", e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-brand-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted font-semibold block mb-1">Floating Capacity</label>
                              <input
                                type="number"
                                min="0"
                                placeholder="e.g. 300"
                                value={area.floating || ""}
                                onChange={(e) => handleSpaceAreaChange(spId, "floating", e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-brand-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeSpace(spId)}
                            className="hidden sm:flex text-gray-300 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer text-xs font-bold shrink-0"
                            title="Remove this space"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add Custom Space */}
                <div className="bg-white p-3 rounded-2xl border border-dashed border-brand-300 flex flex-col sm:flex-row gap-2 items-center">
                  <span className="text-xs font-bold text-ink shrink-0">
                    + Add Custom Hall / Space:
                  </span>
                  <input
                    type="text"
                    value={customSpaceName}
                    onChange={(e) => setCustomSpaceName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomSpace();
                      }
                    }}
                    placeholder="e.g. VIP Dining Lounge, Diamond AC Hall, Poolside Cabana..."
                    className="flex-1 w-full px-3 py-1.5 rounded-xl border border-brand-200 text-xs bg-brand-50/20 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="button"
                    onClick={addCustomSpace}
                    className="w-full sm:w-auto px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition cursor-pointer shrink-0 shadow-xs"
                  >
                    + Add Space
                  </button>
                </div>
              </div>
            </div>

            {/* STEP 4: Pricing for active category */}
            <div className="space-y-4 bg-white p-4 sm:p-5 rounded-2xl border border-brand-100">
              <h4 className="font-serif font-bold text-sm text-ink border-b border-brand-100 pb-2 flex items-center gap-2">
                <span>💰</span> Pricing: Rental Cost & Plate Price for {activeCategoryTab}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200">
                  <label className="block text-xs font-bold text-amber-950 mb-1">
                    {activeCategoryTab === "Marriage Garden / Lawns"
                      ? "Lawn & Ground Rental (₹ / day)"
                      : activeCategoryTab === "Wedding Resorts"
                      ? "Full Resort Booking Tariff (₹ / day)"
                      : activeCategoryTab === "Small Function / Party Halls"
                      ? "Party Hall Rental (₹ / event or day)"
                      : "Banquet Hall Rental (₹ / day)"}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-amber-700">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      name="rentalPrice"
                      value={activeForm.rentalPrice}
                      onChange={handleActiveFieldChange}
                      placeholder="e.g. 75000"
                      className="w-full pl-7 pr-3 py-2 rounded-xl border border-amber-300 bg-white text-ink font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <span className="text-[10px] text-amber-800 mt-1 block">
                    {activeCategoryTab === "Marriage Garden / Lawns"
                      ? "Full lawn & outdoor ground booking cost"
                      : activeCategoryTab === "Wedding Resorts"
                      ? "Complete resort or lawn booking tariff"
                      : activeCategoryTab === "Small Function / Party Halls"
                      ? "Party hall rental booking charge"
                      : "AC hall rental booking charge"}
                  </span>
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
                      value={activeForm.pricePerPlateVeg}
                      onChange={handleActiveFieldChange}
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
                      value={activeForm.pricePerPlateNonVeg}
                      onChange={handleActiveFieldChange}
                      placeholder="e.g. 850"
                      className="w-full pl-7 pr-3 py-2 rounded-xl border border-rose-300 bg-white text-ink font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <span className="text-[10px] text-rose-800 mt-1 block">Non-Veg catering food budget</span>
                </div>
              </div>

              {/* FOOD & CATERING MENU BUILDER (VEG & NON-VEG) */}
              <div className="pt-4 border-t border-brand-100 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <h5 className="text-xs sm:text-sm font-bold text-ink flex items-center gap-1.5 font-serif">
                      <span>🍽️</span> Food & Catering Menu Inclusions
                    </h5>
                    <p className="text-[11px] text-muted">
                      Add items/dishes included in your per plate pricing (e.g. what food is served in ₹{activeForm.pricePerPlateVeg || "600"} Veg or ₹{activeForm.pricePerPlateNonVeg || "850"} Non-Veg).
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* VEG MENU BUILDER */}
                  <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/90 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
                        <span className="text-xs font-bold text-emerald-950">
                          Veg Menu {activeForm.pricePerPlateVeg ? `(Items for ₹${activeForm.pricePerPlateVeg}/plate)` : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {Array.isArray(activeForm.vegMenu) && activeForm.vegMenu.length > 0 && (
                          <button
                            type="button"
                            onClick={() => updateActiveCategory((prev) => ({ ...prev, vegMenu: [] }))}
                            className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                          >
                            Clear all
                          </button>
                        )}
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          {(activeForm.vegMenu || []).length} items
                        </span>
                      </div>
                    </div>

                    {/* Add Item Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={vegItemInput}
                        onChange={(e) => setVegItemInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddVegItem();
                          }
                        }}
                        placeholder="Add veg dish (e.g. Dal Makhani, Paneer Tikka...) - Press Enter or +Add"
                        className="flex-1 px-3 py-2 rounded-xl border border-emerald-300 bg-white text-xs text-ink placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddVegItem}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shrink-0 cursor-pointer shadow-xs"
                      >
                        + Add
                      </button>
                    </div>

                    {/* Veg Items Badges */}
                    {Array.isArray(activeForm.vegMenu) && activeForm.vegMenu.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 bg-white/80 rounded-xl border border-emerald-100 scrollbar-thin">
                        {activeForm.vegMenu.map((item, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-medium"
                          >
                            <span>🥦 {item}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveVegItem(idx)}
                              className="text-emerald-600 hover:text-rose-600 font-bold cursor-pointer text-xs ml-0.5"
                              title="Remove item"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-emerald-700/80 italic bg-white/60 px-3 py-2 rounded-xl border border-dashed border-emerald-200">
                        No veg food items added yet. Type dish name above and click <b>+ Add</b>.
                      </p>
                    )}

                    {/* Veg Notes / Summary */}
                    <div>
                      <label className="text-[10px] font-bold text-emerald-900 block mb-1">
                        Veg Menu Summary / Notes (Optional)
                      </label>
                      <input
                        type="text"
                        name="vegMenuDescription"
                        value={activeForm.vegMenuDescription || ""}
                        onChange={handleActiveFieldChange}
                        placeholder="e.g. Welcome drink, 2 starters, 3 main course, breads, 2 desserts"
                        className="w-full px-3 py-1.5 rounded-xl border border-emerald-200 bg-white text-xs text-ink placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* NON-VEG MENU BUILDER */}
                  <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/90 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block"></span>
                        <span className="text-xs font-bold text-rose-950">
                          Non-Veg Menu {activeForm.pricePerPlateNonVeg ? `(Items for ₹${activeForm.pricePerPlateNonVeg}/plate)` : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {Array.isArray(activeForm.nonVegMenu) && activeForm.nonVegMenu.length > 0 && (
                          <button
                            type="button"
                            onClick={() => updateActiveCategory((prev) => ({ ...prev, nonVegMenu: [] }))}
                            className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                          >
                            Clear all
                          </button>
                        )}
                        <span className="text-[10px] font-semibold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">
                          {(activeForm.nonVegMenu || []).length} items
                        </span>
                      </div>
                    </div>

                    {/* Add Item Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={nonVegItemInput}
                        onChange={(e) => setNonVegItemInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddNonVegItem();
                          }
                        }}
                        placeholder="Add non-veg dish (e.g. Chicken Starter, Mutton Curry...) - Press Enter or +Add"
                        className="flex-1 px-3 py-2 rounded-xl border border-rose-300 bg-white text-xs text-ink placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddNonVegItem}
                        className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shrink-0 cursor-pointer shadow-xs"
                      >
                        + Add
                      </button>
                    </div>

                    {/* Non-Veg Items Badges */}
                    {Array.isArray(activeForm.nonVegMenu) && activeForm.nonVegMenu.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 bg-white/80 rounded-xl border border-rose-100 scrollbar-thin">
                        {activeForm.nonVegMenu.map((item, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-900 border border-rose-200 text-xs font-medium"
                          >
                            <span>🍗 {item}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveNonVegItem(idx)}
                              className="text-rose-600 hover:text-rose-800 font-bold cursor-pointer text-xs ml-0.5"
                              title="Remove item"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-rose-700/80 italic bg-white/60 px-3 py-2 rounded-xl border border-dashed border-rose-200">
                        No non-veg food items added yet. Type dish name above and click <b>+ Add</b>.
                      </p>
                    )}

                    {/* Non-Veg Notes / Summary */}
                    <div>
                      <label className="text-[10px] font-bold text-rose-900 block mb-1">
                        Non-Veg Menu Summary / Notes (Optional)
                      </label>
                      <input
                        type="text"
                        name="nonVegMenuDescription"
                        value={activeForm.nonVegMenuDescription || ""}
                        onChange={handleActiveFieldChange}
                        placeholder="e.g. 2 Non-veg starters, chicken curry, mutton rogan josh, desserts"
                        className="w-full px-3 py-1.5 rounded-xl border border-rose-200 bg-white text-xs text-ink placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 5: Venue Features, Catering & Facilities */}
            <div className="space-y-5 bg-white p-4 sm:p-6 rounded-2xl border border-brand-100 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-brand-100 gap-2">
                <h4 className="font-serif font-bold text-sm sm:text-base text-ink flex items-center gap-2">
                  <span>✨</span> Venue Features, Catering & Facilities
                </h4>
                <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200 self-start sm:self-auto">
                  {activeForm.venueFeatures.length} Selected
                </span>
              </div>

              <div className="space-y-5">
                {VENUE_FACILITY_GROUPS.map((sec) => (
                  <div key={sec.group} className="space-y-2.5">
                    <h5 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      {sec.group}
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {sec.items.map((item) => {
                        const isChecked = activeForm.venueFeatures.includes(item);
                        return (
                          <div
                            key={item}
                            onClick={() => handleFeatureToggle(item)}
                            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs font-medium transition cursor-pointer select-none ${
                              isChecked
                                ? "bg-rose-50/20 border-rose-400 text-ink font-semibold shadow-2xs"
                                : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50/40"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}} // Click handled on parent container
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer shrink-0"
                            />
                            <span className="truncate">{item}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Custom Feature */}
              <div className="bg-brand-50/40 p-3.5 rounded-2xl border border-brand-100/80 space-y-2 pt-3">
                <label className="text-xs font-bold text-brand-900 flex items-center justify-between">
                  <span>+ Add Custom Facility / Policy</span>
                  <span className="text-[10px] text-muted font-normal">Press Enter or click Add</span>
                </label>
                <div className="flex gap-2 items-center">
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
                    placeholder="e.g. Swimming Pool Deck, Late Night Music Permitted, Overnight Stay..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-brand-200 bg-white text-ink text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={addCustomFeature}
                    className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition cursor-pointer shadow-xs shrink-0"
                  >
                    + Add Custom
                  </button>
                </div>

                {/* Show custom-added features if any */}
                {activeForm.venueFeatures.filter(
                  (f) => !VENUE_FACILITY_GROUPS.some((g) => g.items.includes(f))
                ).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1.5">
                    {activeForm.venueFeatures
                      .filter((f) => !VENUE_FACILITY_GROUPS.some((g) => g.items.includes(f)))
                      .map((custom) => (
                        <span
                          key={custom}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 text-brand-900 border border-brand-300 text-xs font-medium"
                        >
                          <span>✓ {custom}</span>
                          <button
                            type="button"
                            onClick={() => removeFeature(custom)}
                            className="text-brand-500 hover:text-rose-600 font-bold ml-1 cursor-pointer"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* STEP 6: About & Description for active category */}
            <div className="space-y-4 bg-white p-4 sm:p-5 rounded-2xl border border-brand-100">
              <h4 className="font-serif font-bold text-sm text-ink border-b border-brand-100 pb-2 flex items-center gap-2">
                <span>📝</span> Description & Highlights for {activeCategoryTab}
              </h4>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  About {activeCategoryTab}
                </label>
                <textarea
                  rows={2}
                  name="about"
                  value={activeForm.about}
                  onChange={handleActiveFieldChange}
                  placeholder={
                    activeCategoryTab === "Marriage Garden / Lawns"
                      ? "e.g. Expansive open-air marriage lawn with lush green grass, royal mandap setup area, and ample space for 1000+ wedding guests..."
                      : activeCategoryTab === "Wedding Resorts"
                      ? "e.g. Premier luxury destination resort featuring guest stay rooms, sprawling lawn, poolside cocktail deck, and banquet hall..."
                      : activeCategoryTab === "Small Function / Party Halls"
                      ? "e.g. Cosy air-conditioned celebration hall ideal for Haldi, Mehndi, Roka, birthdays, and intimate family gatherings of 50-250 guests..."
                      : "e.g. Grand air-conditioned banquet hall with royal crystal chandeliers, stage decor space, bridal suite, and deluxe buffet dining..."
                  }
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
                  value={activeForm.description}
                  onChange={handleActiveFieldChange}
                  placeholder={
                    activeCategoryTab === "Marriage Garden / Lawns"
                      ? "Describe lawn grounds, waterproof tent/shamiana, power generator backup, hawan ritual space, catering area, and parking..."
                      : activeCategoryTab === "Wedding Resorts"
                      ? "Describe guest room packages, poolside event space, baraat welcome, check-in policies, catering, and destination wedding arrangements..."
                      : activeCategoryTab === "Small Function / Party Halls"
                      ? "Describe hall layout, sound/DJ space, balloon/theme decor options, catering setup, and half-day / full-day event timing..."
                      : "Describe hall capacity, central AC, bridal dressing room, in-house/outside catering policy, DJ timings, and booking terms..."
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm"
                />
              </div>

              {/* + Add Video Link Section */}
              <div className="pt-3 border-t border-brand-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                    <span className="text-rose-600 font-bold">▶</span> Videos & Virtual Tour for {activeCategoryTab}
                  </label>
                  <span className="text-[11px] text-muted">YouTube, Vimeo, Reel, or Direct MP4 link</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newVideoTitle}
                    onChange={(e) => setNewVideoTitle(e.target.value)}
                    placeholder={`Video Title (e.g. ${activeCategoryTab} Walkthrough)`}
                    className="sm:w-1/3 px-3.5 py-2 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                  />
                  <div className="flex-1 flex gap-2">
                    <input
                      type="url"
                      value={newVideoUrl}
                      onChange={(e) => setNewVideoUrl(e.target.value)}
                      placeholder="Paste video URL (https://www.youtube.com/watch?v=...)"
                      className="flex-1 px-3.5 py-2 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddVideo}
                      className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition cursor-pointer shadow-xs shrink-0"
                    >
                      + Add Video
                    </button>
                  </div>
                </div>

                {/* Video links list */}
                {Array.isArray(activeForm.videos) && activeForm.videos.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {activeForm.videos.map((vid, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-brand-200 bg-brand-50/40"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center text-xs shrink-0 font-bold">
                            ▶
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-ink truncate">{vid.title || "Venue Video"}</p>
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
                          onClick={() => handleRemoveVideo(idx)}
                          className="text-gray-400 hover:text-rose-600 p-1 text-xs font-bold cursor-pointer shrink-0"
                          title="Remove video"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* STEP 7: Photos & Gallery for active category */}
            <div className="space-y-4 bg-white p-4 sm:p-5 rounded-2xl border border-brand-100">
              <h4 className="font-serif font-bold text-sm text-ink border-b border-brand-100 pb-2 flex items-center gap-2">
                <span>📸</span> Photos & Gallery for {activeCategoryTab}
              </h4>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Upload Venue Photos (Cloudinary)
                </label>
                <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed border-brand-200 hover:border-brand-400 bg-brand-50/50 hover:bg-brand-50 text-brand-700 text-xs sm:text-sm font-bold cursor-pointer transition-colors">
                  <span>{uploadingImage ? `⏳ ${uploadProgress || "Uploading..."}` : `📷 Upload Photos for ${activeCategoryTab}`}</span>
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
              {activeForm.images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-2">
                  {activeForm.images.map((img, i) => (
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
          </div>

          {/* Visibility and Featured toggles */}
          <div className="flex items-center gap-6 pt-2 border-t border-brand-100">
            <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
              <input
                type="checkbox"
                name="active"
                checked={commonInfo.active}
                onChange={handleCommonChange}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />
              <span>Active (Visible on public listing)</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
              <input
                type="checkbox"
                name="featured"
                checked={commonInfo.featured}
                onChange={handleCommonChange}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />
              <span>Featured Venue (Badge on cards)</span>
            </label>
          </div>
        </form>

        {/* Footer Buttons */}
        <div className="px-6 py-4 bg-surface border-t border-brand-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleFinish}
            className="px-5 py-2.5 rounded-xl border border-brand-200 text-ink hover:bg-brand-50 text-xs font-bold transition-colors cursor-pointer w-full sm:w-auto"
          >
            {savedCategoryIds.length > 0 ? `Done / Close (${savedCategoryIds.length} Saved)` : "Cancel"}
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Primary Action 1: Save current venue & choose/move to next subcategory */}
            {!isEdit && nextAvailableCategory && (
              <button
                type="button"
                onClick={() => handleSaveCurrent(true)}
                disabled={submitting || uploadingImage}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-md shadow-amber-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5 w-full sm:w-auto"
              >
                <span>Save this & Add {nextAvailableCategory} →</span>
              </button>
            )}

            {/* Primary Action 2: Save current venue & finish */}
            <button
              type="button"
              onClick={() => handleSaveCurrent(false)}
              disabled={submitting || uploadingImage}
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-md shadow-brand-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>
                  {isEdit
                    ? "Update Venue ✓"
                    : isCurrentSaved
                    ? "Update & Finish ✓"
                    : "Save & Finish ✓"}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
