"use client";
import { useMemo } from "react";

// Standard group display order
const GROUP_ORDER = [
  "Popular Amenities",
  "Basic Facilities",
  "Food & Dining",
  "Room & Venue Features",
  "Services & Inclusions",
  "Safety & Hygiene",
];

export default function ServiceAmenities({ facilities = [], categoryName = "Service" }) {
  // Deduplicate and sanitize
  const cleanFacilities = useMemo(() => {
    if (!Array.isArray(facilities)) return [];
    const seen = new Set();
    return facilities.filter((f) => {
      if (!f || !f.name || !f.name.trim()) return false;
      const key = `${(f.group || "Popular Amenities").toLowerCase()}-${f.name.toLowerCase().trim()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [facilities]);

  // Group items
  const grouped = useMemo(() => {
    const map = {};
    cleanFacilities.forEach((item) => {
      const g = item.group?.trim() || "Popular Amenities";
      if (!map[g]) map[g] = [];
      map[g].push(item);
    });

    // Sort groups according to preferred display order
    const sortedEntries = Object.entries(map).sort(([a], [b]) => {
      const idxA = GROUP_ORDER.indexOf(a);
      const idxB = GROUP_ORDER.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    return sortedEntries;
  }, [cleanFacilities]);

  // Highlights
  const highlights = useMemo(() => {
    const explicit = cleanFacilities.filter((f) => f.highlight);
    if (explicit.length > 0) return explicit;
    // Fallback: take first 4 facilities from popular/first group
    return cleanFacilities.slice(0, 4);
  }, [cleanFacilities]);

  if (cleanFacilities.length === 0) {
    return null;
  }

  return (
    <section className="pt-6 border-t border-brand-100 space-y-5">
      {/* Section Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-brand-600 block mb-1">
            Features & Inclusions
          </span>
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-ink flex items-center gap-2">
            <span>✨</span> Amenities & Facilities
          </h3>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
          <span>✓</span> Verified by Vendor ({cleanFacilities.length} available)
        </span>
      </div>

      {/* Popular / Highlighted Amenities Banner */}
      {highlights.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-brand-50/90 via-surface to-brand-50/40 border border-brand-200/80 shadow-2xs">
          <p className="text-xs font-bold text-wine uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <span>⭐</span> Popular Amenities
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {highlights.map((h, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/90 border border-brand-100 shadow-2xs"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">
                  ✓
                </div>
                <span className="text-xs sm:text-sm font-semibold text-ink truncate">
                  {h.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categorized Groups Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {grouped.map(([groupName, items]) => (
          <div
            key={groupName}
            className="p-4 sm:p-5 rounded-2xl bg-surface/50 border border-brand-100/90 space-y-3.5 hover:border-brand-200 transition-colors"
          >
            <div className="flex items-center justify-between border-b border-brand-100 pb-2.5">
              <h4 className="font-serif text-sm sm:text-base font-bold text-wine flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-600 inline-block" />
                {groupName}
              </h4>
              <span className="text-[11px] font-semibold text-muted bg-white px-2 py-0.5 rounded-full border border-brand-100">
                {items.length}
              </span>
            </div>

            <ul className="space-y-2.5">
              {items.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-ink/90">
                  <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] font-bold shrink-0 border border-emerald-200 mt-0.5">
                    ✓
                  </span>
                  <span className="font-medium leading-relaxed">
                    {item.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
