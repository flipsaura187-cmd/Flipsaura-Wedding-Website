"use client";
import React, { useState } from "react";
import Link from "@/compat/Link";

export default function AdminVenueDetailsModal({
  isOpen,
  onClose,
  venue,
  onEdit,
}) {
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  if (!isOpen || !venue) return null;

  const images = Array.isArray(venue.images) && venue.images.length > 0
    ? venue.images
    : ["/images/categories/venues.jpg"];

  const activeImage = images[activeImgIndex] || images[0];
  const guestCap = venue.guestCapacity || venue.capacity || 0;
  const seating = venue.seatingCapacity || 0;
  const floating = venue.floatingCapacity || 0;
  const rooms = venue.roomCount || 0;
  const rental = venue.rentalPrice || venue.price || 0;
  const vegPlate = venue.pricePerPlateVeg || 0;
  const nonVegPlate = venue.pricePerPlateNonVeg || 0;
  const spaces = Array.isArray(venue.spaceTypes) ? venue.spaceTypes : [];
  const features = Array.isArray(venue.venueFeatures)
    ? venue.venueFeatures
    : Array.isArray(venue.facilities)
    ? venue.facilities
    : [];

  const vendorName = venue.vendor?.name || venue.vendorName || "FlipsAura Venue Partner";
  const vendorPhone = venue.contactPhone || venue.vendor?.phone || "";
  const vendorEmail = venue.contactEmail || venue.vendor?.email || "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-ink/70 backdrop-blur-xs overflow-y-auto">
      <div
        className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-brand-100 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* HEADER */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-brand-50 via-white to-brand-50/40 border-b border-brand-100 flex items-start justify-between gap-3 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-600 text-white text-[10px] font-bold uppercase tracking-wider">
                🏛️ {venue.venueType || "Wedding Venue"}
              </span>

              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  venue.active
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-slate-100 text-slate-700 border border-slate-200"
                }`}
              >
                ● {venue.active ? "Active Listing" : "Hidden Listing"}
              </span>

              {venue.featured && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
                  ★ Featured
                </span>
              )}

              <span className="text-[11px] text-muted">
                ID: <span className="font-mono text-ink/70">{venue._id}</span>
              </span>
            </div>

            <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink truncate">
              {venue.title}
            </h2>

            <p className="text-xs text-muted flex items-center gap-1.5 mt-0.5 truncate">
              <span>📍</span>
              <span className="truncate">
                {[venue.locality, venue.city, venue.state].filter(Boolean).join(", ") || "Bihar, India"}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-base transition-colors shrink-0 cursor-pointer"
            title="Close details"
          >
            ✕
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* PHOTO GALLERY */}
          <div className="space-y-3">
            <div className="relative aspect-[16/9] sm:aspect-[21/9] rounded-2xl overflow-hidden bg-slate-100 border border-brand-100 shadow-inner">
              <img
                src={activeImage}
                alt={venue.title}
                className="w-full h-full object-cover transition-transform duration-500"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/images/categories/venues.jpg";
                }}
              />
              <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded-lg">
                Photo {activeImgIndex + 1} of {images.length}
              </div>
            </div>

            {/* Thumbnails row */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImgIndex(idx)}
                    className={`relative w-16 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                      idx === activeImgIndex
                        ? "border-brand-600 shadow-md scale-105"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/images/categories/venues.jpg";
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 4 CORE METRIC CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Guest Capacity */}
            <div className="p-3.5 rounded-2xl bg-brand-50/60 border border-brand-100">
              <span className="text-xl mb-1 block">👥</span>
              <span className="text-[11px] font-medium text-brand-900 block">Guest Capacity</span>
              <span className="text-base sm:text-lg font-bold text-ink block">
                {guestCap > 0 ? `${guestCap} Guests` : "Flexible"}
              </span>
              <span className="text-[10px] text-muted block mt-0.5">
                {seating > 0 ? `${seating} Seating` : "Seating custom"}
                {floating > 0 ? ` • ${floating} Floating` : ""}
              </span>
            </div>

            {/* Room Count */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100">
              <span className="text-xl mb-1 block">🛏️</span>
              <span className="text-[11px] font-medium text-indigo-900 block">Stay Rooms</span>
              <span className="text-base sm:text-lg font-bold text-indigo-950 block">
                {rooms > 0 ? `${rooms} Rooms` : "Available on request"}
              </span>
              <span className="text-[10px] text-indigo-700 block mt-0.5">
                AC / Baraat & Bridal rooms
              </span>
            </div>

            {/* Rental Tariff */}
            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200">
              <span className="text-xl mb-1 block">💰</span>
              <span className="text-[11px] font-medium text-amber-900 block">Full Day Rental</span>
              <span className="text-base sm:text-lg font-bold text-amber-950 block">
                {rental > 0 ? `₹${rental.toLocaleString("en-IN")}` : "On Request"}
              </span>
              <span className="text-[10px] text-amber-800 block mt-0.5">Venue space tariff / day</span>
            </div>

            {/* Food Plate Pricing */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
              <span className="text-xl mb-1 block">🍽️</span>
              <span className="text-[11px] font-medium text-emerald-900 block">Plate Pricing</span>
              <div className="text-xs font-bold text-emerald-950 space-y-0.5 mt-0.5">
                <div>Veg: {vegPlate > 0 ? `₹${vegPlate}/plate` : "N/A"}</div>
                {nonVegPlate > 0 && <div>Non-Veg: ₹{nonVegPlate}/plate</div>}
              </div>
            </div>
          </div>

          {/* SPACES & SETTINGS */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <span>🏛️</span> Available Spaces & Event Areas
            </h4>
            {spaces.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {spaces.map((sp) => (
                  <span
                    key={sp}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-brand-100 text-xs font-semibold text-ink shadow-2xs"
                  >
                    <span>
                      {sp === "Indoor"
                        ? "🏛️"
                        : sp === "Outdoor"
                        ? "🌿"
                        : sp === "Poolside"
                        ? "🏊"
                        : sp === "Terrace"
                        ? "🌇"
                        : "⛲"}
                    </span>
                    {sp}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted">Standard Indoor Banquet Hall setting</p>
            )}
          </div>

          {/* FEATURES, POLICIES & AMENITIES */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <span>✨</span> Venue Features, Amenities & Policies
            </h4>
            {features.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                {features.map((feat) => (
                  <div
                    key={feat}
                    className="flex items-center gap-2 p-2 rounded-xl bg-white border border-brand-100 text-xs text-ink/90 font-medium shadow-2xs"
                  >
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span className="truncate">{feat}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted">No specific amenities configured yet.</p>
            )}
          </div>

          {/* ABOUT & DESCRIPTION */}
          {(venue.description || venue.about) && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span>📝</span> Description & About Venue
              </h4>
              <p className="text-xs sm:text-sm text-ink/80 leading-relaxed whitespace-pre-line">
                {venue.description || venue.about}
              </p>
            </div>
          )}

          {/* LOCATION & VENDOR CONTACT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Location */}
            <div className="p-4 rounded-2xl bg-brand-50/40 border border-brand-100 space-y-1.5 text-xs">
              <h4 className="font-bold uppercase tracking-wider text-brand-900 flex items-center gap-1.5">
                <span>📍</span> Location Details
              </h4>
              <div className="text-ink/80 space-y-0.5 pt-1">
                <p className="font-medium">{venue.address || "Main Road"}</p>
                <p>
                  {venue.locality ? `${venue.locality}, ` : ""}
                  {venue.city || "Aurangabad"}, {venue.state || "Bihar"}
                  {venue.pincode ? ` - ${venue.pincode}` : ""}
                </p>
              </div>
            </div>

            {/* Vendor / Contact */}
            <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-1.5 text-xs">
              <h4 className="font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                <span>📞</span> Vendor Contact
              </h4>
              <div className="text-ink/80 space-y-0.5 pt-1">
                <p className="font-bold text-ink">{vendorName}</p>
                {vendorPhone && (
                  <p className="flex items-center gap-1.5">
                    <span>📱</span>
                    <a href={`tel:${vendorPhone}`} className="hover:text-brand-600 underline">
                      {vendorPhone}
                    </a>
                  </p>
                )}
                {vendorEmail && (
                  <p className="flex items-center gap-1.5 truncate">
                    <span>✉️</span>
                    <a href={`mailto:${vendorEmail}`} className="hover:text-brand-600 truncate underline">
                      {vendorEmail}
                    </a>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-brand-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/venue_details/${venue._id}`}
              target="_blank"
              className="px-4 py-2 rounded-xl bg-white border border-brand-200 text-brand-700 hover:bg-brand-50 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
              title="Open public page in new tab"
            >
              <span>🌐</span> View Public Page (/venue_details) ↗
            </Link>

            {vendorPhone && (
              <a
                href={`https://wa.me/${vendorPhone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(
                  `Hello, inquiring about ${venue.title} on FlipsAura.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold transition flex items-center gap-1"
              >
                <span>💬</span> WhatsApp Inquiry
              </a>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onEdit) onEdit(venue);
              }}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>✏️</span> Edit Venue
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

