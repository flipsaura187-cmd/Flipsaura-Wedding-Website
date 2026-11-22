"use client";
import { useState } from "react";

const SERVICE_RADIUS_OPTIONS = ["5 km", "10 km", "20 km", "30 km", "50 km+", "Pan City"];

const COMMON_CITIES = [
  "Daudnagar",
  "Aurangabad",
  "Patna",
  "Gaya",
  "Dehri on Sone",
  "Sasaram",
  "Jamshedpur",
  "Ranchi",
  "Bodh Gaya",
  "Muzaffarpur",
  "Bhagalpur",
  "Darbhanga",
  "Varanasi",
  "Kolkata",
  "Delhi NCR",
];

export default function HotelLocationModal({
  isOpen,
  onClose,
  onProceed,
  defaultState = "Bihar",
  defaultCity = "Daudnagar",
}) {
  const [locForm, setLocForm] = useState({
    state: defaultState || "Bihar",
    city: defaultCity || "Daudnagar",
    localities: "",
    serviceRadius: "",
  });

  const [confirmedLocation, setConfirmedLocation] = useState(null);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleAddLocation = () => {
    if (!locForm.city.trim()) {
      setError("City is required.");
      return;
    }
    setError("");
    setConfirmedLocation({
      state: locForm.state.trim() || "Bihar",
      city: locForm.city.trim(),
      localities: locForm.localities.trim(),
      serviceRadius: locForm.serviceRadius,
    });
  };

  const handleContinue = () => {
    setError("");
    const targetLoc = confirmedLocation || {
      state: locForm.state.trim() || "Bihar",
      city: locForm.city.trim(),
      localities: locForm.localities.trim(),
      serviceRadius: locForm.serviceRadius,
    };

    if (!targetLoc.city) {
      setError("Please specify the City / District for the hotel.");
      return;
    }

    if (onProceed) {
      onProceed(targetLoc);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-xl border border-amber-200 my-auto overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 sm:top-5 right-4 sm:right-5 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-400 hover:text-gray-700 flex items-center justify-center text-lg transition-colors cursor-pointer shadow-2xs"
            title="Close"
          >
            ×
          </button>
          <div className="flex items-center gap-3">
            <span className="text-3xl sm:text-4xl">🏨</span>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-amber-900">
                Hotel Property Location
              </h2>
              <p className="text-xs text-amber-700 mt-0.5">
                Set the operating location for your hotel property
              </p>
            </div>
          </div>

          {/* Stepper Pill */}
          <div className="flex items-center gap-2 mt-3 sm:mt-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-white/80 px-2.5 py-1 rounded-full border border-amber-200">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px]">
                1
              </span>
              <span>Hotel Location</span>
            </div>
            <span className="text-amber-400 text-xs">→</span>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 px-2 py-1">
              <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-[10px]">
                2
              </span>
              <span>Hotel & Rooms Info</span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <p className="text-xs sm:text-sm text-gray-600">
            Add the city and locality where your hotel property is located.
          </p>

          {/* Location Form Card */}
          <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-3">
            <h4 className="text-sm font-semibold text-amber-900">Add Location</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
                <input
                  type="text"
                  value={locForm.state}
                  onChange={(e) => setLocForm((f) => ({ ...f, state: e.target.value }))}
                  placeholder="e.g. Bihar"
                  className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  City <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  list="hotel-location-cities"
                  value={locForm.city}
                  onChange={(e) => setLocForm((f) => ({ ...f, city: e.target.value }))}
                  placeholder="e.g. Daudnagar, Patna"
                  className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <datalist id="hotel-location-cities">
                  {COMMON_CITIES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
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
                placeholder="e.g. Station Road, Near Bus Stand, Main Market"
                className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Service Radius <span className="text-gray-400">(optional)</span>
              </label>
              <select
                value={locForm.serviceRadius}
                onChange={(e) => setLocForm((f) => ({ ...f, serviceRadius: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="">Select radius</option>
                {SERVICE_RADIUS_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleAddLocation}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors cursor-pointer shadow-2xs"
            >
              + Add Location
            </button>
          </div>

          {/* Confirmed Location Preview Card */}
          {confirmedLocation && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start justify-between gap-3 animate-in fade-in">
              <div className="text-sm text-amber-950">
                <div className="font-bold flex items-center gap-1.5">
                  <span>📍</span>
                  <span>{confirmedLocation.city}</span>
                  {confirmedLocation.state && (
                    <span className="font-normal text-amber-700">— {confirmedLocation.state}</span>
                  )}
                </div>
                {confirmedLocation.localities && (
                  <div className="text-xs text-amber-800 mt-0.5">
                    Areas: {confirmedLocation.localities}
                  </div>
                )}
                {confirmedLocation.serviceRadius && (
                  <div className="text-xs text-amber-700">
                    Radius: {confirmedLocation.serviceRadius}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setConfirmedLocation(null)}
                className="text-amber-600 hover:text-rose-600 text-lg font-bold leading-none cursor-pointer"
                title="Remove location"
              >
                ×
              </button>
            </div>
          )}

          {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleContinue}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white text-sm font-semibold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <span>Next: Enter Hotel Details</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
