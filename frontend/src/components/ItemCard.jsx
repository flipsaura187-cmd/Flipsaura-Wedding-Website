import Link from "@/compat/Link";

export default function ItemCard({ item }) {
  const isHotel =
    item.category?.slug === "hotels" ||
    (typeof item.category === "string" && item.category.toLowerCase().includes("hotel")) ||
    (item.category?.name || "").toLowerCase().includes("hotel") ||
    (item.title || "").toLowerCase().includes("hotel accommodation");

  return (
    <Link
      href={`/product/${item._id}`}
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
      </div>
      <div className="p-4 flex flex-col gap-1.5">
        <h3 className="font-serif font-bold text-ink text-base line-clamp-1 group-hover:text-brand-600 transition-colors">
          {item.title}
        </h3>
        <div className="text-xs text-muted flex items-center gap-1">
          <span>📍</span> {item.city || "India"}
        </div>
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
          ) : item.price && item.price > 0 ? (
            <span className="text-base font-bold text-brand-700">
              ₹{item.price.toLocaleString("en-IN")}
            </span>
          ) : (
            <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">
              Price on Request
            </span>
          )}
          {!isHotel && (
            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
              ★ {item.rating?.toFixed?.(1) || "—"}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

