"use client";
import React from "react";

export default function VenueOverviewSection({ item }) {
  if (!item) return null;

  const guestCap = item.guestCapacity || item.capacity || 0;
  const seating = item.seatingCapacity || 0;
  const floating = item.floatingCapacity || 0;
  const rooms = item.roomCount || 0;
  const rental = item.rentalPrice || item.price || 0;
  const vegPlate = item.pricePerPlateVeg || 0;
  const nonVegPlate = item.pricePerPlateNonVeg || 0;
  const spaces = Array.isArray(item.spaceTypes) ? item.spaceTypes : [];
  const features = Array.isArray(item.venueFeatures) ? item.venueFeatures : [];

  return (
    <div className="space-y-6 pt-4">
      {/* Category and Badges */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-800 border border-brand-200 text-xs font-bold uppercase tracking-wider">
          <span>🏛️</span> {item.venueType || "Wedding Venue"}
        </span>

        {item.featured && (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold uppercase tracking-wider">
            ★ Featured Property
          </span>
        )}

        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
          ✓ Verified FlipsAura Partner
        </span>
      </div>

      {/* Key Metrics Grid: Capacity, Rooms, Spaces */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-brand-50/50 p-3.5 rounded-2xl border border-brand-100 text-center sm:text-left">
          <span className="text-xl mb-1 block">👥</span>
          <span className="text-[11px] text-muted font-medium block">Guest Capacity</span>
          <span className="text-base sm:text-lg font-bold text-ink">
            {guestCap > 0 ? `${guestCap} Guests` : "Flexible"}
          </span>
          {seating > 0 && (
            <span className="text-[10px] text-muted block mt-0.5">
              {seating} Seating • {floating > 0 ? `${floating} Floating` : ""}
            </span>
          )}
        </div>

        <div className="bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-100 text-center sm:text-left">
          <span className="text-xl mb-1 block">🛏️</span>
          <span className="text-[11px] text-muted font-medium block">Stay Rooms</span>
          <span className="text-base sm:text-lg font-bold text-indigo-950">
            {rooms > 0 ? `${rooms} Rooms` : "Available on request"}
          </span>
          <span className="text-[10px] text-indigo-700 block mt-0.5">AC / Bridal Stay</span>
        </div>

        <div className="bg-purple-50/50 p-3.5 rounded-2xl border border-purple-100 text-center sm:text-left">
          <span className="text-xl mb-1 block">🏛️</span>
          <span className="text-[11px] text-muted font-medium block">Spaces Available</span>
          <span className="text-xs sm:text-sm font-bold text-purple-950 truncate block mt-0.5">
            {spaces.length > 0 ? spaces.join(", ") : "Indoor Banquet"}
          </span>
          <span className="text-[10px] text-purple-700 block mt-0.5">Indoor / Outdoor</span>
        </div>

        <div className="bg-amber-50/50 p-3.5 rounded-2xl border border-amber-100 text-center sm:text-left">
          <span className="text-xl mb-1 block">⭐</span>
          <span className="text-[11px] text-muted font-medium block">Review Rating</span>
          <span className="text-base sm:text-lg font-bold text-amber-950">
            ★ {item.rating?.toFixed ? item.rating.toFixed(1) : item.rating || "4.8"}
          </span>
          <span className="text-[10px] text-amber-700 block mt-0.5">
            {item.reviewsCount > 0 ? `${item.reviewsCount} Reviews` : "Verified Rating"}
          </span>
        </div>
      </div>

      {/* Pricing Breakdown Card */}
      <div className="bg-white p-5 rounded-3xl border border-brand-100 shadow-xs space-y-3">
        <h3 className="font-serif font-bold text-base text-ink flex items-center gap-2">
          <span>💰</span> Rental Tariffs & Food Budgets
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {rental > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200">
              <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                Venue Rental Cost
              </span>
              <span className="text-xl font-bold text-amber-950 mt-1 block">
                ₹{rental.toLocaleString("en-IN")}
                <span className="text-xs text-muted font-normal"> / day</span>
              </span>
              <span className="text-[10px] text-amber-800 mt-1 block">
                Includes basic venue access & premises
              </span>
            </div>
          )}

          {vegPlate > 0 && (
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">
                Veg Food per Plate
              </span>
              <span className="text-xl font-bold text-emerald-950 mt-1 block">
                ₹{vegPlate}
                <span className="text-xs text-muted font-normal"> / plate</span>
              </span>
              <span className="text-[10px] text-emerald-800 mt-1 block">
                Includes starters, main course & desserts
              </span>
            </div>
          )}

          {nonVegPlate > 0 && (
            <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200">
              <span className="text-[10px] font-bold text-rose-900 uppercase tracking-wider block">
                Non-Veg Food per Plate
              </span>
              <span className="text-xl font-bold text-rose-950 mt-1 block">
                ₹{nonVegPlate}
                <span className="text-xs text-muted font-normal"> / plate</span>
              </span>
              <span className="text-[10px] text-rose-800 mt-1 block">
                Customizable non-veg menu package
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Spaces Breakdown */}
      {spaces.length > 0 && (
        <div className="bg-white p-5 rounded-3xl border border-brand-100 shadow-xs space-y-3">
          <h3 className="font-serif font-bold text-base text-ink flex items-center gap-2">
            <span>🏛️</span> Available Spaces & Settings
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {spaces.map((sp) => (
              <div
                key={sp}
                className="p-3 rounded-2xl bg-brand-50/50 border border-brand-100 flex items-center gap-2.5"
              >
                <span className="text-lg">
                  {sp === "Indoor" ? "🏛️" : sp === "Outdoor" ? "🌿" : sp === "Poolside" ? "🏊" : "🌇"}
                </span>
                <div>
                  <h4 className="text-xs font-bold text-ink">{sp}</h4>
                  <span className="text-[10px] text-muted">Ideal for ceremony & dining</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Features & Policies */}
      {features.length > 0 && (
        <div className="bg-white p-5 rounded-3xl border border-brand-100 shadow-xs space-y-3">
          <h3 className="font-serif font-bold text-base text-ink flex items-center gap-2">
            <span>✨</span> Facilities, Catering & Wedding Policies
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {features.map((feat) => (
              <div
                key={feat}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-surface border border-brand-50 text-xs font-medium text-ink"
              >
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                  ✓
                </span>
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

