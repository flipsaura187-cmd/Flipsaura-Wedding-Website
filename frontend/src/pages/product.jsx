"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "@/compat/navigation";
import { useDispatch, useSelector } from "react-redux";
import ServiceAmenities from "@/components/ServiceAmenities";
import HotelRoomsSection from "@/components/HotelRoomsSection";
import VenueOverviewSection from "@/components/VenueOverviewSection";
import PhotographyOverviewSection from "@/components/PhotographyOverviewSection";
import MehandiOverviewSection from "@/components/MehandiOverviewSection";
import HomeSetupOverviewSection from "@/components/HomeSetupOverviewSection";
import api from "@/api/axios";
import { fetchItemDetail, selectItemDetail, selectItemDetailLoading } from "@/store/listingsSlice";
export default function ProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const dispatch = useDispatch();

  // ── Redux store: instant item from cache (0ms if already visited via list) ──
  const cachedItem = useSelector(selectItemDetail(id));
  const isItemLoading = useSelector(selectItemDetailLoading(id));

  const [item, setItem] = useState(() => cachedItem || null);
  const [reviews, setReviews] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(() => !cachedItem);
  const [showLightbox, setShowLightbox] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  // Review form state
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [user, setUser] = useState(null);

  // ── Sync redux cachedItem into local state when it arrives ─────────────
  useEffect(() => {
    if (cachedItem && !item) {
      setItem(cachedItem);
      setLoading(false);
    }
  }, [cachedItem]);

  // ── Fetch item + reviews + user in parallel ────────────────────────────
  useEffect(() => {
    if (!id) return;
    let active = true;

    (async () => {
      try {
        // Dispatch Redux thunk (skips API if already in store & fresh)
        const result = await dispatch(fetchItemDetail(id));
        const fetchedItem = result?.payload?.item;

        const [reviewRes, userRes] = await Promise.all([
          api.get(`/api/reviews?itemId=${id}`).catch(() => ({ data: { ok: false } })),
          api.get("/api/auth/me").catch(() => ({ data: { ok: false } })),
        ]);

        if (active) {
          if (fetchedItem) {
            setItem(fetchedItem);
          }
          if (reviewRes.data?.ok) {
            setReviews(reviewRes.data.data?.reviews || reviewRes.data.reviews || []);
          }
          if (userRes.data?.ok) {
            setUser(userRes.data.data?.user || userRes.data.user || null);
          }
        }
      } catch (err) {
        console.error("Product fetch error:", err);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [id, dispatch]);

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

  const isHotel = useMemo(() => {
    if (!item) return false;
    const catSlug = (item.category?.slug || "").toLowerCase();
    const catName = (item.category?.name || "").toLowerCase();
    const servCat = (item.categoryService?.category || "").toLowerCase();
    const title = (item.title || "").toLowerCase();

    // Explicit hotel category or room presence
    if (
      catSlug === "hotels" ||
      catName.includes("hotel") ||
      servCat === "hotels" ||
      title.includes("hotel accommodation") ||
      (Array.isArray(item.rooms) && item.rooms.length > 0)
    ) {
      return true;
    }

    // If explicit non-hotel category (like venues, caterers, etc.), do not treat as hotel
    if (catSlug && catSlug !== "hotels") {
      return false;
    }

    return (
      title.includes("hotel") ||
      title.includes("resort") ||
      title.includes("inn")
    );
  }, [item]);

  const isVenue = useMemo(() => {
    if (!item) return false;
    const catSlug = (item.category?.slug || "").toLowerCase();
    const catName = (item.category?.name || "").toLowerCase();
    return catSlug === "venues" || catName.includes("venue") || Boolean(item.venueType);
  }, [item]);

  const isPhotography = useMemo(() => {
    if (!item) return false;
    const catSlug = (item.category?.slug || "").toLowerCase();
    const catName = (item.category?.name || "").toLowerCase();
    return (
      catSlug === "photographer-videographer" ||
      catSlug === "photography" ||
      catName.includes("photograph") ||
      Boolean(item.photographyPackages?.basic?.price || item.photographyPackages?.standard?.price) ||
      (Array.isArray(item.albums) && item.albums.length > 0)
    );
  }, [item]);

  const isMehandi = useMemo(() => {
    if (!item) return false;
    const catSlug = (item.category?.slug || "").toLowerCase();
    const catName = (item.category?.name || "").toLowerCase();
    return (
      catSlug.includes("mehndi") ||
      catSlug.includes("mehandi") ||
      catName.includes("mehndi") ||
      catName.includes("mehandi") ||
      Boolean(item.mehandiPackages?.basic?.price || item.mehandiPackages?.standard?.price)
    );
  }, [item]);

  const isHomeSetup = useMemo(() => {
    if (!item) return false;
    const catSlug = (item.category?.slug || "").toLowerCase();
    const catName = (item.category?.name || "").toLowerCase();
    return (
      catSlug.includes("home-setup") ||
      catName.includes("home setup") ||
      (Array.isArray(item.mainCategories) && item.mainCategories.length > 0)
    );
  }, [item]);

  // Pre-select default package (standard or first valid tier)
  useEffect(() => {
    if (!item) return;
    const pkgs = item.photographyPackages || item.mehandiPackages;
    if (pkgs) {
      const list = [
        { key: "basic", label: "Basic", data: pkgs.basic },
        { key: "standard", label: "Standard", data: pkgs.standard },
        { key: "premium", label: "Premium", data: pkgs.premium },
        { key: "luxury", label: "Luxury", data: pkgs.luxury },
      ].filter((p) => p.data && (Number(p.data.price) > 0 || p.data.deliverables?.length > 0));

      if (list.length > 0) {
        const defaultPkg = list.find((p) => p.key === "standard") || list[0];
        setSelectedPackage({
          key: defaultPkg.key,
          label: defaultPkg.label,
          title: defaultPkg.data.title || `${defaultPkg.label} Package`,
          price: Number(defaultPkg.data.price) || 0,
          description: defaultPkg.data.description || "",
          deliverables: defaultPkg.data.deliverables || [],
        });
      } else {
        setSelectedPackage(null);
      }
    } else {
      setSelectedPackage(null);
    }
  }, [item]);

  // Compute effective price based on package selection or base item price
  const effectivePrice = useMemo(() => {
    if (selectedPackage && selectedPackage.price !== undefined && selectedPackage.price !== null && Number(selectedPackage.price) > 0) {
      return Number(selectedPackage.price);
    }
    return Number(item?.price) || 0;
  }, [selectedPackage, item]);

  const handleBookingClick = () => {
    let checkoutUrl = `/checkout?itemId=${item?._id}`;
    if (selectedPackage && effectivePrice > 0) {
      checkoutUrl += `&price=${encodeURIComponent(effectivePrice)}`;
      checkoutUrl += `&package=${encodeURIComponent(selectedPackage.key)}`;
      checkoutUrl += `&packageName=${encodeURIComponent(selectedPackage.title || `${selectedPackage.label} Package`)}`;
    }
    if (!user) {
      const returnUrl = encodeURIComponent(checkoutUrl);
      router.push(`/login?next=${returnUrl}`);
    } else {
      router.push(checkoutUrl);
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
      <main className="py-8 md:py-12 bg-white w-full pb-24 lg:pb-12">
        <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-12">
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

          {isHotel ? (
            /* HOTEL VIEW: Room Priority Layout (Rooms first, Hotel overview below) */
            <>
              {/* Hotel Header Bar */}
              <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-brand-100">
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-semibold text-muted bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-100">
                      📍 {item.city || "Pan India"}
                    </span>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      ✓ Verified Hotel Partner
                    </span>
                    <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-100">
                      🔒 Direct Room Reservation
                    </span>
                  </div>
                  <h1 className="font-serif text-3xl md:text-4xl font-bold text-ink leading-tight">
                    {item.title}
                  </h1>
                  <p className="text-xs md:text-sm text-muted mt-1 max-w-2xl">
                    Select your preferred room type below. Transparent nightly tariffs, verified guest amenities, and instant direct reservation.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 flex-wrap">
                  {item.contactPhone && (
                    <a
                      href={`tel:${item.contactPhone}`}
                      className="py-2.5 px-4 rounded-xl text-ink font-semibold text-xs md:text-sm bg-white hover:bg-brand-50 border border-brand-200 shadow-xs inline-flex items-center gap-1.5 transition-all"
                    >
                      📞 Front Desk: {item.contactPhone}
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById("hotel-overview-section");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="py-2.5 px-4 rounded-xl text-brand-700 font-semibold text-xs md:text-sm bg-brand-50 hover:bg-brand-100/70 border border-brand-200 shadow-xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>🏨 Hotel Info & Amenities</span>
                    <span>↓</span>
                  </button>
                </div>
              </div>

              {/* ROOMS PRIORITY: DIRECTLY VISIBLE FIRST AT TOP */}
              <div id="hotel-rooms-section">
                <HotelRoomsSection item={item} isTopPriority={true} />
              </div>

              {/* HOTEL OVERVIEW SECTION: MOVED DOWN BELOW ROOMS WITH SMALL IMAGE & SMALL DESCRIPTION BELOW IT */}
              <section id="hotel-overview-section" className="mt-14 pt-10 border-t border-brand-100 scroll-mt-20">
                <div className="mb-6">
                  <span className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1 block">
                    Property Overview
                  </span>
                  <h2 className="font-serif text-2xl md:text-3xl font-bold text-ink">
                    About {item.title}
                  </h2>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                  {/* Small Image & Description Below */}
                  <div className="w-full lg:w-[360px] shrink-0 space-y-3">
                    <div
                      className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden border border-brand-100 bg-brand-50 shadow-sm cursor-zoom-in group"
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
                      <div className="absolute bottom-2.5 right-2.5 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-semibold shadow group-hover:scale-105 transition-transform flex items-center gap-1 text-ink">
                        <span>🔍</span> Expand
                      </div>
                    </div>

                    {/* Small Thumbnails */}
                    {item.images?.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto py-1">
                        {item.images.map((src, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setActiveImage(i)}
                            className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
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

                    {/* Small description below image */}
                    <div className="p-4 bg-brand-50/60 rounded-2xl border border-brand-100/80 space-y-1.5">
                      <h4 className="font-serif font-bold text-ink text-sm">
                        Property Description
                      </h4>
                      <p className="text-muted text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                        {item.description || item.about || "Enjoy a peaceful countryside retreat with comfortable rooms, hospitable service, and modern amenities."}
                      </p>
                    </div>
                  </div>

                  {/* Rest of Hotel Information: Amenities, Vendor Info */}
                  <div className="flex-1 w-full space-y-6">
                    {/* Vendor / Business Details Card */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-brand-100 shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-xl text-brand-700 shrink-0">
                          🏨
                        </div>
                        <div>
                          <h4 className="font-bold text-ink text-base">
                            {item.vendor?.vendorProfile?.businessName || item.vendor?.businessName || item.vendor?.name || item.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                              ✓ Verified Hotel Partner
                            </span>
                            <span className="text-muted text-xs">•</span>
                            <span className="text-xs text-brand-700 font-medium">
                              Direct Room Booking
                            </span>
                          </div>
                        </div>
                      </div>

                      {item.contactPhone && (
                        <a
                          href={`tel:${item.contactPhone}`}
                          className="px-4 py-2.5 rounded-xl text-ink font-semibold text-xs sm:text-sm bg-brand-50 hover:bg-brand-100/80 border border-brand-200 transition-all inline-flex items-center justify-center gap-2 shrink-0"
                        >
                          📞 Call Front Desk ({item.contactPhone})
                        </a>
                      )}
                    </div>


                    {/* Categorized Hotel Amenities & Facilities */}
                    <ServiceAmenities
                      facilities={facilitiesList}
                      categoryName={item.category?.name || "Hotels"}
                    />
                  </div>
                </div>
              </section>
            </>
          ) : (
            /* NON-HOTEL VIEW: Standard Service Layout */
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
                  {isVenue && <VenueOverviewSection item={item} />}
                  {isPhotography && (
                    <PhotographyOverviewSection
                      item={item}
                      selectedPkgKey={selectedPackage?.key}
                      onSelectPackage={setSelectedPackage}
                    />
                  )}
                  {isMehandi && (
                    <MehandiOverviewSection
                      item={item}
                      selectedPkgKey={selectedPackage?.key}
                      onSelectPackage={setSelectedPackage}
                    />
                  )}
                  {isHomeSetup && <HomeSetupOverviewSection item={item} />}

                  <div>
                    <h3 className="font-serif text-xl font-bold text-ink mb-2">
                      About this service
                    </h3>
                    <p className="text-muted text-sm md:text-base leading-relaxed whitespace-pre-line">
                      {item.description || item.about}
                    </p>
                  </div>


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

                  {effectivePrice > 0 ? (
                    <div className="pt-2 border-t border-brand-50 space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-brand-700">
                          ₹{effectivePrice.toLocaleString("en-IN")}
                        </span>
                        <span className="text-xs text-muted font-medium">
                          {selectedPackage ? "plan price (all inclusive)" : "starting price"}
                        </span>
                      </div>
                      {selectedPackage && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-brand-50 border border-brand-200 text-xs font-bold text-brand-700">
                          <span>✓ Selected Plan:</span>
                          <span>{selectedPackage.title || `${selectedPackage.label} Package`}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2 pt-2 border-t border-brand-50">
                      <span className="text-2xl font-bold text-brand-700">
                        Price on Request
                      </span>
                      <span className="text-xs text-muted font-medium">Contact vendor for packages</span>
                    </div>
                  )}

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
                        {item.vendor?.vendorProfile?.businessName || item.vendor?.businessName || item.vendor?.name || "Trusted Wedding Partner"}
                      </h4>
                      {item.vendor?.vendorProfile?.verificationStatus === "approved" || item.vendor?.vendorProfile?.approved ? (
                        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                          ✓ Verified Vendor
                        </span>
                      ) : (
                        <span className="text-xs text-brand-600 font-medium flex items-center gap-1">
                          📍 Public Business Listing
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Booking buttons */}
                  <div className="space-y-3 pt-2">
                    <button
                      type="button"
                      onClick={handleBookingClick}
                      className="w-full py-3.5 px-4 rounded-xl text-white font-bold text-base bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 shadow-lg shadow-brand-500/25 transition-all cursor-pointer"
                    >
                      {user
                        ? selectedPackage
                          ? `Confirm Booking (${selectedPackage.label || "Plan"} – ₹${effectivePrice.toLocaleString("en-IN")}) →`
                          : "Confirm Booking →"
                        : "Login to Book →"}
                    </button>

                    {item.contactPhone && (
                      <a
                        href={`https://wa.me/${item.contactPhone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(
                          selectedPackage
                            ? `Hello, I saw ${item.title} on FlipsAura and would like to book the ${selectedPackage.title || `${selectedPackage.label} Package`} (₹${effectivePrice.toLocaleString("en-IN")}).`
                            : `Hello, I saw ${item.title} on FlipsAura and would like to inquire about wedding availability and booking.`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-3 px-4 rounded-xl text-emerald-800 font-bold text-sm bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-center flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <span>💬</span> Chat on WhatsApp
                      </a>
                    )}
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
                    ✅ Safe Payments | 🔒 100% Verified Service
                  </div>
                </div>
              </div>
            </div>
          )}

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

      {/* Mobile Sticky Booking Bar (Visible on < 1024px screens) */}
      {!isHotel && (
        <aside
          aria-label="Mobile booking action bar"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-brand-200 px-4 py-2.5 shadow-2xl shadow-brand-900/20 flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-300"
        >
          <div className="min-w-0 flex-1">
            <span className="text-[10px] text-muted font-medium block truncate">
              {selectedPackage ? `Plan: ${selectedPackage.title || `${selectedPackage.label} Package`}` : "Starting Tariff"}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-brand-700">
                {effectivePrice > 0 ? `₹${effectivePrice.toLocaleString("en-IN")}` : "On Request"}
              </span>
              {selectedPackage && (
                <span className="text-[10px] text-brand-700 font-bold bg-brand-50 px-1.5 py-0.2 rounded border border-brand-200">
                  {selectedPackage.label}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {item.contactPhone && (
              <a
                href={`https://wa.me/${item.contactPhone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(
                  selectedPackage
                    ? `Hello, I saw ${item.title} on FlipsAura and would like to book the ${selectedPackage.title || `${selectedPackage.label} Package`} (₹${effectivePrice.toLocaleString("en-IN")}).`
                    : `Hello, I saw ${item.title} on FlipsAura and would like to inquire about wedding availability and booking.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center text-lg active:scale-95 transition-transform"
                title="Chat on WhatsApp"
              >
                💬
              </a>
            )}

            <button
              type="button"
              onClick={handleBookingClick}
              className="py-2.5 px-4 rounded-xl text-white font-bold text-xs sm:text-sm bg-gradient-to-r from-brand-600 to-brand-700 shadow-md shadow-brand-500/25 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              {user ? "Book Now →" : "Login & Book"}
            </button>
          </div>
        </aside>
      )}

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
