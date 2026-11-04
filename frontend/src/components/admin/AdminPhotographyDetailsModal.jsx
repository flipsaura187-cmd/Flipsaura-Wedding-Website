"use client";
import React from "react";

export default function AdminPhotographyDetailsModal({
  isOpen,
  onClose,
  item,
  onEdit,
}) {
  if (!isOpen || !item) return null;

  const pkg = item.photographyPackages || {};

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl border border-brand-100 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-brand-50 to-white border-b border-brand-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center text-xl shadow-sm">
              📷
            </span>
            <div>
              <h2 className="font-serif font-bold text-xl text-ink">
                {item.title}
              </h2>
              <p className="text-xs text-muted flex items-center gap-2">
                <span>📍 {item.locality ? `${item.locality}, ` : ""}{item.city || "Bihar"}</span>
                <span>•</span>
                <span className={item.active ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold"}>
                  {item.active ? "● Active Listing" : "○ Inactive"}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white border border-brand-200 text-muted hover:text-ink flex items-center justify-center transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Photos Carousel/Row */}
          {item.images?.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink mb-2">
                Photos ({item.images.length})
              </h4>
              <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                {item.images.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`${item.title} ${i + 1}`}
                    className="w-28 h-20 rounded-xl object-cover border border-brand-100 shrink-0 shadow-2xs"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-brand-50/50 rounded-xl border border-brand-100">
            <div>
              <span className="text-[11px] font-bold text-muted uppercase block">Contact Phone</span>
              <span className="text-sm font-semibold text-ink">{item.contactPhone || item.vendor?.phone || "—"}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-muted uppercase block">Contact Email</span>
              <span className="text-sm font-semibold text-ink truncate block">{item.contactEmail || item.vendor?.email || "—"}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-muted uppercase block">Starting Price</span>
              <span className="text-base font-bold text-brand-700">
                {item.price > 0 ? `₹${item.price.toLocaleString("en-IN")}` : "Price on Request"}
              </span>
            </div>
          </div>

          {/* Address */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink mb-1">
              Address
            </h4>
            <p className="text-xs sm:text-sm text-ink/80 bg-white p-3 rounded-xl border border-brand-100">
              {item.address || item.vendor?.vendorProfile?.address || `${item.locality ? `${item.locality}, ` : ""}${item.city}, ${item.state || "Bihar"}`}
              {item.pincode && ` — PIN: ${item.pincode}`}
            </p>
          </div>

          {/* About Section */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink mb-1">
              About Section
            </h4>
            <p className="text-xs sm:text-sm text-ink/80 leading-relaxed bg-white p-3 rounded-xl border border-brand-100 whitespace-pre-line">
              {item.about || item.description || "No about information provided."}
            </p>
          </div>

          {/* Packages Breakdown: Basic, Standard, Premium, Luxury */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink mb-2">
              Package Pricing Breakdown
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: "basic", label: "Basic", data: pkg.basic, color: "border-blue-200 bg-blue-50/30 text-blue-900" },
                { key: "standard", label: "Standard", data: pkg.standard, color: "border-emerald-200 bg-emerald-50/30 text-emerald-900" },
                { key: "premium", label: "Premium", data: pkg.premium, color: "border-purple-200 bg-purple-50/30 text-purple-900" },
                { key: "luxury", label: "Luxury", data: pkg.luxury, color: "border-amber-200 bg-amber-50/30 text-amber-900" },
              ].map(({ key, label, data, color }) => (
                <div key={key} className={`p-3.5 rounded-xl border ${color} space-y-2`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {label} Package
                    </span>
                    <span className="text-sm font-bold text-brand-700">
                      {data?.price > 0 ? `₹${data.price.toLocaleString("en-IN")}` : "Not priced"}
                    </span>
                  </div>
                  {data?.title && <p className="text-xs font-semibold text-ink">{data.title}</p>}
                  {data?.description && <p className="text-[11px] text-muted line-clamp-2">{data.description}</p>}
                  {Array.isArray(data?.deliverables) && data.deliverables.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-brand-100/50">
                      {data.deliverables.slice(0, 3).map((d, dIdx) => (
                        <div key={dIdx} className="text-[11px] text-ink/80 flex items-center gap-1.5">
                          <span className="text-emerald-600 font-bold">✓</span>
                          <span className="truncate">{d}</span>
                        </div>
                      ))}
                      {data.deliverables.length > 3 && (
                        <span className="text-[10px] text-muted font-medium block">
                          +{data.deliverables.length - 3} more deliverables
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Albums */}
          {item.albums?.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink mb-2">
                Sample Albums ({item.albums.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {item.albums.map((alb, aIdx) => (
                  <div key={aIdx} className="p-3 rounded-xl border border-brand-100 flex items-center gap-3 bg-white">
                    {alb.coverImage ? (
                      <img src={alb.coverImage} alt={alb.title} className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-brand-50 flex items-center justify-center text-lg">
                        📖
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h5 className="font-bold text-xs text-ink truncate">{alb.title}</h5>
                      {alb.link && (
                        <a href={alb.link} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-600 hover:underline truncate block">
                          🔗 {alb.link}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Videos */}
          {item.videos?.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink mb-2">
                Videos ({item.videos.length})
              </h4>
              <div className="space-y-2">
                {item.videos.map((vid, vIdx) => (
                  <div key={vIdx} className="p-2.5 rounded-xl border border-brand-100 flex items-center gap-2 bg-white text-xs">
                    <span className="text-rose-600 font-bold">▶</span>
                    <span className="font-semibold text-ink">{vid.title}</span>
                    <span className="text-muted truncate max-w-xs">— {vid.url}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-brand-50/50 border-t border-brand-100 flex items-center justify-between shrink-0">
          <a
            href={`/product/${item._id}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"
          >
            <span>↗</span> View Public Customer Page
          </a>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                if (onEdit) onEdit(item);
              }}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
            >
              ✎ Edit Photography Listing
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-brand-200 text-ink font-semibold text-xs rounded-xl hover:bg-brand-50 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

