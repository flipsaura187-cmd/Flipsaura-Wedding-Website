"use client";
import React, { useState } from "react";
import { useRouter } from "@/compat/navigation";

const BIHAR_CITIES = [
  "All Bihar Districts",
  "Aurangabad",
  "Daudnagar",
  "Dehri on Sone",
  "Gaya",
  "Patna",
  "Rohtas",
  "Nalanda",
  "Muzaffarpur",
];

const BUDGET_OPTIONS = [
  { label: "Any Tariff", min: "", max: "" },
  { label: "Budget (Under ₹1,800)", min: "", max: "1800" },
  { label: "Standard (₹1,800 – ₹2,500)", min: "1800", max: "2500" },
  { label: "Premium (₹2,500+)", min: "2500", max: "" },
];

const POPULAR_HOTELS = [
  { name: "The Hotel Sky View", query: "The Hotel Sky View", city: "Aurangabad" },
  { name: "Hotel Imperial", query: "Imperial", city: "Aurangabad" },
  { name: "Gargee Surya Vihar", query: "Gargee", city: "Aurangabad" },
  { name: "Hotel US Residency", query: "US Residency", city: "Aurangabad" },
  { name: "Hotel Raaj Rasoi", query: "Raaj Rasoi", city: "Daudnagar" },
  { name: "Hotel Saraswati Inn", query: "Saraswati Inn", city: "Aurangabad" },
];

export default function HotelSearchBar() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [city, setCity] = useState("");
  const [budgetIdx, setBudgetIdx] = useState(0);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set("q", searchTerm.trim());
    if (city && city !== "All Bihar Districts") params.set("district", city);
    const selBudget = BUDGET_OPTIONS[budgetIdx];
    if (selBudget.min) params.set("minPrice", selBudget.min);
    if (selBudget.max) params.set("maxPrice", selBudget.max);

    const queryStr = params.toString();
    router.push(`/categories/hotels${queryStr ? `?${queryStr}` : ""}`);
  };

  const handleQuickTagClick = (query, quickCity) => {
    const params = new URLSearchParams({ q: query });
    if (quickCity) params.set("district", quickCity);
    router.push(`/categories/hotels?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-container mx-auto px-4 sm:px-6 -mt-8 sm:-mt-12 relative z-20">
      <div className="bg-white rounded-3xl shadow-2xl shadow-brand-900/10 border border-brand-100 p-5 sm:p-7 backdrop-blur-md">
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-brand-50">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center text-lg shrink-0 shadow-inner">
              🏨
            </span>
            <div>
              <h2 className="font-serif font-bold text-ink text-base sm:text-lg leading-tight">
                Search Wedding Hotels & Guest Stays
              </h2>
              <p className="text-xs text-muted">
                Reserve verified AC guest rooms & barat accommodations across Bihar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/70 self-start sm:self-auto">
            <span>✓</span> Direct Booking & Verified Rooms
          </div>
        </div>

        {/* Main Search Controls */}
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          {/* Hotel Name Input */}
          <div className="md:col-span-5 flex flex-col">
            <label className="text-[11px] font-bold text-ink/70 uppercase tracking-wider mb-1 flex items-center gap-1">
              <span>🔍</span> Hotel Name / Keyword
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="e.g. The Hotel Sky View, Imperial, Deluxe AC..."
                className="w-full px-3.5 py-3 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-muted/60 shadow-xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink text-xs p-1"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* City / District Dropdown */}
          <div className="md:col-span-3 flex flex-col">
            <label className="text-[11px] font-bold text-ink/70 uppercase tracking-wider mb-1 flex items-center gap-1">
              <span>📍</span> District / City
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer shadow-xs"
            >
              {BIHAR_CITIES.map((c) => (
                <option key={c} value={c === "All Bihar Districts" ? "" : c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Budget Range */}
          <div className="md:col-span-2 flex flex-col">
            <label className="text-[11px] font-bold text-ink/70 uppercase tracking-wider mb-1 flex items-center gap-1">
              <span>💰</span> Tariff Budget
            </label>
            <select
              value={budgetIdx}
              onChange={(e) => setBudgetIdx(Number(e.target.value))}
              className="w-full px-3 py-3 rounded-xl border border-brand-200 bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer shadow-xs"
            >
              {BUDGET_OPTIONS.map((opt, idx) => (
                <option key={idx} value={idx}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Search Button */}
          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-bold text-sm shadow-md shadow-brand-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
            >
              <span>Search Hotels</span>
              <span>→</span>
            </button>
          </div>
        </form>

        {/* Quick Popular Hotel suggestions */}
        <div className="mt-4 pt-3 border-t border-brand-50 flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-[11px] font-bold text-muted uppercase tracking-wider mr-1">
            Popular Hotels:
          </span>
          {POPULAR_HOTELS.map((h, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleQuickTagClick(h.query, h.city)}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-brand-50/90 hover:bg-brand-100 text-brand-800 border border-brand-200/70 transition-colors cursor-pointer"
            >
              {h.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => router.push("/categories/hotels")}
            className="text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline px-2 py-1 ml-auto transition-colors cursor-pointer"
          >
            Explore All 20+ Hotels ↗
          </button>
        </div>
      </div>
    </div>
  );
}
