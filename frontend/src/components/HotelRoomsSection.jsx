"use client";
import { useState, useEffect } from "react";
import { useRouter } from "@/compat/navigation";
import api from "@/api/axios";

function getAmenityIcon(name) {
  const lower = (name || "").toLowerCase();
  if (lower.includes("wifi") || lower.includes("wi-fi") || lower.includes("internet")) return "📶";
  if (lower.includes("ac") || lower.includes("air condition")) return "❄️";
  if (lower.includes("tv")) return "📺";
  if (lower.includes("breakfast")) return "☕";
  if (lower.includes("hot water") || lower.includes("geyser")) return "♨️";
  if (lower.includes("bathroom")) return "🚿";
  if (lower.includes("room service")) return "🛎️";
  if (lower.includes("kettle") || lower.includes("tea")) return "🫖";
  if (lower.includes("balcony") || lower.includes("view")) return "🪟";
  if (lower.includes("fridge") || lower.includes("refrigerator")) return "🧊";
  if (lower.includes("desk") || lower.includes("work")) return "💼";
  if (lower.includes("housekeeping") || lower.includes("cleaning")) return "🧹";
  if (lower.includes("safe")) return "🔒";
  if (lower.includes("couple")) return "❤️";
  if (lower.includes("cancel")) return "🛡️";
  if (lower.includes("parking")) return "🅿️";
  if (lower.includes("elevator") || lower.includes("lift")) return "🛗";
  if (lower.includes("toiletries") || lower.includes("towel")) return "🧼";
  return "✓";
}

export default function HotelRoomsSection({ item, isTopPriority = false }) {
  const router = useRouter();
  const [rooms, setRooms] = useState(item?.rooms || []);
  const [loading, setLoading] = useState(!item?.rooms);
  const [cardPhotoIndices, setCardPhotoIndices] = useState({});
  
  // Full screen photo gallery lightbox
  const [galleryModal, setGalleryModal] = useState({
    isOpen: false,
    roomName: "",
    images: [],
    activeIndex: 0,
  });

  // MakeMyTrip style "Click to View Details" modal
  const [detailsModal, setDetailsModal] = useState({
    isOpen: false,
    room: null,
    activePhotoIndex: 0,
  });

  const hotelId = item?._id;

  const handleCardNextPhoto = (e, roomId, total) => {
    e.stopPropagation();
    setCardPhotoIndices((prev) => ({
      ...prev,
      [roomId]: ((prev[roomId] || 0) + 1) % total,
    }));
  };

  const handleCardPrevPhoto = (e, roomId, total) => {
    e.stopPropagation();
    setCardPhotoIndices((prev) => ({
      ...prev,
      [roomId]: ((prev[roomId] || 0) - 1 + total) % total,
    }));
  };

  const openGallery = (room, initialIndex = 0) => {
    const list =
      Array.isArray(room.images) && room.images.length > 0
        ? room.images
        : [item?.images?.[0] || "/images/categories/hotels.jpg"];
    setGalleryModal({
      isOpen: true,
      roomName: room.name,
      images: list,
      activeIndex: initialIndex,
    });
  };

  const nextGalleryPhoto = (e) => {
    if (e) e.stopPropagation();
    setGalleryModal((prev) => ({
      ...prev,
      activeIndex: (prev.activeIndex + 1) % prev.images.length,
    }));
  };

  const prevGalleryPhoto = (e) => {
    if (e) e.stopPropagation();
    setGalleryModal((prev) => ({
      ...prev,
      activeIndex: (prev.activeIndex - 1 + prev.images.length) % prev.images.length,
    }));
  };

  const openRoomDetails = (room, e) => {
    if (e) e.stopPropagation();
    setDetailsModal({
      isOpen: true,
      room,
      activePhotoIndex: 0,
    });
  };

  const closeRoomDetails = () => {
    setDetailsModal({
      isOpen: false,
      room: null,
      activePhotoIndex: 0,
    });
  };

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (galleryModal.isOpen || detailsModal.isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [galleryModal.isOpen, detailsModal.isOpen]);

  // Gallery keyboard controls
  useEffect(() => {
    if (!galleryModal.isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setGalleryModal((prev) => ({ ...prev, isOpen: false }));
      } else if (e.key === "ArrowRight") {
        setGalleryModal((prev) => ({
          ...prev,
          activeIndex: (prev.activeIndex + 1) % prev.images.length,
        }));
      } else if (e.key === "ArrowLeft") {
        setGalleryModal((prev) => ({
          ...prev,
          activeIndex: (prev.activeIndex - 1 + prev.images.length) % prev.images.length,
        }));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [galleryModal.isOpen]);

  // Details Modal keyboard controls
  useEffect(() => {
    if (!detailsModal.isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        closeRoomDetails();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [detailsModal.isOpen]);

  // Dynamically fetch rooms from MongoDB
  useEffect(() => {
    if (!hotelId) return;

    let isMounted = true;
    api
      .get(`/api/rooms?hotelId=${hotelId}`)
      .then((res) => {
        if (isMounted && res.data?.ok) {
          setRooms(res.data.data?.rooms || []);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch hotel rooms:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [hotelId]);

  const handleBookRoom = (room) => {
    const query = new URLSearchParams({
      itemId: hotelId,
      roomId: room._id,
      roomName: room.name,
      price: String(room.pricePerNight),
    });
    router.push(`/checkout?${query.toString()}`);
  };

  return (
    <section className={isTopPriority ? "pt-2" : "pt-10 border-t border-brand-100/80"}>
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 text-xs font-bold uppercase tracking-wider mb-2">
            <span>🛏️</span>
            <span>Room Selection</span>
          </div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-ink">
            Available Rooms & Suites
          </h2>
          <p className="text-xs md:text-sm text-muted mt-1 max-w-xl">
            Choose from comfortable, verified rooms at {item?.title} with transparent nightly rates, guest capacities, and modern amenities.
          </p>
        </div>

        {rooms.length > 0 && (
          <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
            <span>✓</span> {rooms.length} Room Type{rooms.length === 1 ? "" : "s"} Available
          </span>
        )}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-12 text-center bg-brand-50/40 rounded-3xl border border-brand-100">
          <div className="inline-block w-7 h-7 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-3" />
          <p className="text-muted text-xs md:text-sm font-medium">Checking live room availability...</p>
        </div>
      ) : rooms.length === 0 ? (
        /* Empty State */
        <div className="p-8 sm:p-10 rounded-3xl bg-brand-50/50 border border-brand-100 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-white border border-brand-200 text-brand-700 flex items-center justify-center text-2xl mx-auto shadow-xs">
            🏨
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="font-serif text-lg md:text-xl font-bold text-ink">
              Room Information Updating
            </h3>
            <p className="text-xs md:text-sm text-muted mt-1 leading-relaxed">
              Online room listings for this property are currently being verified. Please contact the front desk directly for current room availability and tariffs.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {item?.contactPhone && (
              <a
                href={`tel:${item.contactPhone}`}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-bold text-xs md:text-sm shadow-md shadow-brand-500/20 transition inline-flex items-center gap-2"
              >
                📞 Call Front Desk ({item.contactPhone})
              </a>
            )}
          </div>
        </div>
      ) : (
        /* Rooms Grid (MakeMyTrip compact card design) */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {rooms.map((room) => {
            const roomImages =
              Array.isArray(room.images) && room.images.length > 0
                ? room.images
                : [item?.images?.[0] || "/images/categories/hotels.jpg"];
            const photosCount = roomImages.length;
            const currentCardIndex = (cardPhotoIndices[room._id] || 0) % photosCount;
            const currentImage = roomImages[currentCardIndex];
            const isSingleLeft = room.availableRooms === 1;

            // Display facilities
            const displayFacilities = Array.isArray(room.facilities) ? [...room.facilities] : [];
            if (
              room.cancellationPolicy &&
              !displayFacilities.some((f) => f.toLowerCase().includes("cancellation"))
            ) {
              displayFacilities.push(room.cancellationPolicy);
            }

            const visiblePerks = displayFacilities.slice(0, 3);
            const remainingPerksCount = displayFacilities.length - visiblePerks.length;

            const originalPrice = Math.round((room.pricePerNight || 1000) * 1.35);
            const taxesEst = Math.round((room.pricePerNight || 1000) * 0.12);

            return (
              <div
                key={room._id}
                className="bg-white rounded-3xl border border-pink-200/90 overflow-hidden shadow-sm hover:shadow-xl hover:border-pink-300 transition-all duration-300 flex flex-col group"
              >
                {/* Room Photo Gallery Container with Interactive Carousel */}
                <div
                  className="relative aspect-[16/10] bg-gray-100 overflow-hidden cursor-pointer"
                  onClick={() => openGallery(room, currentCardIndex)}
                >
                  <img
                    src={currentImage}
                    alt={`${room.name} photo ${currentCardIndex + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Room Type badge top-left */}
                  <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
                    <span className="px-3.5 py-1 rounded-xl bg-amber-950/75 backdrop-blur-md text-white text-xs font-bold shadow-md">
                      {room.roomType || "Deluxe Room"}
                    </span>
                    {isSingleLeft && (
                      <span className="px-2.5 py-1 rounded-xl bg-rose-600 text-white text-[11px] font-bold animate-pulse shadow-md">
                        🔥 Only 1 Room Left!
                      </span>
                    )}
                  </div>

                  {/* Previous / Next buttons */}
                  {photosCount > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => handleCardPrevPhoto(e, room._id, photosCount)}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center text-lg font-bold shadow-md transition opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Previous photo"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleCardNextPhoto(e, room._id, photosCount)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center text-lg font-bold shadow-md transition opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Next photo"
                      >
                        ›
                      </button>

                      {/* Photo indicator dots at bottom center */}
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-xs">
                        {roomImages.slice(0, 6).map((_, dotIdx) => (
                          <span
                            key={dotIdx}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${
                              dotIdx === currentCardIndex
                                ? "bg-white w-3"
                                : "bg-white/50"
                            }`}
                          />
                        ))}
                        {photosCount > 6 && (
                          <span className="text-[10px] text-white/80 font-bold ml-0.5">+</span>
                        )}
                      </div>
                    </>
                  )}

                  {/* Photos count bottom-right badge / Lightbox trigger */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openGallery(room, currentCardIndex);
                    }}
                    className="absolute bottom-3 right-3 bg-black/75 hover:bg-black/90 backdrop-blur-md text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <span>📷</span>
                    <span>
                      {photosCount} Photo{photosCount === 1 ? "" : "s"}
                    </span>
                  </button>
                </div>

                {/* Compact Room Info (MakeMyTrip Style) */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    {/* Header + Capacity */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3
                          onClick={(e) => openRoomDetails(room, e)}
                          className="font-serif text-lg sm:text-xl font-bold text-ink leading-snug hover:text-brand-700 transition-colors cursor-pointer"
                          title="Click to view full room details"
                        >
                          {room.name}
                        </h3>
                        {room.roomSize && (
                          <span className="text-[11px] font-semibold text-muted bg-gray-100 px-2 py-0.5 rounded-md shrink-0">
                            {room.roomSize}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted font-medium mt-1">
                        <span>🛏️ {room.bedType || "1 King Bed"}</span>
                        <span>•</span>
                        <span>👥 Max {room.maxGuests || 2} Guests</span>
                      </div>
                    </div>

                    {/* Key Perks Preview & 'View Details' Click Trigger */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {visiblePerks.map((fac, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2.5 py-1 rounded-xl bg-pink-50/70 text-brand-900 border border-pink-200/90 font-medium inline-flex items-center gap-1"
                        >
                          <span className="text-brand-600 font-bold text-[11px]">
                            {getAmenityIcon(fac)}
                          </span>
                          <span className="truncate max-w-[150px]">{fac}</span>
                        </span>
                      ))}

                      {remainingPerksCount > 0 && (
                        <button
                          type="button"
                          onClick={(e) => openRoomDetails(room, e)}
                          className="text-xs px-2.5 py-1 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold border border-brand-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>+{remainingPerksCount} more</span>
                          <span>›</span>
                        </button>
                      )}
                    </div>

                    {/* Pricing Block (MakeMyTrip signature format) */}
                    <div className="pt-2 border-t border-gray-100 flex items-baseline justify-between gap-2">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs text-gray-400 line-through">
                            ₹{originalPrice.toLocaleString("en-IN")}
                          </span>
                          <span className="text-2xl font-extrabold text-ink">
                            ₹{room.pricePerNight?.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-500 font-medium block">
                          + ₹{taxesEst.toLocaleString("en-IN")} taxes & fees / night
                        </span>
                      </div>

                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                          room.availableRooms > 0
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-rose-50 text-rose-800 border-rose-200"
                        }`}
                      >
                        {room.availableRooms > 0
                          ? `${room.availableRooms} Left`
                          : "Sold Out"}
                      </span>
                    </div>
                  </div>

                  {/* Actions Row: 'View Details' and 'Book Room' */}
                  <div className="pt-3 border-t border-gray-100 flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={(e) => openRoomDetails(room, e)}
                      className="flex-1 py-2.5 px-3 rounded-xl border border-brand-200 hover:border-brand-300 hover:bg-brand-50/60 text-brand-800 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Room Details</span>
                      <span className="text-brand-600 font-bold">›</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleBookRoom(room)}
                      disabled={room.availableRooms <= 0}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-brand-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Book Room</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MAKE MY TRIP STYLE: ROOM DETAILS MODAL / BOTTOM SHEET */}
      {detailsModal.isOpen && detailsModal.room && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-in fade-in duration-200"
          onClick={closeRoomDetails}
        >
          <div
            className="w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200/60">
                  {detailsModal.room.roomType || "Deluxe Room"}
                </span>
                <h3 className="font-serif font-bold text-xl sm:text-2xl text-ink mt-0.5">
                  {detailsModal.room.name}
                </h3>
              </div>

              <button
                type="button"
                onClick={closeRoomDetails}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center text-base font-bold transition cursor-pointer"
                title="Close (Esc)"
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* Photo Showcase */}
              {(() => {
                const modalImages =
                  Array.isArray(detailsModal.room.images) &&
                  detailsModal.room.images.length > 0
                    ? detailsModal.room.images
                    : [item?.images?.[0] || "/images/categories/hotels.jpg"];
                const activePhoto = modalImages[detailsModal.activePhotoIndex || 0];

                return (
                  <div className="space-y-2">
                    <div
                      className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-xs cursor-pointer group"
                      onClick={() => openGallery(detailsModal.room, detailsModal.activePhotoIndex)}
                    >
                      <img
                        src={activePhoto}
                        alt={`${detailsModal.room.name} preview`}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      />

                      {modalImages.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailsModal((prev) => ({
                                ...prev,
                                activePhotoIndex:
                                  (prev.activePhotoIndex - 1 + modalImages.length) %
                                  modalImages.length,
                              }));
                            }}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center font-bold shadow-md"
                          >
                            ‹
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailsModal((prev) => ({
                                ...prev,
                                activePhotoIndex:
                                  (prev.activePhotoIndex + 1) % modalImages.length,
                              }));
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center font-bold shadow-md"
                          >
                            ›
                          </button>
                        </>
                      )}

                      <span className="absolute bottom-2.5 right-2.5 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-white text-xs font-semibold shadow-md flex items-center gap-1">
                        <span>🔍</span>
                        <span>Expand Gallery</span>
                      </span>
                    </div>

                    {/* Thumbnail strip */}
                    {modalImages.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {modalImages.map((src, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() =>
                              setDetailsModal((prev) => ({
                                ...prev,
                                activePhotoIndex: i,
                              }))
                            }
                            className={`w-14 h-11 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                              i === detailsModal.activePhotoIndex
                                ? "border-brand-600 ring-2 ring-brand-400/40 scale-105"
                                : "border-gray-200 opacity-70 hover:opacity-100"
                            }`}
                          >
                            <img src={src} alt="thumb" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 4 Quick Stat Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-brand-50/70 rounded-2xl border border-brand-100 text-center">
                  <span className="text-base block mb-0.5">👥</span>
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">
                    Capacity
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-ink">
                    Max {detailsModal.room.maxGuests || 2} Guests
                  </span>
                </div>

                <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-100 text-center">
                  <span className="text-base block mb-0.5">🛏️</span>
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">
                    Bed Setup
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-ink truncate block">
                    {detailsModal.room.bedType || "1 King Bed"}
                  </span>
                </div>

                <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-100 text-center">
                  <span className="text-base block mb-0.5">📐</span>
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">
                    Room Size
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-ink">
                    {detailsModal.room.roomSize || "280 sq.ft"}
                  </span>
                </div>

                <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100 text-center">
                  <span className="text-base block mb-0.5">📦</span>
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">
                    Available
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-emerald-800">
                    {detailsModal.room.availableRooms > 0
                      ? `${detailsModal.room.availableRooms} Left`
                      : "Sold Out"}
                  </span>
                </div>
              </div>

              {/* Description */}
              {detailsModal.room.description && (
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Room Overview
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    {detailsModal.room.description}
                  </p>
                </div>
              )}

              {/* All Room Facilities & Amenities (Full Checklist) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                    <span>✨</span>
                    <span>Room Facilities & Amenities</span>
                  </h4>
                  <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                    {Array.isArray(detailsModal.room.facilities)
                      ? detailsModal.room.facilities.length
                      : 0}{" "}
                    Included
                  </span>
                </div>

                {Array.isArray(detailsModal.room.facilities) &&
                detailsModal.room.facilities.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {detailsModal.room.facilities.map((fac, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-pink-50/50 hover:bg-pink-50 text-ink border border-pink-100 text-xs font-medium flex items-center gap-2 transition"
                      >
                        <span className="text-base">{getAmenityIcon(fac)}</span>
                        <span>{fac}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted italic">
                    Standard hotel amenities included (Wi-Fi, AC, Daily Housekeeping).
                  </p>
                )}
              </div>

              {/* Policies & Perks */}
              <div className="p-4 rounded-2xl bg-brand-50/50 border border-brand-100 space-y-2 text-xs text-gray-700">
                <h4 className="font-bold uppercase tracking-wider text-brand-900 text-[11px] flex items-center gap-1.5">
                  <span>🛡️</span> Booking & Hotel Policies
                </h4>
                <div className="space-y-1.5 leading-relaxed">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>
                      <b>Cancellation:</b>{" "}
                      {detailsModal.room.cancellationPolicy ||
                        "Free cancellation till check-in date"}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>
                      <b>Check-in / Check-out:</b> Standard check-in 12:00 PM • Standard check-out 11:00 AM
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>
                      <b>Guest Verification:</b> Valid government-issued photo ID required for all adults at check-in.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Sticky Bottom Action Bar */}
            <div className="p-4 sm:p-5 border-t border-gray-100 bg-white flex items-center justify-between gap-4 shrink-0 shadow-lg">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-gray-400 line-through">
                    ₹{Math.round((detailsModal.room.pricePerNight || 1000) * 1.35).toLocaleString("en-IN")}
                  </span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#b8246b]">
                    ₹{detailsModal.room.pricePerNight?.toLocaleString("en-IN")}
                  </span>
                </div>
                <span className="text-[11px] text-gray-500 font-medium block">
                  + ₹{Math.round((detailsModal.room.pricePerNight || 1000) * 0.12).toLocaleString("en-IN")} taxes & fees / night
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  const r = detailsModal.room;
                  closeRoomDetails();
                  handleBookRoom(r);
                }}
                disabled={detailsModal.room.availableRooms <= 0}
                className="px-6 sm:px-8 py-3 rounded-full bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-bold text-sm shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              >
                <span>Book This Room</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Featured Room Photo Gallery Lightbox */}
      {galleryModal.isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 select-none"
          onClick={() => setGalleryModal((prev) => ({ ...prev, isOpen: false }))}
        >
          {/* Gallery Top Bar */}
          <div
            className="flex items-center justify-between text-white max-w-5xl w-full mx-auto pb-3 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="font-serif font-bold text-lg sm:text-xl text-white">
                {galleryModal.roomName}
              </h3>
              <p className="text-xs text-gray-400">
                Photo {galleryModal.activeIndex + 1} of {galleryModal.images.length}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setGalleryModal((prev) => ({ ...prev, isOpen: false }))}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-lg font-bold transition cursor-pointer"
              title="Close gallery (Esc)"
            >
              ✕
            </button>
          </div>

          {/* Main Stage with Navigation Arrows */}
          <div
            className="relative flex-1 flex items-center justify-center max-w-5xl w-full mx-auto my-auto overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={galleryModal.images[galleryModal.activeIndex]}
              alt={`${galleryModal.roomName} photo ${galleryModal.activeIndex + 1}`}
              className="max-h-[68vh] max-w-full rounded-2xl object-contain shadow-2xl transition-all duration-200"
            />

            {galleryModal.images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevGalleryPhoto}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center text-2xl font-bold shadow-xl transition cursor-pointer"
                  title="Previous (Left arrow)"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={nextGalleryPhoto}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center text-2xl font-bold shadow-xl transition cursor-pointer"
                  title="Next (Right arrow)"
                >
                  ›
                </button>
              </>
            )}
          </div>

          {/* Bottom Thumbnails Strip */}
          {galleryModal.images.length > 1 && (
            <div
              className="max-w-5xl w-full mx-auto pt-3 shrink-0 flex items-center justify-center gap-2 overflow-x-auto py-2"
              onClick={(e) => e.stopPropagation()}
            >
              {galleryModal.images.map((thumbUrl, thumbIdx) => (
                <button
                  key={thumbIdx}
                  type="button"
                  onClick={() =>
                    setGalleryModal((prev) => ({ ...prev, activeIndex: thumbIdx }))
                  }
                  className={`w-16 h-12 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    thumbIdx === galleryModal.activeIndex
                      ? "border-pink-500 scale-105 ring-2 ring-pink-500/40"
                      : "border-white/30 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img
                    src={thumbUrl}
                    alt={`Thumbnail ${thumbIdx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
