"use client";
import { useState, useEffect } from "react";
import { useRouter } from "@/compat/navigation";
import api from "@/api/axios";

export default function HotelRoomsSection({ item }) {
  const router = useRouter();
  const [rooms, setRooms] = useState(item?.rooms || []);
  const [loading, setLoading] = useState(!item?.rooms);
  const [selectedImage, setSelectedImage] = useState(null); // Lightbox for room photos

  const hotelId = item?._id;

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

  const handleStandardBooking = () => {
    router.push(`/checkout?itemId=${hotelId}`);
  };

  return (
    <section className="pt-10 border-t border-brand-100/80">
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
        /* Rooms Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rooms.map((room) => {
            const coverImage = room.images?.[0] || item?.images?.[0] || "/images/categories/hotels.jpg";
            const isSingleLeft = room.availableRooms === 1;

            return (
              <div
                key={room._id}
                className="bg-white rounded-3xl border border-brand-100 overflow-hidden shadow-xs hover:shadow-xl hover:border-brand-300 transition-all duration-300 flex flex-col group"
              >
                {/* Room Photo Gallery Container */}
                <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                  <img
                    src={coverImage}
                    alt={room.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Room Type badge */}
                  <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
                    <span className="px-3 py-1 rounded-xl bg-brand-900/85 backdrop-blur-xs text-white text-xs font-bold shadow-md">
                      {room.roomType || "Room"}
                    </span>
                    {isSingleLeft && (
                      <span className="px-2.5 py-1 rounded-xl bg-rose-600 text-white text-[11px] font-bold animate-pulse shadow-md">
                        🔥 Only 1 Room Left!
                      </span>
                    )}
                  </div>

                  {/* Photos count / Lightbox trigger */}
                  {room.images?.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedImage(coverImage)}
                      className="absolute bottom-3 right-3 bg-black/70 hover:bg-black/90 backdrop-blur-xs text-white text-xs font-semibold px-2.5 py-1.5 rounded-xl shadow flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <span>📸</span>
                      <span>{room.images.length} Photo{room.images.length === 1 ? "" : "s"}</span>
                    </button>
                  )}
                </div>

                {/* Room Info */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    {/* Header + Price */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-serif text-xl font-bold text-ink leading-snug group-hover:text-brand-600 transition-colors">
                          {room.name}
                        </h3>
                        <p className="text-xs text-muted font-medium mt-0.5">
                          {room.bedType || "Double Bed"} • {room.numberOfBeds || 1} Bed{room.numberOfBeds === 1 ? "" : "s"}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-2xl font-bold text-brand-700">
                          ₹{room.pricePerNight?.toLocaleString("en-IN")}
                        </div>
                        <span className="text-[11px] text-muted font-semibold block">/ night</span>
                      </div>
                    </div>

                    {/* Capacity & Availability Tags */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-50 text-brand-900 font-bold border border-brand-100">
                        👥 Max {room.maxGuests} Guests
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface text-ink font-semibold border border-line">
                        🛏️ {room.bedType || "Double Bed"}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold border ${
                          room.availableRooms > 0
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-rose-50 text-rose-800 border-rose-200"
                        }`}
                      >
                        📦 {room.availableRooms > 0 ? `${room.availableRooms} Available` : "Sold Out"}
                      </span>
                    </div>

                    {/* Description if present */}
                    {room.description && (
                      <p className="text-xs sm:text-sm text-muted leading-relaxed line-clamp-2">
                        {room.description}
                      </p>
                    )}

                    {/* Facilities / Amenities */}
                    {room.facilities?.length > 0 && (
                      <div className="pt-2 border-t border-brand-50">
                        <span className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-2">
                          Room Facilities & Perks:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {room.facilities.map((fac, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2.5 py-1 rounded-lg bg-brand-50/70 text-ink/90 border border-brand-100/80 font-medium flex items-center gap-1"
                            >
                              <span className="text-brand-600">✓</span> {fac}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Book Button */}
                  <div className="pt-4 border-t border-brand-50 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-muted hidden sm:inline">
                      Instant Booking Confirmation
                    </span>

                    <button
                      type="button"
                      onClick={() => handleBookRoom(room)}
                      disabled={room.availableRooms <= 0}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-bold text-sm shadow-md shadow-brand-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
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

      {/* Lightbox Modal for Room Photos */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl">
            <img src={selectedImage} alt="Room full view" className="w-full h-full object-contain" />
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 text-white hover:bg-black flex items-center justify-center font-bold text-sm transition"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
