"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "@/compat/navigation";
import ServiceAmenities from "@/components/ServiceAmenities";
import api from "@/api/axios";
export default function ProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const [item, setItem] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showLightbox, setShowLightbox] = useState(false);

  // Review form state
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [user, setUser] = useState(null); // logged in user

  // Fetch item, reviews, and current user
  useEffect(() => {
    (async () => {
      try {
        const [itemRes, reviewRes, userRes] = await Promise.all([
          api.get(`/api/items/${id}`),
          api.get(`/api/reviews?itemId=${id}`),
          api.get("/api/auth/me") // adjust endpoint if needed
        ]);
        const itemData = itemRes.data;
        const reviewData = reviewRes.data;
        const userData = userRes.data;

        if (itemData.ok) setItem(itemData.data.item);
        if (reviewData.ok) setReviews(reviewData.data.reviews);
        if (userData.ok) setUser(userData.data.user);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Compute resolved facilities for this item/service
  const facilitiesList = useMemo(() => {
    if (!item) return [];
    if (Array.isArray(item.resolvedFacilities) && item.resolvedFacilities.length > 0) {
      return item.resolvedFacilities;
    }
    if (Array.isArray(item.facilities) && item.facilities.length > 0) {
      return item.facilities;
    }
    if (Array.isArray(item.vendor?.vendorProfile?.facilities)) {
      const itemCatId = String(item.category?._id || item.category || "");
      const itemCatSlug = (item.category?.slug || "").toLowerCase().trim();
      const itemCatName = (item.category?.name || "").toLowerCase().trim();

      return item.vendor.vendorProfile.facilities.filter((f) => {
        const fCatId = String(f.category?._id || f.category || "");
        const fCatSlug = (f.category?.slug || "").toLowerCase().trim();
        const fCatName = (f.categoryName || f.category?.name || "").toLowerCase().trim();
        if (!fCatId && !fCatName && !fCatSlug) return true;
        if (itemCatId && fCatId === itemCatId) return true;
        if (itemCatSlug && fCatSlug === itemCatSlug) return true;
        if (itemCatName && fCatName && (itemCatName === fCatName || itemCatName.includes(fCatName) || fCatName.includes(itemCatName))) return true;
        return false;
      });
    }
    return [];
  }, [item]);

  const handleBookingClick = () => {
    if (!user) {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      router.push(`/login?next=${returnUrl}`);
    } else {
      router.push(`/checkout?itemId=${item?._id}`);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      router.push("/login?next=" + encodeURIComponent(window.location.pathname));
      return;
    }
    if (rating === 0) {
      setSubmitError("Please select a rating");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      const { data } = await api.post("/api/reviews", { itemId: id, rating, comment });
      if (!data.ok) throw new Error(data.error || "Failed to submit");
      // Refresh reviews
      const { data: reviewData } = await api.get(`/api/reviews?itemId=${id}`);
      if (reviewData.ok) setReviews(reviewData.data.reviews);
      // Reset form
      setRating(0);
      setComment("");
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-container mx-auto px-4 py-20 text-center">
        <div className="py-20 text-brand-600 font-semibold animate-pulse text-lg">
          Loading wedding experience...
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-container mx-auto px-4 py-20 text-center">
        <div className="p-12 bg-brand-50 rounded-2xl border border-brand-100 text-muted text-lg">
          ✨ No such gem found.
        </div>
      </div>
    );
  }

  return (
    <>
      <main className="py-8 md:py-12 bg-white">
        <div className="max-w-container mx-auto px-4 sm:px-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs md:text-sm text-muted mb-8 flex-wrap">
            <button onClick={() => router.push("/")} className="hover:text-brand-600 transition-colors">
              Home
            </button>
            <span>›</span>
            <button
              onClick={() => router.push(`/categories/${item.category?.slug}`)}
              className="hover:text-brand-600 transition-colors"
            >
              {item.category?.name || "Listings"}
            </button>
            <span>›</span>
            <span className="font-semibold text-ink truncate max-w-xs">{item.title}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Gallery (Left: 7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div
                className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-brand-100 bg-brand-50 shadow-sm cursor-zoom-in group"
                onClick={() => setShowLightbox(true)}
              >
                {item.images?.[activeImage] ? (
                  <img
                    src={item.images[activeImage]}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted">
                    📸 No image available
                  </div>
                )}
                <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-xl text-xs font-semibold shadow group-hover:scale-110 transition-transform flex items-center gap-1 text-ink">
                  <span>🔍</span> Expand
                </div>
              </div>

              {/* Thumbnails */}
              {item.images?.length > 1 && (
                <div className="flex gap-3 overflow-x-auto py-2">
                  {item.images.map((src, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveImage(i)}
                      className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                        i === activeImage
                          ? "border-brand-600 shadow-md scale-105"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={src} alt={`thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Info Details below gallery on larger screens */}
              <div className="pt-6 space-y-6">
                <div>
                  <h3 className="font-serif text-xl font-bold text-ink mb-2">About this service</h3>
                  <p className="text-muted text-sm md:text-base leading-relaxed whitespace-pre-line">
                    {item.description || item.about}
                  </p>
                </div>

                {item.specifications?.length > 0 && (
                  <div className="pt-4 border-t border-brand-100">
                    <h3 className="font-serif text-xl font-bold text-ink mb-3">Specifications</h3>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-brand-50/60 rounded-2xl border border-brand-100">
                      {item.specifications.map((s, i) => (
                        <div key={i} className="flex flex-col">
                          <dt className="text-xs font-bold text-muted uppercase tracking-wider">{s.key}</dt>
                          <dd className="text-sm font-semibold text-ink">{s.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}

                {/* Categorized Amenities & Facilities */}
                <ServiceAmenities
                  facilities={facilitiesList}
                  categoryName={item.category?.name || "Service"}
                />
              </div>
            </div>

            {/* Sidebar Details & Booking (Right: 5 cols) */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-brand-100 shadow-xl shadow-brand-500/5 space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-semibold text-muted bg-brand-50 px-2.5 py-1 rounded-lg">
                      📍 {item.city || "Pan India"}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 font-bold text-xs rounded-lg border border-amber-200/60">
                      ★ {item.rating?.toFixed(1) || "New"} ({item.reviewsCount || 0})
                    </span>
                  </div>
                  <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink leading-snug">
                    {item.title}
                  </h1>
                </div>

                <div className="flex items-baseline gap-2 pt-2 border-t border-brand-50">
                  <span className="text-3xl font-bold text-brand-700">
                    ₹{item.price?.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-muted font-medium">starting price</span>
                </div>

                {item.resolvedCategoryService?.priceRange && (
                  <p className="text-xs text-muted font-medium -mt-2">
                    Pricing Model: <b className="text-ink font-semibold">{item.resolvedCategoryService.priceRange}</b>
                  </p>
                )}

                {item.resolvedCategoryService?.additionalServices?.length > 0 && (
                  <div className="pt-2">
                    <span className="text-xs font-bold text-ink uppercase tracking-wider block mb-1.5">
                      Included with this service:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.resolvedCategoryService.additionalServices.map((inc, idx) => (
                        <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                          ✓ {inc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {item.about && (
                  <p className="text-muted text-sm leading-relaxed">
                    {item.about}
                  </p>
                )}

                {/* Vendor Chip */}
                <div className="flex items-center gap-3 p-3.5 bg-brand-50/70 rounded-xl border border-brand-100">
                  <div className="w-10 h-10 rounded-full bg-brand-200/60 flex items-center justify-center text-lg text-brand-700 shrink-0">
                    👤
                  </div>
                  <div>
                    <h4 className="font-bold text-ink text-sm leading-tight">
                      {item.vendor?.businessName || "Trusted Wedding Partner"}
                    </h4>
                    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                      ✓ Verified Vendor
                    </span>
                  </div>
                </div>

                {/* Booking buttons */}
                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={handleBookingClick}
                    className="w-full py-3.5 px-4 rounded-xl text-white font-bold text-base bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 shadow-lg shadow-brand-500/25 transition-all cursor-pointer"
                  >
                    {user ? "Confirm Booking →" : "Login to Book →"}
                  </button>

                  {item.contactPhone && (
                    <a
                      href={`tel:${item.contactPhone}`}
                      className="w-full py-3 px-4 rounded-xl text-ink font-semibold text-sm bg-white hover:bg-brand-50 border border-brand-200 text-center block transition-all"
                    >
                      📞 Call Vendor ({item.contactPhone})
                    </a>
                  )}
                </div>

                <div className="text-center text-xs text-muted pt-2 border-t border-brand-50">
                  ✅ Safe Payments &nbsp;|&nbsp; 🔒 100% Verified Service
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <section className="mt-16 pt-12 border-t border-brand-100">
            <div className="max-w-3xl mb-10">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1 block">
                Feedback
              </span>
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-ink">
                ❤️ Real couples, real words
              </h2>
            </div>

            {/* Review Form Card */}
            <div className="bg-brand-50/60 p-6 sm:p-8 rounded-2xl border border-brand-100 mb-10 max-w-2xl">
              <h3 className="font-serif text-lg font-bold text-ink mb-4">Share your experience</h3>
              {user ? (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-2">
                      Your Rating
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                            star <= rating
                              ? "bg-amber-400 text-white shadow"
                              : "bg-white text-slate-300 border border-brand-200 hover:border-amber-400"
                          }`}
                          onClick={() => setRating(star)}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                      Your Review
                    </label>
                    <textarea
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="What did you like about this wedding service?"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  {submitError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                      {submitError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 shadow-md shadow-brand-500/20 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {submitting ? "Submitting..." : "Submit Review"}
                  </button>
                </form>
              ) : (
                <div className="p-4 bg-white rounded-xl border border-brand-200 text-sm text-muted flex items-center gap-2">
                  <span>🔐</span>
                  <span>
                    Please{" "}
                    <button
                      onClick={() => router.push("/login?next=" + encodeURIComponent(window.location.pathname))}
                      className="text-brand-700 font-bold underline cursor-pointer"
                    >
                      log in
                    </button>{" "}
                    to leave a verified review.
                  </span>
                </div>
              )}
            </div>

            {/* Existing Reviews */}
            {reviews.length === 0 ? (
              <div className="p-8 text-center bg-brand-50/40 rounded-2xl border border-brand-100 text-muted text-sm">
                ✨ Be the first couple to share your review for this service!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reviews.map((r) => (
                  <div
                    key={r._id}
                    className="bg-white p-6 rounded-2xl border border-brand-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className="flex gap-1 text-amber-400 text-sm mb-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={i < r.rating ? "text-amber-400" : "text-slate-200"}>
                            ★
                          </span>
                        ))}
                      </div>
                      <p className="text-muted italic text-sm leading-relaxed">
                        “{r.comment}”
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-brand-50 flex items-center gap-2 text-xs font-bold text-ink">
                      <span>👰</span>
                      <span>{r.name || "Happy Couple"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Lightbox Modal */}
      {showLightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowLightbox(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={item.images[activeImage]}
              alt={item.title}
              className="max-h-[80vh] w-auto object-contain rounded-2xl shadow-2xl"
            />
            <button
              onClick={() => setShowLightbox(false)}
              className="absolute -top-12 right-0 text-white hover:text-brand-300 text-2xl font-bold p-2"
            >
              ✕
            </button>
            <div className="flex gap-4 mt-4">
              {activeImage > 0 && (
                <button
                  onClick={() => setActiveImage((prev) => prev - 1)}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-bold text-sm rounded-xl backdrop-blur-sm"
                >
                  ← Prev
                </button>
              )}
              {activeImage < (item.images?.length || 1) - 1 && (
                <button
                  onClick={() => setActiveImage((prev) => prev + 1)}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-bold text-sm rounded-xl backdrop-blur-sm"
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
