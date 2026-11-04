"use client";
import React from "react";
import Link from "@/compat/Link";

export default function AdminMehandiDetailsModal({
  isOpen,
  onClose,
  item,
  onEdit,
}) {
  if (!isOpen || !item) return null;

  const pkg = item.mehandiPackages || {};

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl border border-brand-100 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-b border-brand-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl shadow-sm">
              🌿
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
                Showcase Photos ({item.images.length})
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
            <div>
              <span className="text-[11px] font-bold text-muted uppercase block">Contact Phone</span>
              <span className="text-sm font-semibold text-ink">{item.contactPhone || item.vendor?.phone || "—"}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-muted uppercase block">Lead Artist</span>
              <span className="text-sm font-semibold text-ink truncate block">{item.contactPerson || item.vendor?.name || "—"}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-muted uppercase block">Starting Price</span>
              <span className="text-sm font-bold text-wine">
                {item.price > 0 ? `₹${item.price.toLocaleString("en-IN")}` : "Price on Request"}
              </span>
            </div>
          </div>

          {/* Selected Mehndi Options & Design Styles */}
          {item.subcategories?.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink mb-2 flex items-center gap-1.5">
                <span>✨</span> Included Designs & Service Options ({item.subcategories.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {item.subcategories.map((sub, sIdx) => (
                  <span
                    key={sIdx}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
                  >
                    ✓ {sub}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 4 Packages */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink mb-3">
              Pricing Packages
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {["basic", "standard", "premium", "luxury"].map((k) => {
                const p = pkg[k] || {};
                const hasPrice = p.price > 0;
                return (
                  <div key={k} className="p-3.5 rounded-xl border border-brand-100 bg-surface/50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-brand-700">
                        {p.title || `${k.toUpperCase()} PACKAGE`}
                      </span>
                      <span className="text-sm font-bold text-wine">
                        {hasPrice ? `₹${Number(p.price).toLocaleString("en-IN")}` : "Not Set"}
                      </span>
                    </div>
                    {p.description && <p className="text-xs text-muted">{p.description}</p>}
                    {p.deliverables?.length > 0 && (
                      <ul className="text-[11px] text-ink/80 space-y-0.5 pt-1">
                        {p.deliverables.map((d, di) => (
                          <li key={di} className="flex items-center gap-1.5">
                            <span className="text-emerald-600 font-bold">✓</span>
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* About Section */}
          {item.about && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink mb-1">
                About & Bio
              </h4>
              <p className="text-xs text-muted whitespace-pre-line bg-surface/30 p-3 rounded-xl border border-line">
                {item.about}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-surface/60 border-t border-brand-100 flex items-center justify-between shrink-0">
          <Link
            href={`/venues/${item._id}`}
            className="text-xs text-brand-600 hover:underline font-semibold"
          >
            View Customer Page ↗
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                if (onEdit) onEdit(item);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-2xs"
            >
              Edit Listing ✏️
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-line text-ink hover:bg-surface text-xs font-medium transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

