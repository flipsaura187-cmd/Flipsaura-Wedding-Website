"use client";
import React, { useMemo, useState } from "react";
import { CATALOGUE_GROUPS } from "@/constants/catalogue";

export default function HomeSetupOverviewSection({ item }) {
  const [lightboxImage, setLightboxImage] = useState(null);

  if (!item) return null;

  const mainCats = Array.isArray(item.mainCategories) ? item.mainCategories : [];
  const subcats = Array.isArray(item.subcategories) ? item.subcategories : [];
  const customMap = item.customSubcategoriesMap || {};

  // Group vendor subcategories under each matching CATALOGUE_GROUP
  const groupedServices = useMemo(() => {
    return CATALOGUE_GROUPS.map((group) => {
      const isGroupSelected = mainCats.includes(group.name);
      
      // Filter subcategories that belong to this group
      const matchingSubs = (group.subcategories || []).filter((sub) => subcats.includes(sub));
      const customSubs = Array.isArray(customMap[group.name]) ? customMap[group.name] : [];
      const allMatching = Array.from(new Set([...matchingSubs, ...customSubs]));

      const photos =
        (Array.isArray(item.categoryPhotosMap?.[group.name]) && item.categoryPhotosMap[group.name].filter(Boolean)) ||
        (Array.isArray(item.categoryPhotos) && item.categoryPhotos.find((cp) => cp?.categoryName === group.name)?.images?.filter(Boolean)) ||
        [];

      if (!isGroupSelected && allMatching.length === 0 && photos.length === 0) {
        return null;
      }

      return {
        key: group.key,
        name: group.name,
        icon: group.icon,
        description: group.description,
        items: allMatching,
        photos,
        isMainSelected: isGroupSelected,
      };
    }).filter(Boolean);
  }, [mainCats, subcats, customMap, item.categoryPhotosMap, item.categoryPhotos]);

  if (groupedServices.length === 0 && subcats.length === 0) {
    return null;
  }

  return (
    <>
      <section className="p-5 sm:p-6 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/40 via-white to-amber-50/30 space-y-5 shadow-xs">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-4 border-b border-amber-100">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center text-xl shadow-xs shrink-0">
              🎪
            </span>
            <div>
              <h3 className="font-serif font-bold text-lg sm:text-xl text-ink">
                Event Services Catalogue & Equipment Setup
              </h3>
              <p className="text-xs text-muted">
                Services, verified equipment setups & real work photos provided by this vendor
              </p>
            </div>
          </div>

          <span className="text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-full self-start sm:self-auto">
            {groupedServices.length} Categories Provided
          </span>
        </div>

        {/* Grouped Services List */}
        <div className="space-y-4">
          {groupedServices.map((group) => (
            <div
              key={group.key}
              className="p-4 sm:p-5 rounded-2xl border border-amber-100 bg-white/95 shadow-2xs space-y-3.5 hover:border-amber-300 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{group.icon}</span>
                  <h4 className="font-bold text-sm sm:text-base text-ink">
                    {group.name}
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  {group.photos.length > 0 && (
                    <span className="text-[11px] font-bold text-white bg-amber-600 px-2.5 py-0.5 rounded-full shadow-2xs">
                      📸 {group.photos.length} {group.photos.length === 1 ? "Photo" : "Photos"}
                    </span>
                  )}
                  <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    {group.items.length} {group.items.length === 1 ? "Option" : "Options"}
                  </span>
                </div>
              </div>

              {group.description && (
                <p className="text-[11px] sm:text-xs text-muted leading-relaxed">
                  {group.description}
                </p>
              )}

              {/* Subcategory checklist pills */}
              {group.items.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {group.items.map((srv, sIdx) => (
                    <span
                      key={sIdx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50/80 border border-amber-200/90 text-xs font-medium text-ink"
                    >
                      <span className="text-amber-700 font-bold text-[10px]">✓</span>
                      <span>{srv}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-emerald-700 font-medium flex items-center gap-1.5 pt-0.5">
                  <span>✓</span>
                  <span>Full Setup Available on Request</span>
                </div>
              )}

              {/* Real Category Photos Showcase Gallery */}
              {group.photos.length > 0 && (
                <div className="pt-2 border-t border-amber-100/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <span>📸</span>
                      <span>{group.name} Real Setup Gallery ({group.photos.length})</span>
                    </span>
                    <span className="text-[10px] text-muted">Click photo to zoom</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {group.photos.map((photoUrl, pIdx) => (
                      <div
                        key={pIdx}
                        onClick={() => setLightboxImage({ url: photoUrl, title: `${group.name} - Setup Photo ${pIdx + 1}` })}
                        className="relative aspect-video rounded-xl overflow-hidden border border-amber-100 bg-gray-100 shadow-2xs group cursor-pointer hover:shadow-md transition-all"
                      >
                        <img
                          src={photoUrl}
                          alt={`${group.name} ${pIdx + 1}`}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1">
                            <span>🔍</span> View
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Extra unmapped subcategories if any */}
        {subcats.length > 0 && groupedServices.length === 0 && (
          <div className="p-4 rounded-xl border border-amber-100 bg-white space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-ink">
              Included Services & Equipment
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {subcats.map((srv, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-xs font-medium text-ink"
                >
                  <span className="text-amber-600 font-bold">✓</span>
                  <span>{srv}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-black/50 rounded-2xl overflow-hidden flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between p-3.5 bg-black/70 text-white border-b border-white/10">
              <span className="text-sm font-bold truncate">{lightboxImage.title}</span>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-sm font-bold cursor-pointer transition"
              >
                ✕
              </button>
            </div>
            <div className="p-2 max-h-[80vh] flex items-center justify-center">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

