"use client";
import { useState } from "react";
import api from "@/api/axios";

export const HOME_SETUP_CATEGORIES = [
  {
    id: "Tent & Pandal",
    label: "Tent & Pandal",
    icon: "⛺",
    color: "amber",
    subcategories: ["Traditional Wedding Pandal","Luxury Wedding Tent","Waterproof Tent","German Hanger Tent","Dome Tent","Pagoda Tent","Canopy Tent","Entrance Tent","Dining Area Tent","Open-Air Pandal","Mandap Tent"],
  },
  {
    id: "Furniture & Seating",
    label: "Furniture & Seating",
    icon: "🪑",
    color: "orange",
    subcategories: ["Wedding Sofas","Royal Chairs","Couple Seating","VIP Seating","Guest Chairs","Dining Tables","Round Tables","Rectangular Tables","Cocktail Tables","Bar Counters","Lounge Furniture","Traditional Seating","Stage Furniture","Kids Seating"],
  },
  {
    id: "Stage & Decoration",
    label: "Stage & Decoration",
    icon: "🌸",
    color: "pink",
    subcategories: ["Wedding Stage","Reception Stage","Engagement Stage","Haldi Stage","Mehendi Stage","Birthday Stage","Anniversary Stage","Wedding Mandap","Floral Mandap","Couple Backdrop","Photo Booth","Selfie Corner","Entrance Decoration","Welcome Gate","Floral Decoration","Balloon Decoration","Theme-based Decoration","Ceiling Decoration","Table Decoration","Rangoli Decoration"],
  },
  {
    id: "DJ & Sound System",
    label: "DJ & Sound System",
    icon: "🔊",
    color: "purple",
    subcategories: ["Professional DJ Setup","Wedding DJ","Reception DJ","Haldi / Mehendi DJ","Live Music Setup","Band & Orchestra","Dhol / Traditional Music","Karaoke Setup","Wireless Microphones","Line Array Speakers","Subwoofers","Mixer & Amplifier","Indoor Sound System","Outdoor Sound System"],
  },
  {
    id: "Lighting & Special Effects",
    label: "Lighting & Special Effects",
    icon: "💡",
    color: "yellow",
    subcategories: ["LED Par Lights","Moving Head Lights","Follow Spot Lights","Beam Lights","Stage Wash Lights","Fairy Lights","String Lights","Chandeliers","Decorative Hanging Lights","LED Wall","Laser Lights","Fog Machine","Low Fog Effect","Bubble Machine","Cold Pyro Effects","CO2 Effects","Spotlight Decoration","Entrance Lighting","Architectural Lighting"],
  },
  {
    id: "Power & Generator",
    label: "Power & Generator",
    icon: "⚡",
    color: "green",
    subcategories: ["Diesel Generator","Silent Generator","Portable Generator","Heavy-duty Generator","Power Backup","UPS System","Inverter System","Electrical Distribution Panels","Temporary Power Connections","Industrial Cables","Electrical Wiring","Power Distribution Boxes"],
  },
];

const SERVICE_RADIUS_OPTIONS = ["5 km", "10 km", "20 km", "30 km", "50 km+", "Pan City"];

function LocationCard({ loc, onRemove }) {
  return (
    <div className="flex items-start justify-between p-3 rounded-xl bg-amber-50 border border-amber-200 gap-2">
      <div className="text-sm text-amber-900">
        <span className="font-semibold">{loc.city}</span>
        {loc.state && <span className="text-amber-700"> — {loc.state}</span>}
        {loc.localities && <div className="text-xs text-amber-600 mt-0.5">📍 {loc.localities}</div>}
        {loc.serviceRadius && <div className="text-xs text-amber-600">📐 {loc.serviceRadius}</div>}
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="text-amber-600 hover:text-rose-600 font-bold text-base leading-none flex-shrink-0 cursor-pointer"
        title="Remove location"
      >
        ×
      </button>
    </div>
  );
}

export default function HomeSetupOnboarding({ isOpen, onComplete, initialStep = 1, initialData = null }) {
  const [step, setStep] = useState(initialStep);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Locations
  const [locations, setLocations] = useState(
    initialData?.locations?.length ? initialData.locations : []
  );
  const [locForm, setLocForm] = useState({ state: "Bihar", city: "", localities: "", serviceRadius: "" });

  // Step 2: Categories
  const [selectedCategories, setSelectedCategories] = useState(
    initialData?.selectedCategories || []
  );
  const [customCategories, setCustomCategories] = useState(
    initialData?.customCategories || []
  );
  const [customInput, setCustomInput] = useState({ name: "", description: "" });

  if (!isOpen) return null;

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const addLocation = () => {
    if (!locForm.city.trim()) {
      setError("City is required.");
      return;
    }
    setLocations((prev) => [...prev, { ...locForm, city: locForm.city.trim() }]);
    setLocForm({ state: "Bihar", city: "", localities: "", serviceRadius: "" });
    setError("");
  };

  const removeLocation = (idx) =>
    setLocations((prev) => prev.filter((_, i) => i !== idx));

  const toggleCategory = (id) =>
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );

  const addCustomCategory = () => {
    if (!customInput.name.trim()) return;
    setCustomCategories((prev) => [...prev, { ...customInput, name: customInput.name.trim() }]);
    setCustomInput({ name: "", description: "" });
  };

  const removeCustomCategory = (idx) =>
    setCustomCategories((prev) => prev.filter((_, i) => i !== idx));

  const goNext = () => {
    setError("");
    if (step === 1) {
      if (locations.length === 0) {
        setError("Add at least one service location before proceeding.");
        return;
      }
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    if (selectedCategories.length === 0 && customCategories.length === 0) {
      setError("Select at least one service category.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const endpoint = initialData
        ? "/api/vendor/home-setup-v2/profile"
        : "/api/vendor/home-setup-v2/onboard";
      const method = initialData ? "put" : "post";
      await api[method](endpoint, { locations, selectedCategories, customCategories });
      onComplete();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border border-amber-200 my-4">
        {/* Header */}
        <div className="p-6 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 rounded-t-3xl">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">🎪</span>
            <div>
              <h2 className="font-serif text-xl font-bold text-amber-900">
                {initialData ? "Update Home Setup Profile" : "Home Setup — Vendor Setup"}
              </h2>
              <p className="text-xs text-amber-700">
                {initialData ? "Update your service locations and categories" : "Tell us where you operate and what you offer"}
              </p>
            </div>
          </div>
          {/* Step Indicator */}
          <div className="flex items-center gap-2 mt-3">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    s < step
                      ? "bg-amber-500 border-amber-500 text-white"
                      : s === step
                      ? "bg-white border-amber-500 text-amber-600"
                      : "bg-white border-gray-200 text-gray-400"
                  }`}
                >
                  {s < step ? "✓" : s}
                </div>
                <span
                  className={`text-xs font-medium ${
                    s === step ? "text-amber-700" : "text-gray-400"
                  }`}
                >
                  {s === 1 ? "Service Locations" : "Service Categories"}
                </span>
                {s < 2 && <span className="text-gray-300 mx-1">→</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* ── STEP 1: Locations ── */}
          {step === 1 && (
            <div className="space-y-5">
              <p className="text-sm text-gray-600">
                Add the cities/areas where you provide home setup services. You can add multiple locations.
              </p>

              {/* Location form */}
              <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-3">
                <h4 className="text-sm font-semibold text-amber-900">Add Location</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
                    <input
                      type="text"
                      value={locForm.state}
                      onChange={(e) => setLocForm((f) => ({ ...f, state: e.target.value }))}
                      placeholder="e.g. Bihar"
                      className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      City <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={locForm.city}
                      onChange={(e) => setLocForm((f) => ({ ...f, city: e.target.value }))}
                      placeholder="e.g. Patna"
                      className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Localities / Areas <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={locForm.localities}
                    onChange={(e) => setLocForm((f) => ({ ...f, localities: e.target.value }))}
                    placeholder="e.g. Boring Road, Kankarbagh, Danapur"
                    className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Service Radius <span className="text-gray-400">(optional)</span>
                  </label>
                  <select
                    value={locForm.serviceRadius}
                    onChange={(e) => setLocForm((f) => ({ ...f, serviceRadius: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="">Select radius</option>
                    {SERVICE_RADIUS_OPTIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={addLocation}
                  className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors cursor-pointer"
                >
                  + Add Location
                </button>
              </div>

              {/* Added locations */}
              {locations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Added Locations ({locations.length})
                  </h4>
                  {locations.map((loc, idx) => (
                    <LocationCard key={idx} loc={loc} onRemove={() => removeLocation(idx)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: Categories ── */}
          {step === 2 && (
            <div className="space-y-5">
              <p className="text-sm text-gray-600">
                Select the service categories you provide. You can select multiple.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {HOME_SETUP_CATEGORIES.map((cat) => {
                  const selected = selectedCategories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                        selected
                          ? "border-amber-500 bg-amber-50 shadow-md shadow-amber-200"
                          : "border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50/50"
                      }`}
                    >
                      <span className="text-2xl">{cat.icon}</span>
                      <span className="text-xs font-semibold text-gray-800 leading-tight">{cat.label}</span>
                      <span className="text-[10px] text-gray-500">{cat.subcategories.length} sub-types</span>
                      {selected && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                          ✓ Selected
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Custom Categories */}
              <div className="p-4 rounded-2xl border border-dashed border-amber-300 bg-amber-50/40 space-y-3">
                <h4 className="text-sm font-semibold text-amber-900">Add Custom Category</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customInput.name}
                    onChange={(e) => setCustomInput((c) => ({ ...c, name: e.target.value }))}
                    placeholder="Category name"
                    className="flex-1 px-3 py-2 rounded-xl border border-amber-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <input
                    type="text"
                    value={customInput.description}
                    onChange={(e) => setCustomInput((c) => ({ ...c, description: e.target.value }))}
                    placeholder="Description (optional)"
                    className="flex-1 px-3 py-2 rounded-xl border border-amber-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <button
                    type="button"
                    onClick={addCustomCategory}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    + Add
                  </button>
                </div>
                {customCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {customCategories.map((cc, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-xs font-medium"
                      >
                        {cc.name}
                        <button
                          type="button"
                          onClick={() => removeCustomCategory(idx)}
                          className="text-amber-600 hover:text-rose-600 font-bold cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-amber-100 flex justify-between items-center gap-3 bg-gray-50/50 rounded-b-3xl">
          {step === 2 ? (
            <button
              type="button"
              onClick={() => { setStep(1); setError(""); }}
              className="px-4 py-2 rounded-xl border border-amber-200 text-amber-800 text-sm font-medium hover:bg-amber-50 transition-colors cursor-pointer"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}
          {step === 1 && (
            <button
              type="button"
              onClick={goNext}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              Next: Select Categories →
            </button>
          )}
          {step === 2 && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors disabled:opacity-60 cursor-pointer"
            >
              {saving ? "Saving..." : initialData ? "Update Profile" : "Complete Setup ✓"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
