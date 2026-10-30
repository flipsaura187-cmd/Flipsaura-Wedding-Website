"use client";
import React, { useState } from "react";
import Link from "@/compat/Link";

export default function AdminHotelDetailsModal({
  isOpen,
  onClose,
  hotel,
  rooms = [],
  onManageRooms,
  onAddRoom,
  onEditHotel,
}) {
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  if (!isOpen || !hotel) return null;

  const images = Array.isArray(hotel.images) && hotel.images.length > 0
    ? hotel.images
    : ["/images/categories/hotels.jpg"];

  const activeImage = images[activeImgIndex] || images[0];
  const hotelRooms = rooms.filter(
    (r) => String(r.hotelId || r.hotel?._id || r.hotel) === String(hotel._id)
  );

  const vendorName = hotel.vendor?.name || hotel.vendorName || "FlipsAura Hotel Partner";
  const vendorPhone = hotel.vendorPhone || hotel.contactPhone || hotel.vendor?.phone || "";
  const vendorEmail = hotel.vendorEmail || hotel.contactEmail || hotel.vendor?.email || "";

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
                🏨 Hotel Property
              </span>

              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  hotel.active !== false
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-slate-100 text-slate-700 border border-slate-200"
                }`}
              >
                ● {hotel.active !== false ? "Active Property" : "Inactive"}
              </span>

              <span className="text-[11px] text-muted">
                ID: <span className="font-mono text-ink/70">{hotel._id}</span>
              </span>
            </div>

            <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink truncate">
              {hotel.title}
            </h2>

            <p className="text-xs text-muted flex items-center gap-1.5 mt-0.5 truncate">
              <span>📍</span>
              <span className="truncate">
                {[hotel.locality, hotel.city, hotel.state].filter(Boolean).join(", ") || "Bihar, India"}
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
                alt={hotel.title}
                className="w-full h-full object-cover transition-transform duration-500"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/images/categories/hotels.jpg";
                }}
              />
              <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded-lg">
                Photo {activeImgIndex + 1} of {images.length}
              </div>
            </div>

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
                        e.currentTarget.src = "/images/categories/hotels.jpg";
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 4 CORE METRIC CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-brand-50/60 border border-brand-100">
              <span className="text-xl mb-1 block">🛏️</span>
              <span className="text-[11px] font-medium text-brand-900 block">Rooms Inventory</span>
              <span className="text-base sm:text-lg font-bold text-ink block">
                {hotelRooms.length} Room Types
              </span>
              <span className="text-[10px] text-muted block mt-0.5">
                {hotelRooms.reduce((acc, r) => acc + (Number(r.roomCount) || 1), 0)} Total Units
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200">
              <span className="text-xl mb-1 block">💰</span>
              <span className="text-[11px] font-medium text-amber-900 block">Starting Tariff</span>
              <span className="text-base sm:text-lg font-bold text-amber-950 block">
                ₹{hotel.startingTariff || hotel.price || 0}
              </span>
              <span className="text-[10px] text-amber-800 block mt-0.5">Per night / room</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100">
              <span className="text-xl mb-1 block">⭐</span>
              <span className="text-[11px] font-medium text-indigo-900 block">Rating & Reviews</span>
              <span className="text-base sm:text-lg font-bold text-indigo-950 block">
                ★ {hotel.rating?.toFixed ? hotel.rating.toFixed(1) : hotel.rating || "4.5"}
              </span>
              <span className="text-[10px] text-indigo-700 block mt-0.5">
                {hotel.reviewsCount || 0} Customer Reviews
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
              <span className="text-xl mb-1 block">📍</span>
              <span className="text-[11px] font-medium text-emerald-900 block">City & District</span>
              <span className="text-sm sm:text-base font-bold text-emerald-950 truncate block mt-0.5">
                {hotel.city || "Aurangabad"}
              </span>
              <span className="text-[10px] text-emerald-700 block mt-0.5">{hotel.locality || "Bihar"}</span>
            </div>
          </div>

          {/* ROOMS TABLE INVENTORY */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span>🛏️</span> Associated Room Inventories ({hotelRooms.length})
              </h4>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onAddRoom) onAddRoom(hotel._id);
                }}
                className="px-3 py-1 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition cursor-pointer"
              >
                + Add Room
              </button>
            </div>

            {hotelRooms.length > 0 ? (
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl bg-white overflow-hidden text-xs">
                {hotelRooms.map((rm) => (
                  <div key={rm._id} className="p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                        <img
                          src={rm.images?.[0] || "/images/categories/hotels.jpg"}
                          alt={rm.roomName || rm.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-ink">{rm.roomName || rm.title}</p>
                        <p className="text-[11px] text-muted">
                          {rm.bedType || "Double Bed"} • Max {rm.maxGuests || 2} Guests • {rm.roomCount || 1} Rooms
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-brand-700 block">
                        ₹{rm.pricePerNight || rm.price} / night
                      </span>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          rm.active !== false ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {rm.active !== false ? "Available" : "Hidden"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center bg-white rounded-xl border border-dashed border-slate-300 text-xs text-muted">
                No rooms added for this hotel yet.
              </div>
            )}
          </div>

          {/* AMENITIES */}
          {Array.isArray(hotel.facilities) && hotel.facilities.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span>✨</span> Hotel Facilities & Services
              </h4>
              <div className="flex flex-wrap gap-2 pt-1">
                {hotel.facilities.map((fac, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-brand-100 text-xs font-medium text-ink shadow-2xs"
                  >
                    <span className="text-emerald-600 font-bold">✓</span> {fac}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* DESCRIPTION */}
          {(hotel.description || hotel.about) && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span>📝</span> Property Overview
              </h4>
              <p className="text-xs sm:text-sm text-ink/80 leading-relaxed whitespace-pre-line">
                {hotel.description || hotel.about}
              </p>
            </div>
          )}

          {/* LOCATION & VENDOR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-brand-50/40 border border-brand-100 space-y-1.5 text-xs">
              <h4 className="font-bold uppercase tracking-wider text-brand-900 flex items-center gap-1.5">
                <span>📍</span> Hotel Address
              </h4>
              <p className="text-ink/80">
                {hotel.address || "Main Road"}
                <br />
                {hotel.locality ? `${hotel.locality}, ` : ""}
                {hotel.city || "Aurangabad"}, {hotel.state || "Bihar"}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-1.5 text-xs">
              <h4 className="font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                <span>📞</span> Vendor Information
              </h4>
              <div className="text-ink/80 space-y-0.5">
                <p className="font-bold text-ink">{vendorName}</p>
                {vendorPhone && <p>📱 {vendorPhone}</p>}
                {vendorEmail && <p>✉️ {vendorEmail}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-brand-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/product/${hotel._id}`}
              target="_blank"
              className="px-4 py-2 rounded-xl bg-white border border-brand-200 text-brand-700 hover:bg-brand-50 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
            >
              <span>🌐</span> Public Page ↗
            </Link>

            <button
              type="button"
              onClick={() => {
                onClose();
                if (onManageRooms) onManageRooms(hotel._id);
              }}
              className="px-3.5 py-2 rounded-xl bg-brand-50 border border-brand-200 text-brand-800 hover:bg-brand-100 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>🛏️</span> Manage Rooms
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onEditHotel) onEditHotel(hotel);
              }}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>✏️</span> Edit Hotel
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

