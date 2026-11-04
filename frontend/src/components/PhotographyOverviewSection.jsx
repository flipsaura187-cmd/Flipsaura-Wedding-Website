"use client";
import React, { useState } from "react";

export default function PhotographyOverviewSection({ item }) {
  if (!item) return null;

  const pkg = item.photographyPackages || {};
  const [selectedPkg, setSelectedPkg] = useState("standard");

  const packagesList = [
    {
      key: "basic",
      label: "Basic",
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
      activeRing: "ring-2 ring-blue-500",
      data: pkg.basic,
    },
    {
      key: "standard",
      label: "Standard",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      activeRing: "ring-2 ring-emerald-500",
      data: pkg.standard,
    },
    {
      key: "premium",
      label: "Premium",
      badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
      activeRing: "ring-2 ring-purple-500",
      data: pkg.premium,
    },
    {
      key: "luxury",
      label: "Luxury",
      badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
      activeRing: "ring-2 ring-amber-500",
      data: pkg.luxury,
    },
  ].filter((p) => p.data && (p.data.price > 0 || p.data.deliverables?.length > 0));

  const phone = item.contactPhone || item.vendor?.phone || "";

  return (
    <div className="space-y-10 pt-4">
      {/* 1. TIERED PACKAGES PRICING SECTION */}
      {packagesList.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-brand-600 block">
                Photography & Cinematography Tariffs
              </span>
              <h3 className="font-serif text-2xl font-bold text-ink">
                Select Your Wedding Package
              </h3>
            </div>
            <span className="text-xs text-muted font-medium bg-brand-50 px-3 py-1 rounded-full border border-brand-100 self-start sm:self-auto">
              ✓ Transparent Pricing & Deliverables
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {packagesList.map(({ key, label, badgeClass, activeRing, data }) => {
              const isSelected = selectedPkg === key;

              return (
                <div
                  key={key}
                  onClick={() => setSelectedPkg(key)}
                  className={`p-5 rounded-2xl border bg-white shadow-xs transition-all cursor-pointer relative flex flex-col justify-between ${
                    isSelected
                      ? `border-brand-500 ${activeRing} shadow-md`
                      : "border-brand-100 hover:border-brand-300 hover:shadow"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${badgeClass}`}>
                        {label} Package
                      </span>
                      {isSelected && (
                        <span className="text-[11px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                          ● Selected
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="font-serif font-bold text-lg text-ink">
                        {data.title || `${label} Wedding Package`}
                      </h4>
                      {data.description && (
                        <p className="text-xs text-muted mt-1 leading-relaxed">
                          {data.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-brand-50">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-bold text-brand-700">
                          {data.price > 0 ? `₹${data.price.toLocaleString("en-IN")}` : "Price on Request"}
                        </span>
                        {data.price > 0 && (
                          <span className="text-xs text-muted font-normal">all inclusive</span>
                        )}
                      </div>
                    </div>

                    {/* Deliverables Checklist */}
                    {Array.isArray(data.deliverables) && data.deliverables.length > 0 && (
                      <div className="pt-2 space-y-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted block">
                          Included Deliverables:
                        </span>
                        {data.deliverables.map((item, dIdx) => (
                          <div key={dIdx} className="text-xs text-ink/80 flex items-start gap-2">
                            <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {phone && (
                    <div className="pt-4 mt-4 border-t border-brand-50">
                      <a
                        href={`https://wa.me/${phone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(
                          `Hello, I would like to book or inquire about the ${label} Package (₹${data.price || "On Request"}) of ${item.title} on FlipsAura.`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-full py-2 px-3 rounded-xl text-center text-xs font-bold bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 block transition-all"
                      >
                        Enquire for {label} Package →
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 2. SAMPLE ALBUMS SHOWCASE */}
      {Array.isArray(item.albums) && item.albums.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-brand-100">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600 block">
              Portfolio
            </span>
            <h3 className="font-serif text-2xl font-bold text-ink">
              Sample Photo Albums ({item.albums.length})
            </h3>
            <p className="text-xs text-muted mt-0.5">
              Browse curated sample albums showcasing pre-wedding shoots, wedding ceremonies, and bridal portraits.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {item.albums.map((alb, aIdx) => (
              <div
                key={aIdx}
                className="p-4 rounded-2xl border border-brand-100 bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {alb.coverImage ? (
                    <div className="aspect-[16/10] rounded-xl overflow-hidden bg-brand-50 border border-brand-100">
                      <img
                        src={alb.coverImage}
                        alt={alb.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[16/10] rounded-xl bg-brand-50 flex items-center justify-center text-3xl border border-brand-100">
                      📖
                    </div>
                  )}

                  <div>
                    <h4 className="font-serif font-bold text-base text-ink">
                      {alb.title}
                    </h4>
                    {alb.description && (
                      <p className="text-xs text-muted mt-1 line-clamp-2">
                        {alb.description}
                      </p>
                    )}
                  </div>

                  {Array.isArray(alb.images) && alb.images.length > 0 && (
                    <div className="flex gap-1.5 overflow-x-auto py-1">
                      {alb.images.slice(0, 4).map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt=""
                          className="w-14 h-14 rounded-lg object-cover border border-brand-100 shrink-0"
                        />
                      ))}
                      {alb.images.length > 4 && (
                        <div className="w-14 h-14 rounded-lg bg-brand-50 border border-brand-100 text-[10px] font-bold text-brand-700 flex items-center justify-center shrink-0">
                          +{alb.images.length - 4}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {alb.link && (
                  <div className="pt-3 mt-3 border-t border-brand-50">
                    <a
                      href={alb.link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      <span>🔗 Open Album Portfolio</span>
                      <span>↗</span>
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. SHOWCASE VIDEOS */}
      {Array.isArray(item.videos) && item.videos.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-brand-100">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600 block">
              Cinematography
            </span>
            <h3 className="font-serif text-2xl font-bold text-ink">
              Featured Wedding Films & Teasers ({item.videos.length})
            </h3>
            <p className="text-xs text-muted mt-0.5">
              Watch cinematic wedding trailers, sangeet teasers, and bride & groom highlight films.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {item.videos.map((vid, vIdx) => {
              // Convert YouTube watch URL to embed if applicable
              const getEmbedUrl = (url) => {
                if (!url) return null;
                if (url.includes("youtube.com/watch?v=")) {
                  const id = url.split("watch?v=")[1]?.split("&")[0];
                  return `https://www.youtube.com/embed/${id}`;
                }
                if (url.includes("youtu.be/")) {
                  const id = url.split("youtu.be/")[1]?.split("?")[0];
                  return `https://www.youtube.com/embed/${id}`;
                }
                return null;
              };

              const embedUrl = getEmbedUrl(vid.url);

              return (
                <div
                  key={vIdx}
                  className="rounded-2xl border border-brand-100 bg-white overflow-hidden shadow-xs space-y-2.5 p-3"
                >
                  {embedUrl ? (
                    <div className="aspect-video rounded-xl overflow-hidden bg-black">
                      <iframe
                        src={embedUrl}
                        title={vid.title}
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video rounded-xl bg-ink/90 flex flex-col items-center justify-center text-white p-4 text-center">
                      <span className="text-3xl mb-2 text-rose-500">▶</span>
                      <span className="font-bold text-xs">{vid.title}</span>
                    </div>
                  )}

                  <div className="px-1 flex items-center justify-between gap-2">
                    <h5 className="font-bold text-xs text-ink truncate">{vid.title}</h5>
                    <a
                      href={vid.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-brand-600 hover:underline shrink-0"
                    >
                      Watch ↗
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. ADDRESS & LOCATION CARD */}
      <section className="p-5 rounded-2xl border border-brand-100 bg-brand-50/40 space-y-2">
        <h4 className="font-serif font-bold text-sm uppercase tracking-wider text-ink flex items-center gap-2">
          <span>📍</span> Studio Location & Studio Address
        </h4>
        <p className="text-xs sm:text-sm text-ink/80 leading-relaxed">
          {item.address || `${item.locality ? `${item.locality}, ` : ""}${item.city}, ${item.state || "Bihar"}`}
          {item.pincode && ` — PIN: ${item.pincode}`}
        </p>
        {phone && (
          <p className="text-xs text-muted pt-1">
            Studio Contact: <b className="text-ink font-semibold">{phone}</b>
          </p>
        )}
      </section>
    </div>
  );
}

