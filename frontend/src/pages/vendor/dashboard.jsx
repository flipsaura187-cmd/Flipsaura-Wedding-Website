"use client";
import React, { useEffect, useState } from "react";
import Link from "@/compat/Link";
import api from "@/api/axios";
import { useAuth } from "@/context/AuthContext";

export default function VendorDashboard() {
  const { user: authUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [vendorItems, setVendorItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/api/vendor/stats"),
      api.get("/api/vendor/profile"),
      api.get("/api/items?limit=48&isVendor=true"),
    ])
      .then(([statsRes, profRes, itemsRes]) => {
        if (statsRes.data?.ok) {
          setStats(statsRes.data.data.stats);
        }
        if (profRes.data?.ok) {
          setProfileData(profRes.data.data);
        }
        if (itemsRes.data?.ok) {
          setVendorItems(itemsRes.data.data.items || []);
        }
      })
      .catch((err) => {
        console.error("Failed to load vendor dashboard data:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4" />
        <p className="text-muted text-base font-medium">Loading your vendor services & dashboard...</p>
      </div>
    );
  }

  const completion = profileData?.completion;
  const profile = profileData?.profile;
  const userPhone = profileData?.user?.phone || authUser?.phone || "";
  const cleanPhone = String(userPhone).replace(/\D/g, "").slice(-10);

  const isApproved = Boolean(
    stats?.isApproved ||
    (profile?.approved && profile?.verificationStatus === "approved") ||
    vendorItems.length > 0
  );

  const status = isApproved
    ? "approved"
    : profile?.verificationStatus || stats?.verificationStatus || "profile_incomplete";

  const hasHotelService = Boolean(
    profileData?.hasHotelService ||
    profile?.categories?.some((c) => c?.slug === "hotels" || (c?.name || "").toLowerCase().includes("hotel")) ||
    profile?.servicesList?.some((s) => (s?.categoryName || "").toLowerCase().includes("hotel")) ||
    vendorItems.some(
      (it) =>
        (it.category?.name || it.title || "").toLowerCase().includes("hotel") ||
        (it.category?.name || it.title || "").toLowerCase().includes("resort") ||
        it.roomCount > 0
    )
  );

  const displayBusinessName =
    profile?.businessName ||
    (vendorItems[0]?.title) ||
    authUser?.name ||
    "Vendor Partner";

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-wine tracking-tight">
              {displayBusinessName}
            </h1>
            {cleanPhone && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                <span>📱</span> +91 {cleanPhone}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm text-muted">
            {isApproved
              ? "Your services are active and visible to couples on FlipsAura. Manage listings, rooms, and bookings below."
              : "Welcome to FlipsAura! Review your services and complete profile verification to unlock more features."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold ${
              isApproved
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : status === "under_review"
                ? "bg-sky-50 text-sky-700 border border-sky-200"
                : status === "rejected"
                ? "bg-rose-50 text-rose-700 border border-rose-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            <span>
              {isApproved ? "🟢" : status === "under_review" ? "🔵" : status === "rejected" ? "🔴" : "🟡"}
            </span>
            {isApproved
              ? "Verified Vendor"
              : status === "under_review"
              ? "Under Review"
              : status === "rejected"
              ? "Action Required"
              : "Incomplete Profile"}
          </span>
        </div>
      </div>

      {/* Auto-Linked Active Services Notification Banner */}
      {vendorItems.length > 0 && (
        <div className="p-4 md:p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start gap-3">
            <span className="text-2xl mt-0.5">🎉</span>
            <div>
              <h3 className="font-bold text-sm md:text-base text-emerald-900">
                {vendorItems.length} {vendorItems.length === 1 ? "Service Listing" : "Service Listings"} Linked to Your Mobile Number
              </h3>
              <p className="text-xs md:text-sm text-emerald-800/90 mt-0.5">
                All venues and services matching <b className="font-bold">+91 {cleanPhone || "your phone"}</b> are automatically synced with your vendor portal.
              </p>
            </div>
          </div>
          <Link
            href="/vendor/items"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-2xs flex-shrink-0"
          >
            Manage Services →
          </Link>
        </div>
      )}

      {/* Active Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-line shadow-2xs hover:shadow-xs transition-shadow">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">
            Listed Services
          </span>
          <b className="text-3xl font-serif font-bold text-wine">
            {vendorItems.length || stats?.items || 0}
          </b>
          <p className="mt-2 text-xs text-muted">Active items and wedding packages</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-line shadow-2xs hover:shadow-xs transition-shadow">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">
            Client Bookings
          </span>
          <b className="text-3xl font-serif font-bold text-wine">{stats?.bookings || 0}</b>
          <p className="mt-2 text-xs text-muted">Total inquiries and confirmed dates</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-line shadow-2xs hover:shadow-xs transition-shadow">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">
            Total Revenue
          </span>
          <b className="text-3xl font-serif font-bold text-wine">
            ₹{(stats?.revenue || 0).toLocaleString("en-IN")}
          </b>
          <p className="mt-2 text-xs text-muted">Cumulative gross revenue earned</p>
        </div>
      </div>

      {/* ============================================================ */}
      {/* VENDOR'S SERVICES & VENUES SECTION (LINKED BY PHONE NUMBER) */}
      {/* ============================================================ */}
      <div className="bg-white rounded-2xl border border-line p-6 md:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🏪</span>
              <h2 className="font-serif text-xl md:text-2xl font-bold text-wine">
                My Listed Services & Venues
              </h2>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-muted">
              {cleanPhone
                ? `Services and listings linked to your mobile number +91 ${cleanPhone}`
                : "All services and venue listings managed under your vendor account."}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
              {vendorItems.length} {vendorItems.length === 1 ? "Service" : "Services"} Listed
            </span>
            <Link
              href="/vendor/items"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs transition-colors shadow-2xs"
            >
              <span>+</span> Manage All Services
            </Link>
          </div>
        </div>

        {vendorItems.length === 0 ? (
          <div className="py-12 px-4 text-center rounded-xl bg-surface/50 border border-dashed border-line">
            <div className="w-14 h-14 mx-auto rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-2xl mb-3">
              📦
            </div>
            <h3 className="font-semibold text-ink text-base mb-1">
              No services found for your mobile number yet
            </h3>
            <p className="text-muted text-xs sm:text-sm max-w-md mx-auto mb-5">
              {cleanPhone
                ? `When FlipsAura Admin adds a venue, hotel, or photography service with contact number +91 ${cleanPhone}, it will automatically appear here.`
                : "You have not listed any services yet."}
            </p>
            <Link
              href="/vendor/items"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs transition-colors shadow-2xs"
            >
              + Create Service Item
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {vendorItems.map((item) => {
              const categoryName = item.category?.name || "Wedding Service";
              const locationStr = [item.villageLocality || item.locality, item.city, item.state]
                .filter(Boolean)
                .join(", ") || item.city || "Location not specified";
              const isHotel =
                item.roomCount > 0 ||
                categoryName.toLowerCase().includes("hotel") ||
                categoryName.toLowerCase().includes("resort") ||
                item.title?.toLowerCase().includes("hotel") ||
                item.title?.toLowerCase().includes("resort");

              return (
                <div
                  key={item._id}
                  className="group bg-white rounded-2xl border border-line hover:border-brand-300 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                >
                  <div>
                    {/* Thumbnail Image */}
                    <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
                      {item.images?.[0] ? (
                        <img
                          src={item.images[0]}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                          <span className="text-3xl">🏛️</span>
                          <span className="text-xs mt-1 font-medium">No Image Uploaded</span>
                        </div>
                      )}

                      {/* Category Badge */}
                      <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 text-brand-800 shadow-sm backdrop-blur-xs">
                          {categoryName}
                        </span>
                      </div>

                      {/* Live Status Badge */}
                      <div className="absolute top-3 right-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                            item.active !== false && item.status !== "inactive"
                              ? "bg-emerald-500 text-white"
                              : "bg-gray-700 text-white"
                          }`}
                        >
                          {item.active !== false && item.status !== "inactive" ? "● Live" : "○ Draft"}
                        </span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-4 space-y-2.5">
                      <div>
                        <h4 className="font-bold text-ink text-base group-hover:text-brand-600 transition-colors line-clamp-1">
                          {item.title}
                        </h4>
                        <p className="text-xs text-muted flex items-center gap-1 mt-1">
                          <span>📍</span>
                          <span className="line-clamp-1">{locationStr}</span>
                        </p>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-1.5 text-[11px]">
                        {item.guestCapacity > 0 && (
                          <span className="bg-surface px-2 py-0.5 rounded-md text-ink/80 border border-line font-medium">
                            👥 Up to {item.guestCapacity} Guests
                          </span>
                        )}
                        {item.roomCount > 0 && (
                          <span className="bg-surface px-2 py-0.5 rounded-md text-ink/80 border border-line font-medium">
                            🛏️ {item.roomCount} Stay Rooms
                          </span>
                        )}
                        {item.contactPhone && (
                          <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200 font-semibold">
                            📞 {item.contactPhone}
                          </span>
                        )}
                      </div>

                      {/* Pricing */}
                      <div className="pt-2 border-t border-line flex items-baseline justify-between">
                        <span className="text-xs text-muted">Tariff / Price:</span>
                        <span className="font-bold text-sm text-wine">
                          {item.price > 0 ? `₹${item.price.toLocaleString("en-IN")}` : "Price on Request"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons Footer */}
                  <div className="p-3 bg-surface/50 border-t border-line flex items-center gap-2">
                    <Link
                      href={`/venues/${item._id}`}
                      className="flex-1 py-2 px-3 rounded-xl bg-white border border-line hover:border-brand-600 text-ink hover:text-brand-600 text-xs font-semibold text-center transition-colors shadow-2xs"
                    >
                      View Live ↗
                    </Link>
                    <Link
                      href="/vendor/items"
                      className="py-2 px-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold text-center transition-colors shadow-2xs"
                    >
                      Manage ✏️
                    </Link>
                    {isHotel && (
                      <Link
                        href="/vendor/rooms"
                        className="py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold text-center transition-colors shadow-2xs"
                        title="Manage Stay Rooms"
                      >
                        Rooms 🛏️
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Action Cards */}
      <div>
        <h3 className="font-serif text-lg md:text-xl font-bold text-ink mb-4">
          Quick Management Actions
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-6 rounded-2xl border border-line shadow-2xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center text-xl mb-3">
                📦
              </div>
              <h4 className="font-semibold text-ink text-base mb-1.5">Manage Services</h4>
              <p className="text-xs md:text-sm text-muted mb-4">
                Add new wedding packages, update prices, and edit service descriptions.
              </p>
            </div>
            <Link
              href="/vendor/items"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs transition-colors shadow-2xs"
            >
              Open My Items →
            </Link>
          </div>

          {hasHotelService && (
            <div className="bg-white p-6 rounded-2xl border border-line shadow-2xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center text-xl mb-3">
                  🛏️
                </div>
                <h4 className="font-semibold text-ink text-base mb-1.5">Manage Rooms</h4>
                <p className="text-xs md:text-sm text-muted mb-4">
                  Add Deluxe, Suite, AC rooms with per-night tariffs, guest capacities and amenities.
                </p>
              </div>
              <Link
                href="/vendor/rooms"
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs transition-colors shadow-2xs"
              >
                Manage Rooms →
              </Link>
            </div>
          )}

          <div className="bg-white p-6 rounded-2xl border border-line shadow-2xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center text-xl mb-3">
                📅
              </div>
              <h4 className="font-semibold text-ink text-base mb-1.5">Client Bookings</h4>
              <p className="text-xs md:text-sm text-muted mb-4">
                Review booking dates, customer contact information, and order statuses.
              </p>
            </div>
            <Link
              href="/vendor/bookings"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs transition-colors shadow-2xs"
            >
              View Bookings →
            </Link>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-line shadow-2xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl mb-3">
                🎨
              </div>
              <h4 className="font-semibold text-ink text-base mb-1.5">Portfolio Showcase</h4>
              <p className="text-xs md:text-sm text-muted mb-4">
                Upload new photos and reels from recent weddings to attract couples.
              </p>
            </div>
            <Link
              href="/vendor/onboarding?tab=portfolio"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-line hover:border-brand-600 text-ink hover:text-brand-600 font-medium text-xs transition-colors"
            >
              Manage Portfolio →
            </Link>
          </div>
        </div>
      </div>

      {/* Verification Milestone section if profile is incomplete */}
      {!isApproved && (
        <div
          className={`p-6 md:p-8 rounded-2xl border shadow-xs ${
            status === "rejected"
              ? "bg-rose-50/70 border-rose-200"
              : status === "under_review"
              ? "bg-sky-50/70 border-sky-200"
              : "bg-amber-50/60 border-amber-200"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="font-serif text-lg md:text-xl font-bold text-ink">
                Vendor Verification Progress
              </h3>
              <p className="mt-1 text-xs md:text-sm text-muted">
                Follow the verification milestones to complete onboarding.
              </p>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-brand-600">
                {completion?.percentage || 0}%
              </span>
              <span className="text-xs text-muted font-medium">Completed</span>
            </div>
          </div>

          <div className="w-full h-3 bg-white/80 rounded-full overflow-hidden border border-line mb-6">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full transition-all duration-500"
              style={{ width: `${completion?.percentage || 0}%` }}
            />
          </div>

          <Link
            href="/vendor/onboarding"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition-colors shadow-sm"
          >
            Complete Profile & KYC →
          </Link>
        </div>
      )}
    </div>
  );
}
