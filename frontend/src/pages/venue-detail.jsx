"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "@/compat/navigation";
import Link from "@/compat/Link";
import api from "@/api/axios";
import VenueOverviewSection from "@/components/VenueOverviewSection";

export default function VenueDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [similarVenues, setSimilarVenues] = useState([]);

  // Inquiry modal / state
  const [inquiryName, setInquiryName] = useState("");
  const [inquiryPhone, setInquiryPhone] = useState("");
  const [inquiryDate, setInquiryDate] = useState("");
  const [inquiryGuests, setInquiryGuests] = useState("");
  const [inquirySent, setInquirySent] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchVenue = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await api.get(`/api/items/${id}`);
        if (data?.ok && data.data) {
          setVenue(data.data);

          // Fetch similar venues in the same city or category
          try {
            const city = data.data.city || "";
            const simRes = await api.get(`/api/items?category=venues&limit=4`);
            if (simRes.data?.ok) {
              const list = simRes.data.data.items || [];
              setSimilarVenues(list.filter((item) => String(item._id) !== String(id)).slice(0, 3));
            }
          } catch {
            // Ignore similar error
          }
        } else {
          setError("Venue not found.");
        }
      } catch (err) {
        console.error("Failed to load venue:", err);
        setError(err.response?.data?.error || "Failed to load venue details.");
      } finally {
        setLoading(false);
      }
    };

    fetchVenue();
  }, [id]);

  const images = useMemo(() => {
    if (Array.isArray(venue?.images) && venue.images.length > 0) {
      return venue.images;
    }
    return ["/images/categories/venues.jpg"];
  }, [venue]);

  const rental = venue?.rentalPrice || venue?.price || 0;
  const vegPlate = venue?.pricePerPlateVeg || 0;
  const nonVegPlate = venue?.pricePerPlateNonVeg || 0;
  const guestCap = venue?.guestCapacity || venue?.capacity || 0;
  const seating = venue?.seatingCapacity || 0;
  const floating = venue?.floatingCapacity || 0;
  const rooms = venue?.roomCount || 0;
  const spaces = Array.isArray(venue?.spaceTypes) ? venue.spaceTypes : [];
  const features = Array.isArray(venue?.venueFeatures)
    ? venue.venueFeatures
    : Array.isArray(venue?.facilities)
    ? venue.facilities
    : [];

  const vendorPhone = venue?.contactPhone || venue?.vendor?.phone || "919876543210";

  const handleSendWhatsAppInquiry = (e) => {
    e.preventDefault();
    const msg = `Hello! I am inquiring about ${venue?.title || "Venue"} on FlipsAura.
Name: ${inquiryName || "Guest"}
Contact: ${inquiryPhone || "N/A"}
Event Date: ${inquiryDate || "To be decided"}
Expected Guests: ${inquiryGuests || guestCap || "100-500"}
Please share availability and final quote.`;

    const cleanPhone = vendorPhone.replace(/[^\d]/g, "");
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
    setInquirySent(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4" />
        <p className="font-serif text-lg text-ink font-semibold animate-pulse">
          Loading Luxury Venue Details...
        </p>
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="min-h-[70vh] bg-surface flex flex-col items-center justify-center p-6 text-center">
        <div className="text-5xl mb-4">🏛️</div>
        <h2 className="font-serif text-2xl font-bold text-ink mb-2">Venue Not Found</h2>
        <p className="text-muted text-sm max-w-md mb-6">
          {error || "The venue you are looking for does not exist or may have been unlisted."}
        </p>
        <Link
          href="/venues"
          className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md transition"
        >
          ← Browse All Venues
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* TOP BREADCRUMB */}
      <div className="bg-white border-b border-brand-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 text-xs text-muted truncate">
          <Link href="/" className="hover:text-brand-600 transition">Home</Link>
          <span>/</span>
          <Link href="/venues" className="hover:text-brand-600 transition">Wedding Venues</Link>
          <span>/</span>
          <span className="text-brand-700 font-semibold truncate">{venue.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-50 text-brand-800 border border-brand-200 text-xs font-bold uppercase tracking-wider">
                🏛️ {venue.venueType || "Wedding Venue"}
              </span>

              {venue.featured && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold uppercase tracking-wider">
                  ★ Featured Property
                </span>
              )}

              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                ✓ Verified Partner
              </span>
            </div>

            <h1 className="font-serif text-2xl sm:text-4xl font-bold text-ink">
              {venue.title}
            </h1>

            <p className="text-sm text-muted flex items-center gap-1.5 mt-1.5">
              <span>📍</span>
              <span>
                {[venue.locality, venue.city, venue.state].filter(Boolean).join(", ") || "Bihar, India"}
              </span>
              {venue.pincode && <span>- {venue.pincode}</span>}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-end">
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-2xl">
              <span className="text-amber-500 font-bold text-lg">★</span>
              <div>
                <span className="text-sm font-bold text-amber-950 block leading-tight">
                  {venue.rating?.toFixed ? venue.rating.toFixed(1) : venue.rating || "4.8"}
                </span>
                <span className="text-[10px] text-amber-800 leading-none">
                  {venue.reviewsCount > 0 ? `${venue.reviewsCount} Reviews` : "Customer Rating"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: venue.title,
                    text: `Check out ${venue.title} on FlipsAura!`,
                    url: window.location.href,
                  });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Link copied to clipboard!");
                }
              }}
              className="p-2.5 rounded-2xl bg-white border border-brand-200 text-brand-700 hover:bg-brand-50 text-sm font-semibold transition cursor-pointer"
              title="Share Venue"
            >
              📤
            </button>
          </div>
        </div>

        {/* PHOTO GALLERY */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-8">
          {/* Main Large Image */}
          <div className="md:col-span-8 lg:col-span-9 aspect-[16/10] sm:aspect-[16/9] rounded-3xl overflow-hidden bg-slate-100 border border-brand-100 shadow-sm relative group">
            <img
              src={images[activeImgIndex] || images[0]}
              alt={venue.title}
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/images/categories/venues.jpg";
              }}
            />
            <div className="absolute bottom-4 left-4 bg-ink/75 backdrop-blur-xs text-white text-xs px-3 py-1.5 rounded-xl font-medium shadow-md">
              {venue.title} • Photo {activeImgIndex + 1} of {images.length}
            </div>
          </div>

          {/* Thumbnail list */}
          <div className="md:col-span-4 lg:col-span-3 flex md:flex-col gap-2.5 overflow-x-auto md:overflow-y-auto max-h-[440px] pb-2 md:pb-0 scrollbar-thin">
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImgIndex(idx)}
                className={`relative rounded-2xl overflow-hidden border-2 shrink-0 h-20 md:h-24 w-32 md:w-full transition-all cursor-pointer ${
                  idx === activeImgIndex
                    ? "border-brand-600 shadow-md ring-2 ring-brand-400/30 scale-102"
                    : "border-transparent opacity-75 hover:opacity-100"
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
        </div>

        {/* MAIN CONTENT + STICKY SIDEBAR */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: 8 COLS */}
          <div className="lg:col-span-8 space-y-8">
            {/* Rich Overview Section */}
            <VenueOverviewSection item={venue} />

            {/* DESCRIPTION & ABOUT */}
            {(venue.description || venue.about) && (
              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-brand-100 shadow-xs space-y-3">
                <h3 className="font-serif text-xl font-bold text-ink flex items-center gap-2">
                  <span>🏛️</span> About {venue.title}
                </h3>
                <p className="text-ink/80 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                  {venue.description || venue.about}
                </p>
              </div>
            )}

            {/* DETAILED FEATURES & RULES */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-brand-100 shadow-xs space-y-4">
              <h3 className="font-serif text-xl font-bold text-ink flex items-center gap-2">
                <span>✨</span> Venue Features, Policies & Amenities
              </h3>
              <p className="text-xs text-muted">
                Everything available at this venue for your wedding, reception, and guest comfort.
              </p>

              {features.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {features.map((feat) => (
                    <div
                      key={feat}
                      className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs sm:text-sm font-medium text-ink"
                    >
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                        ✓
                      </span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted">Facilities provided upon request.</p>
              )}
            </div>

            {/* SPACES & LAYOUT */}
            {spaces.length > 0 && (
              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-brand-100 shadow-xs space-y-4">
                <h3 className="font-serif text-xl font-bold text-ink flex items-center gap-2">
                  <span>🌆</span> Event Spaces Available
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {spaces.map((sp) => (
                    <div
                      key={sp}
                      className="p-4 rounded-2xl bg-gradient-to-br from-brand-50/50 to-white border border-brand-100 space-y-1.5"
                    >
                      <div className="flex items-center gap-2 text-base font-bold text-ink">
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
                        <span>{sp} Space</span>
                      </div>
                      <p className="text-xs text-muted">
                        {sp === "Indoor"
                          ? "Fully air-conditioned banquet hall ideal for main wedding ceremonies & dining."
                          : sp === "Outdoor"
                          ? "Open-air lush lawn perfect for grand receptions, stage, and buffet stalls."
                          : sp === "Poolside"
                          ? "Vibrant poolside setting suitable for haldi, cocktail & mehendi celebrations."
                          : "Panoramic open terrace setting for intimate gatherings & sunset ceremonies."}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LOCATION DETAILS */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-brand-100 shadow-xs space-y-3">
              <h3 className="font-serif text-xl font-bold text-ink flex items-center gap-2">
                <span>📍</span> Location & Address
              </h3>
              <p className="text-sm text-ink/90 font-medium">
                {venue.address || "Main Road"}
                <br />
                {venue.locality ? `${venue.locality}, ` : ""}
                {venue.city || "Aurangabad"}, {venue.state || "Bihar"}
                {venue.pincode ? ` - ${venue.pincode}` : ""}
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: 4 COLS STICKY INQUIRY BOX */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-5">
            <div className="bg-white p-6 rounded-3xl border border-brand-200 shadow-xl shadow-brand-500/5 space-y-5">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted block">
                  Rental Tariff
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold text-brand-700">
                    ₹{rental > 0 ? rental.toLocaleString("en-IN") : "Price on Request"}
                  </span>
                  {rental > 0 && <span className="text-xs text-muted">/ day</span>}
                </div>
              </div>

              {/* Plate Pricing preview */}
              {(vegPlate > 0 || nonVegPlate > 0) && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
                    Food & Catering Packages
                  </span>
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-emerald-800 flex items-center gap-1">
                      <span>🥦 Veg:</span> ₹{vegPlate}/plate
                    </span>
                    {nonVegPlate > 0 && (
                      <span className="text-rose-800 flex items-center gap-1">
                        <span>🍗 Non-Veg:</span> ₹{nonVegPlate}/plate
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* QUICK INQUIRY FORM */}
              <form onSubmit={handleSendWhatsAppInquiry} className="space-y-3 pt-2">
                <div>
                  <label className="text-[11px] font-bold text-muted block mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={inquiryName}
                    onChange={(e) => setInquiryName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-muted block mb-1">WhatsApp Mobile Number</label>
                  <input
                    type="tel"
                    required
                    value={inquiryPhone}
                    onChange={(e) => setInquiryPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-muted block mb-1">Event Date</label>
                    <input
                      type="date"
                      value={inquiryDate}
                      onChange={(e) => setInquiryDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-brand-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-muted block mb-1">Guests</label>
                    <input
                      type="number"
                      value={inquiryGuests}
                      onChange={(e) => setInquiryGuests(e.target.value)}
                      placeholder="e.g. 400"
                      className="w-full px-3 py-2 rounded-xl border border-brand-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>💬</span> Inquire on WhatsApp
                </button>

                {inquirySent && (
                  <p className="text-center text-xs font-semibold text-emerald-700">
                    WhatsApp chat opened with venue!
                  </p>
                )}
              </form>

              {/* Call Venue Direct */}
              {vendorPhone && (
                <a
                  href={`tel:${vendorPhone}`}
                  className="w-full py-2.5 rounded-2xl bg-white border border-brand-200 hover:bg-brand-50 text-brand-700 font-bold text-xs transition flex items-center justify-center gap-2 text-center"
                >
                  <span>📞</span> Call Venue: {vendorPhone}
                </a>
              )}
            </div>

            {/* TRUST BADGE */}
            <div className="bg-brand-50/50 p-4 rounded-2xl border border-brand-100 text-xs text-ink/80 space-y-2">
              <div className="font-bold text-brand-900 flex items-center gap-1.5">
                <span>🛡️</span> FlipsAura Booking Guarantee
              </div>
              <p className="text-[11px] text-muted leading-relaxed">
                Direct vendor pricing with zero commission markup. 100% verified property photos & genuine customer ratings.
              </p>
            </div>
          </div>
        </div>

        {/* SIMILAR VENUES */}
        {similarVenues.length > 0 && (
          <div className="mt-14 pt-10 border-t border-brand-100">
            <h3 className="font-serif text-2xl font-bold text-ink mb-6">
              More Wedding Venues in {venue.city || "Bihar"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {similarVenues.map((sv) => (
                <Link
                  key={sv._id}
                  href={`/venue_details/${sv._id}`}
                  className="group bg-white rounded-2xl border border-brand-100 overflow-hidden shadow-xs hover:shadow-lg transition-all"
                >
                  <div className="aspect-[16/10] bg-slate-100 overflow-hidden">
                    <img
                      src={sv.images?.[0] || "/images/categories/venues.jpg"}
                      alt={sv.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4 space-y-1">
                    <p className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">
                      {sv.venueType || "Banquet Hall"}
                    </p>
                    <h4 className="font-serif font-bold text-base text-ink line-clamp-1 group-hover:text-brand-600 transition-colors">
                      {sv.title}
                    </h4>
                    <p className="text-xs text-muted truncate">📍 {sv.locality || sv.city || "Bihar"}</p>
                    <p className="text-sm font-bold text-brand-700 pt-1">
                      ₹{(sv.rentalPrice || sv.price || 0).toLocaleString("en-IN")} / day
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

