"use client";
import { useState, useMemo, useEffect } from "react";

// Curated suggestion pools for various wedding service categories
const CATEGORY_SUGGESTION_POOLS = {
  hotels: [
    { name: "Free High-Speed Wi-Fi", group: "Popular Amenities", highlight: true },
    { name: "Multi-Cuisine Restaurant", group: "Food & Dining", highlight: true },
    { name: "24/7 Power Backup", group: "Basic Facilities", highlight: true },
    { name: "Swimming Pool", group: "Popular Amenities", highlight: true },
    { name: "Room Service", group: "Services & Inclusions" },
    { name: "Air Conditioned Deluxe Rooms", group: "Room & Venue Features", highlight: true },
    { name: "Free Valet Parking", group: "Basic Facilities" },
    { name: "Elevator / Lift", group: "Basic Facilities" },
    { name: "24/7 Front Desk Assistance", group: "Services & Inclusions" },
    { name: "Banquet & Party Hall", group: "Room & Venue Features" },
    { name: "Daily Housekeeping", group: "Services & Inclusions" },
    { name: "CCTV & Security", group: "Safety & Hygiene" },
  ],
  venues: [
    { name: "Ample Valet Parking", group: "Basic Facilities", highlight: true },
    { name: "Central Air Conditioning", group: "Popular Amenities", highlight: true },
    { name: "Bridal Dressing Room", group: "Room & Venue Features", highlight: true },
    { name: "In-House Catering Available", group: "Food & Dining", highlight: true },
    { name: "24/7 Power Backup Generator", group: "Basic Facilities", highlight: true },
    { name: "Lawn & Open Garden Space", group: "Room & Venue Features" },
    { name: "In-House Decor Services", group: "Services & Inclusions" },
    { name: "DJ & Sound Permitted", group: "Services & Inclusions" },
    { name: "Alcohol License Permitted", group: "Services & Inclusions" },
    { name: "Mandap Setup Space", group: "Room & Venue Features" },
    { name: "Wheelchair Accessible", group: "Basic Facilities" },
    { name: "24-Hour Security Guards", group: "Safety & Hygiene" },
  ],
  cars: [
    { name: "Full Air Conditioning", group: "Popular Amenities", highlight: true },
    { name: "Professional Chauffeur Included", group: "Popular Amenities", highlight: true },
    { name: "GPS Live Tracking", group: "Popular Amenities", highlight: true },
    { name: "Spacious Luggage Boot", group: "Basic Facilities" },
    { name: "Wedding Floral Decoration", group: "Services & Inclusions", highlight: true },
    { name: "Premium Audio / Bluetooth", group: "Basic Facilities" },
    { name: "Fully Sanitized & Inspected", group: "Safety & Hygiene" },
    { name: "Fuel & Toll Inclusions", group: "Services & Inclusions" },
    { name: "24/7 On-Call Support", group: "Services & Inclusions" },
  ],
  mehndi: [
    { name: "100% Organic & Herbal Henna", group: "Popular Amenities", highlight: true },
    { name: "Deep Dark Stain Guarantee", group: "Popular Amenities", highlight: true },
    { name: "Bridal Full Hands & Feet Package", group: "Services & Inclusions", highlight: true },
    { name: "Customized Design Catalog", group: "Popular Amenities" },
    { name: "Guest & Family Mehndi Packages", group: "Services & Inclusions" },
    { name: "Contemporary & Arabic Designs", group: "Services & Inclusions" },
    { name: "Travels to Wedding Venue", group: "Services & Inclusions", highlight: true },
    { name: "Post-Application Lemon-Clove Oil", group: "Services & Inclusions" },
    { name: "Multiple Assistant Artists Available", group: "Services & Inclusions" },
  ],
  food: [
    { name: "Live Food Counters", group: "Popular Amenities", highlight: true },
    { name: "Customized Menu Tasting", group: "Popular Amenities", highlight: true },
    { name: "Uniformed Professional Staff", group: "Services & Inclusions", highlight: true },
    { name: "Fine Bone China & Cutlery", group: "Basic Facilities" },
    { name: "Chafing Dishes & Food Warmers", group: "Basic Facilities" },
    { name: "Mineral Drinking Water Counters", group: "Basic Facilities" },
    { name: "Live Chaat & Dessert Stations", group: "Food & Dining" },
    { name: "Strict Food Safety & Hygiene", group: "Safety & Hygiene" },
  ],
  photography: [
    { name: "Candid Wedding Photography", group: "Popular Amenities", highlight: true },
    { name: "Cinematic 4K Wedding Film", group: "Popular Amenities", highlight: true },
    { name: "Aerial Drone Photography", group: "Popular Amenities", highlight: true },
    { name: "Traditional Photo & Video", group: "Services & Inclusions" },
    { name: "Luxury Printed Photo Album", group: "Services & Inclusions" },
    { name: "Pre-Wedding Shoot Included", group: "Services & Inclusions" },
    { name: "Same-Day Teaser Reel", group: "Services & Inclusions" },
    { name: "Online High-Res Digital Gallery", group: "Services & Inclusions" },
  ],
  pandit: [
    { name: "Complete Vedic Rituals", group: "Popular Amenities", highlight: true },
    { name: "Fluent in Sanskrit & Hindi", group: "Popular Amenities", highlight: true },
    { name: "Auspicious Muhurat Consultation", group: "Services & Inclusions", highlight: true },
    { name: "Complete Samagri Checklist", group: "Basic Facilities" },
    { name: "Samagri Included Package Available", group: "Services & Inclusions" },
    { name: "Customized Ceremony Duration", group: "Services & Inclusions" },
    { name: "Travels to Destination Venue", group: "Services & Inclusions" },
  ],
  decor: [
    { name: "Fresh Floral Arrangements", group: "Popular Amenities", highlight: true },
    { name: "Fairy Lights & Chandeliers", group: "Popular Amenities", highlight: true },
    { name: "Stage & Mandap Backdrop Setup", group: "Room & Venue Features", highlight: true },
    { name: "Entry Arch & Pathway Draping", group: "Room & Venue Features" },
    { name: "Custom Theme Styling & Mockup", group: "Services & Inclusions" },
    { name: "Comfortable Seating & Carpets", group: "Basic Facilities" },
    { name: "Dismantling & Cleanup Included", group: "Services & Inclusions" },
  ],
  default: [
    { name: "Professional Equipment", group: "Popular Amenities", highlight: true },
    { name: "Customized Service Packages", group: "Popular Amenities", highlight: true },
    { name: "Experienced Dedicated Team", group: "Services & Inclusions", highlight: true },
    { name: "Free Initial Consultation", group: "Services & Inclusions" },
    { name: "Travels to Client Venue", group: "Services & Inclusions" },
    { name: "On-Time Service Guarantee", group: "Popular Amenities" },
    { name: "Quality & Satisfaction Guarantee", group: "Services & Inclusions" },
    { name: "Flexible Booking Terms", group: "Services & Inclusions" },
  ],
};

function getSuggestionsForCategory(category) {
  if (!category) return CATEGORY_SUGGESTION_POOLS.default;
  const slug = (category.slug || "").toLowerCase();
  const name = (category.name || "").toLowerCase();

  if (slug.includes("hotel") || name.includes("hotel") || slug.includes("resort") || name.includes("resort")) {
    return CATEGORY_SUGGESTION_POOLS.hotels;
  }
  if (slug.includes("venue") || name.includes("venue") || slug.includes("banquet") || name.includes("banquet") || slug.includes("farm")) {
    return CATEGORY_SUGGESTION_POOLS.venues;
  }
  if (slug.includes("car") || name.includes("car") || slug.includes("transport") || name.includes("transport") || slug.includes("vehicle") || name.includes("bus")) {
    return CATEGORY_SUGGESTION_POOLS.cars;
  }
  if (slug.includes("mehndi") || name.includes("mehndi") || slug.includes("henna") || name.includes("henna")) {
    return CATEGORY_SUGGESTION_POOLS.mehndi;
  }
  if (slug.includes("food") || name.includes("food") || slug.includes("cater") || name.includes("cater")) {
    return CATEGORY_SUGGESTION_POOLS.food;
  }
  if (slug.includes("photo") || name.includes("photo") || slug.includes("shoot") || slug.includes("video") || name.includes("cinema")) {
    return CATEGORY_SUGGESTION_POOLS.photography;
  }
  if (slug.includes("pandit") || name.includes("pandit") || slug.includes("priest") || name.includes("priest")) {
    return CATEGORY_SUGGESTION_POOLS.pandit;
  }
  if (slug.includes("decor") || name.includes("decor") || slug.includes("setup") || name.includes("tent") || slug.includes("home")) {
    return CATEGORY_SUGGESTION_POOLS.decor;
  }
  return CATEGORY_SUGGESTION_POOLS.default;
}

const PRESET_GROUPS = [
  "Popular Amenities",
  "Basic Facilities",
  "Food & Dining",
  "Room & Venue Features",
  "Services & Inclusions",
  "Safety & Hygiene",
];

export default function CategoryFacilitiesManager({
  selectedCategoryIds = [],
  categories = [],
  facilities = [],
  onChange,
  activeCategoryId: propActiveCategoryId,
  onCategoryChange,
  hideCategoryTabs = false,
}) {
  // Selected category objects
  const selectedCategories = useMemo(() => {
    return categories.filter((c) => selectedCategoryIds.includes(c._id));
  }, [categories, selectedCategoryIds]);

  const [internalActiveCategoryId, setInternalActiveCategoryId] = useState(() => {
    return selectedCategories[0]?._id || "";
  });

  const activeCategoryId = propActiveCategoryId !== undefined ? propActiveCategoryId : internalActiveCategoryId;

  const setActiveCategoryId = (id) => {
    if (onCategoryChange) {
      onCategoryChange(id);
    } else {
      setInternalActiveCategoryId(id);
    }
  };

  useEffect(() => {
    if ((!activeCategoryId || !selectedCategories.some((c) => c._id === activeCategoryId)) && selectedCategories.length > 0) {
      setActiveCategoryId(selectedCategories[0]._id);
    }
  }, [selectedCategories, activeCategoryId]);

  // Ensure active category is valid
  const currentActiveCategory = useMemo(() => {
    const found = selectedCategories.find((c) => c._id === activeCategoryId);
    return found || selectedCategories[0] || null;
  }, [selectedCategories, activeCategoryId]);

  // Form state for adding/editing a facility
  const [formName, setFormName] = useState("");
  const [formGroup, setFormGroup] = useState("Popular Amenities");
  const [customGroup, setCustomGroup] = useState("");
  const [formHighlight, setFormHighlight] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null); // index in current category's facilities

  // Facilities for current active category
  const activeCategoryFacilities = useMemo(() => {
    if (!currentActiveCategory) return [];
    const catIdStr = String(currentActiveCategory._id);
    const catName = currentActiveCategory.name?.toLowerCase().trim();

    return facilities.filter((f) => {
      const fCatId = String(f.category?._id || f.category || "");
      const fCatName = (f.categoryName || f.category?.name || "").toLowerCase().trim();
      return fCatId === catIdStr || (catName && fCatName === catName);
    });
  }, [facilities, currentActiveCategory]);

  // Suggestions for current category
  const suggestions = useMemo(() => {
    return getSuggestionsForCategory(currentActiveCategory);
  }, [currentActiveCategory]);

  // Check if a suggestion is already added
  const isSuggestionAdded = (suggestionName) => {
    return activeCategoryFacilities.some(
      (f) => f.name.toLowerCase().trim() === suggestionName.toLowerCase().trim()
    );
  };

  // Toggle suggestion
  const toggleSuggestion = (sug) => {
    if (!currentActiveCategory) return;
    const catIdStr = String(currentActiveCategory._id);
    const exists = isSuggestionAdded(sug.name);

    if (exists) {
      // Remove it
      const updated = facilities.filter((f) => {
        const isThisCat =
          String(f.category?._id || f.category || "") === catIdStr ||
          (f.categoryName && f.categoryName.toLowerCase() === currentActiveCategory.name.toLowerCase());
        const isThisName = f.name.toLowerCase().trim() === sug.name.toLowerCase().trim();
        return !(isThisCat && isThisName);
      });
      onChange(updated);
    } else {
      // Add it
      const newFacility = {
        category: currentActiveCategory._id,
        categoryName: currentActiveCategory.name,
        group: sug.group || "Popular Amenities",
        name: sug.name,
        highlight: Boolean(sug.highlight),
      };
      onChange([...facilities, newFacility]);
    }
  };

  // Submit custom facility
  const handleSaveFacility = (e) => {
    e?.preventDefault();
    if (!formName.trim() || !currentActiveCategory) return;

    const chosenGroup = formGroup === "custom" ? customGroup.trim() || "Popular Amenities" : formGroup;

    if (editingIndex !== null) {
      // Editing existing facility
      const targetItem = activeCategoryFacilities[editingIndex];
      if (!targetItem) return;

      const updated = facilities.map((f) => {
        if (f === targetItem) {
          return {
            ...f,
            name: formName.trim(),
            group: chosenGroup,
            highlight: formHighlight,
          };
        }
        return f;
      });
      onChange(updated);
      setEditingIndex(null);
    } else {
      // Adding new facility
      const newFacility = {
        category: currentActiveCategory._id,
        categoryName: currentActiveCategory.name,
        group: chosenGroup,
        name: formName.trim(),
        highlight: formHighlight,
      };
      onChange([...facilities, newFacility]);
    }

    // Reset inputs
    setFormName("");
    setFormHighlight(false);
  };

  const handleStartEdit = (index) => {
    const item = activeCategoryFacilities[index];
    if (!item) return;
    setEditingIndex(index);
    setFormName(item.name);
    if (PRESET_GROUPS.includes(item.group)) {
      setFormGroup(item.group);
      setCustomGroup("");
    } else {
      setFormGroup("custom");
      setCustomGroup(item.group);
    }
    setFormHighlight(Boolean(item.highlight));
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setFormName("");
    setFormHighlight(false);
  };

  const handleRemoveFacility = (itemToRemove) => {
    const updated = facilities.filter((f) => f !== itemToRemove);
    onChange(updated);
    if (editingIndex !== null) {
      handleCancelEdit();
    }
  };

  // Group active category facilities by group name
  const groupedFacilities = useMemo(() => {
    const groups = {};
    activeCategoryFacilities.forEach((item) => {
      const g = item.group || "Popular Amenities";
      if (!groups[g]) groups[g] = [];
      groups[g].push(item);
    });
    return groups;
  }, [activeCategoryFacilities]);

  if (selectedCategories.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900">
        <div className="flex items-start gap-3">
          <span className="text-xl">💡</span>
          <div>
            <h4 className="font-semibold text-sm">Please select wedding categories first</h4>
            <p className="text-xs text-amber-800/80 mt-1">
              Select one or more categories above (such as Hotels, Venues, Cars, or Mehndi) to configure customized amenities and facilities for each category.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-brand-200 bg-white p-5 md:p-7 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <h4 className="font-serif text-base md:text-lg font-bold text-wine">
              Category Amenities & Facilities Manager
            </h4>
          </div>
          <p className="text-xs text-muted mt-1">
            Customize amenities, features, and inclusions offered for each of your selected wedding service categories.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
            {facilities.length} Total Facilities Added
          </span>
        </div>
      </div>

      {/* Category Tabs Switcher */}
      {!hideCategoryTabs && (
        <div>
          <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2.5">
            Select Category to Manage Facilities:
          </label>
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map((cat) => {
              const isSelected = currentActiveCategory?._id === cat._id;
              const countForCat = facilities.filter((f) => {
                const fCatId = String(f.category?._id || f.category || "");
                const fCatName = (f.categoryName || f.category?.name || "").toLowerCase().trim();
                return fCatId === String(cat._id) || (cat.name && fCatName === cat.name.toLowerCase().trim());
              }).length;

              return (
                <button
                  key={cat._id}
                  type="button"
                  onClick={() => {
                    setActiveCategoryId(cat._id);
                    handleCancelEdit();
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-brand-600 text-white shadow-md shadow-brand-500/20 scale-[1.02]"
                      : "bg-surface/80 text-ink/80 border border-line hover:bg-brand-50 hover:text-brand-700"
                  }`}
                >
                  <span>{cat.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isSelected ? "bg-white/20 text-white" : "bg-line/80 text-ink/70"
                    }`}
                  >
                    {countForCat}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Category Amenities Workspace */}
      {currentActiveCategory && (
        <div className="space-y-6 pt-2">
          {/* Quick Suggestions Strip */}
          <div className="p-4 md:p-5 rounded-2xl bg-brand-50/50 border border-brand-100/80 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-wine uppercase tracking-wider flex items-center gap-1.5">
                <span>⚡</span> Quick Suggested Amenities for {currentActiveCategory.name}
              </h5>
              <span className="text-[11px] text-muted">Click to quickly add or remove</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {suggestions.map((sug, i) => {
                const added = isSuggestionAdded(sug.name);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleSuggestion(sug)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      added
                        ? "bg-emerald-600 text-white font-semibold shadow-xs hover:bg-rose-600"
                        : "bg-white text-ink/80 border border-brand-200/80 hover:border-brand-500 hover:text-brand-700 hover:bg-brand-50"
                    }`}
                    title={added ? "Click to remove" : "Click to add"}
                  >
                    <span>{added ? "✓" : "+"}</span>
                    <span>{sug.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add / Edit Custom Facility Form */}
          <div className="p-4 md:p-5 rounded-2xl bg-surface/50 border border-line space-y-4">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                <span>{editingIndex !== null ? "✏️" : "➕"}</span>
                <span>
                  {editingIndex !== null
                    ? `Edit Facility for ${currentActiveCategory.name}`
                    : `Add Custom Facility for ${currentActiveCategory.name}`}
                </span>
                {editingIndex === null && (
                  <span className="text-[11px] font-normal text-muted lowercase">(optional)</span>
                )}
              </h5>
              {editingIndex !== null && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
              <div className="md:col-span-5">
                <label className="block text-[11px] font-semibold text-ink/80 mb-1">
                  Facility / Amenity Name <span className="text-muted font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Free Wi-Fi, Valet Parking, GPS Tracking, Bridal Suite"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-line text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 bg-white"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-[11px] font-semibold text-ink/80 mb-1">
                  Categorized Group
                </label>
                <select
                  value={formGroup}
                  onChange={(e) => setFormGroup(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-line text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 bg-white cursor-pointer"
                >
                  {PRESET_GROUPS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                  <option value="custom">+ Custom Group...</option>
                </select>

                {formGroup === "custom" && (
                  <input
                    type="text"
                    placeholder="Enter custom group name"
                    value={customGroup}
                    onChange={(e) => setCustomGroup(e.target.value)}
                    className="mt-2 w-full px-3.5 py-1.5 rounded-xl border border-line text-xs text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 bg-white"
                  />
                )}
              </div>

              <div className="md:col-span-3 flex flex-col justify-end">
                <label className="flex items-center gap-2 mb-2 text-xs font-medium text-ink cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formHighlight}
                    onChange={(e) => setFormHighlight(e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                  />
                  <span>⭐ Highlight Amenity</span>
                </label>

                <button
                  type="button"
                  onClick={handleSaveFacility}
                  disabled={!formName.trim()}
                  className="w-full py-2 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs md:text-sm transition-colors shadow-2xs disabled:opacity-40 cursor-pointer"
                >
                  {editingIndex !== null ? "Update Facility" : "+ Add Facility"}
                </button>
              </div>
            </div>
          </div>

          {/* List of facilities added for this category */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-ink uppercase tracking-wider">
                Configured Facilities ({activeCategoryFacilities.length})
              </h5>
              {activeCategoryFacilities.length > 0 && (
                <span className="text-xs text-muted">
                  These amenities will be displayed on all {currentActiveCategory.name} listings.
                </span>
              )}
            </div>

            {activeCategoryFacilities.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-line bg-surface/30 text-muted">
                <span className="text-2xl block mb-1">📋</span>
                <p className="text-sm font-medium">No facilities added yet for {currentActiveCategory.name}.</p>
                <p className="text-xs mt-1">
                  Click any quick suggestion above or type a custom facility to add it.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {Object.entries(groupedFacilities).map(([groupName, items]) => (
                  <div key={groupName} className="p-4 rounded-2xl border border-line bg-surface/30 space-y-3">
                    <div className="flex items-center justify-between border-b border-line/60 pb-2">
                      <span className="text-xs font-bold text-wine uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-brand-500 inline-block" />
                        {groupName}
                      </span>
                      <span className="text-[11px] font-semibold text-muted">
                        {items.length} {items.length === 1 ? "amenity" : "amenities"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {items.map((item, idx) => {
                        const originalIndex = activeCategoryFacilities.indexOf(item);
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-xl bg-white border border-line hover:border-brand-300 transition-all shadow-2xs group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              <span className="text-emerald-600 font-bold text-sm shrink-0">✓</span>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-ink truncate flex items-center gap-1">
                                  <span>{item.name}</span>
                                  {item.highlight && (
                                    <span
                                      className="text-amber-500 text-xs shrink-0"
                                      title="Highlighted amenity"
                                    >
                                      ★
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(originalIndex)}
                                className="p-1 rounded text-muted hover:text-brand-600 hover:bg-brand-50 text-xs font-semibold cursor-pointer"
                                title="Edit facility"
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveFacility(item)}
                                className="p-1 rounded text-muted hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold cursor-pointer"
                                title="Remove facility"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
