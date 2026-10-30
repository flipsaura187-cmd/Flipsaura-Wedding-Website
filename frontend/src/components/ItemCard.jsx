import Link from "@/compat/Link";

export default function ItemCard({ item }) {
  const isHotel =
    item.category?.slug === "hotels" ||
    (typeof item.category === "string" && item.category.toLowerCase().includes("hotel")) ||
    (item.category?.name || "").toLowerCase().includes("hotel") ||
    (item.title || "").toLowerCase().includes("hotel accommodation");

  const isVenue =
    item.category?.slug === "venues" ||
    (typeof item.category === "string" && item.category.toLowerCase().includes("venue")) ||
    (item.category?.name || "").toLowerCase().includes("venue") ||
    Boolean(item.venueType);

  const guestCap = item.guestCapacity || item.capacity || 0;
  const rental = item.rentalPrice || (isVenue ? item.price : 0);

  return (
    <Link
      href={isVenue ? `/venue_details/${item._id}` : `/product/${item._id}`}
      className="group block bg-white rounded-2xl overflow-hidden border border-brand-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      <div className="relative aspect-[4/3] bg-brand-50 overflow-hidden">
        {item.images?.[0] ? (
          <img
            src={item.images[0]}
            alt={item.title}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/images/categories/venues.jpg";
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <img
            src="/images/categories/venues.jpg"
            alt={item.title || "Wedding listing"}
            className="w-full h-full object-cover"
          />
        )}
        {item.featured && (
          <span className="absolute top-3 left-3 bg-gradient-to-r from-brand-600 to-brand-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-md uppercase tracking-wider">
            Featured
          </span>
        )}
        {isVenue && item.venueType && (
          <span className="absolute bottom-3 left-3 bg-ink/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
            {item.venueType}
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col gap-1.5">
        <h3 className="font-serif font-bold text-ink text-base line-clamp-1 group-hover:text-brand-600 transition-colors">
          {item.title}
        </h3>
        <div className="text-xs text-muted flex items-center gap-1 truncate">
          <span>📍</span>
          <span className="truncate">
            {item.locality ? `${item.locality}, ` : ""}{item.city || "India"}
          </span>
        </div>

        {isVenue && (guestCap > 0 || item.roomCount > 0) && (
          <div className="flex items-center gap-2 text-[11px] text-ink/70 font-medium pt-0.5">
            {guestCap > 0 && (
              <span className="inline-flex items-center gap-1 bg-brand-50 text-brand-800 px-1.5 py-0.5 rounded">
                <span>👥</span> {guestCap}
              </span>
            )}
            {item.roomCount > 0 && (
              <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-800 px-1.5 py-0.5 rounded">
                <span>🛏️</span> {item.roomCount} Rooms
              </span>
            )}
          </div>
        )}

        <div className="mt-2 pt-2 border-t border-brand-50 flex items-center justify-between">
          {isHotel ? (
            <div className="leading-tight">
              {item.price && item.price > 0 ? (
                <>
                  <span className="text-[10px] text-muted font-medium block">Rooms from</span>
                  <span className="text-sm font-bold text-brand-700">
                    ₹{item.price.toLocaleString("en-IN")}
                    <span className="text-[10px] text-muted font-normal"> / night</span>
                  </span>
                </>
              ) : (
                <span className="text-xs font-bold text-brand-700">View Rooms & Rates</span>
              )}
            </div>
          ) : isVenue ? (
            <div className="leading-tight">
              {rental > 0 ? (
                <>
                  <span className="text-[10px] text-muted font-medium block">Rental Tariff</span>
                  <span className="text-sm font-bold text-brand-700">
                    ₹{rental.toLocaleString("en-IN")}
                    <span className="text-[10px] text-muted font-normal"> / day</span>
                  </span>
                </>
              ) : item.pricePerPlateVeg > 0 ? (
                <>
                  <span className="text-[10px] text-muted font-medium block">Food per plate</span>
                  <span className="text-sm font-bold text-emerald-700">
                    ₹{item.pricePerPlateVeg}
                    <span className="text-[10px] text-muted font-normal"> / plate</span>
                  </span>
                </>
              ) : item.price && item.price > 0 ? (
                <span className="text-base font-bold text-brand-700">
                  ₹{item.price.toLocaleString("en-IN")}
                </span>
              ) : (
                <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">
                  Price on Request
                </span>
              )}
            </div>
          ) : item.price && item.price > 0 ? (
            <span className="text-base font-bold text-brand-700">
              ₹{item.price.toLocaleString("en-IN")}
            </span>
          ) : (
            <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">
              Price on Request
            </span>
          )}

          <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
            ★ {item.rating?.toFixed?.(1) || item.rating || "—"}
          </span>
        </div>
      </div>
    </Link>
  );
}

