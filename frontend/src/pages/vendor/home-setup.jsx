"use client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/api/axios";
import HomeSetupOnboarding, { HOME_SETUP_CATEGORIES } from "@/components/vendor/HomeSetupOnboarding";

function categoryToSlug(cat) {
  return cat.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const COLOR_MAP = {
  "Tent & Pandal": "amber",
  "Furniture & Seating": "orange",
  "Stage & Decoration": "pink",
  "DJ & Sound System": "purple",
  "Lighting & Special Effects": "yellow",
  "Power & Generator": "green",
};

function colorClass(color) {
  const map = {
    amber: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", btn: "bg-amber-100 hover:bg-amber-200 text-amber-800" },
    orange: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", btn: "bg-orange-100 hover:bg-orange-200 text-orange-800" },
    pink: { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200", btn: "bg-pink-100 hover:bg-pink-200 text-pink-800" },
    purple: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", btn: "bg-purple-100 hover:bg-purple-200 text-purple-800" },
    yellow: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", btn: "bg-yellow-100 hover:bg-yellow-200 text-yellow-800" },
    green: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", btn: "bg-green-100 hover:bg-green-200 text-green-800" },
  };
  return map[color] || map.amber;
}

export default function VendorHomeSetupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [services, setServices] = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileRes, statsRes, servicesRes] = await Promise.all([
        api.get("/api/vendor/home-setup-v2/profile").catch(() => ({ data: { ok: false } })),
        api.get("/api/vendor/home-setup-v2/stats").catch(() => ({ data: { ok: false } })),
        api.get("/api/vendor/home-setup-v2/my-services").catch(() => ({ data: { ok: false } })),
      ]);

      const prof = profileRes.data?.ok ? profileRes.data.data?.profile : null;
      setProfile(prof);
      if (!prof) setShowOnboarding(true);

      if (statsRes.data?.ok) setStats(statsRes.data.data?.stats);
      if (servicesRes.data?.ok) setServices(servicesRes.data.data?.services || []);
    } catch {
      setShowOnboarding(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Count services per category
  const serviceCountByCategory = {};
  const publishedCountByCategory = {};
  services.forEach((svc) => {
    const cat = svc.mainCategory;
    if (!serviceCountByCategory[cat]) serviceCountByCategory[cat] = 0;
    if (!publishedCountByCategory[cat]) publishedCountByCategory[cat] = 0;
    serviceCountByCategory[cat]++;
    if (svc.status === "published") publishedCountByCategory[cat]++;
  });

  const allCategories = [
    ...(profile?.selectedCategories?.map((id) => {
      const found = HOME_SETUP_CATEGORIES.find((c) => c.id === id);
      return found || { id, label: id, icon: "📦", color: "amber" };
    }) || []),
    ...(profile?.customCategories?.map((cc) => ({
      id: cc.name,
      label: cc.name,
      icon: "🏷️",
      color: "amber",
      isCustom: true,
    })) || []),
  ];

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block w-8 h-8 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin mb-4" />
        <p className="text-sm text-gray-500 font-medium">Loading Home Setup portal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Onboarding Modal */}
      <HomeSetupOnboarding
        isOpen={showOnboarding}
        initialStep={onboardingStep}
        initialData={onboardingStep === 1 ? null : profile}
        onComplete={() => {
          setShowOnboarding(false);
          setOnboardingStep(1);
          fetchData();
        }}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🎪</span>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-amber-900 tracking-tight">
              Home Setup Services
            </h1>
          </div>
          <p className="text-xs text-gray-500">
            Manage Tent, Pandal, DJ, Lighting, Furniture, Stage Decoration and more.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => { setOnboardingStep(1); setShowOnboarding(true); }}
            className="px-4 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-sm font-medium transition-colors cursor-pointer"
          >
            📍 Edit Locations
          </button>
          <button
            type="button"
            onClick={() => { setOnboardingStep(2); setShowOnboarding(true); }}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            + Add More Categories
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Total Categories", value: allCategories.length, icon: "📂", color: "bg-amber-50 border-amber-200 text-amber-700" },
            { label: "Total Services", value: stats.total ?? services.length, icon: "📦", color: "bg-blue-50 border-blue-200 text-blue-700" },
            { label: "Published", value: stats.published ?? services.filter(s => s.status === "published").length, icon: "✅", color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
            { label: "Draft", value: stats.draft ?? services.filter(s => s.status === "draft").length, icon: "📝", color: "bg-gray-50 border-gray-200 text-gray-700" },
            { label: "Unavailable", value: stats.unavailable ?? services.filter(s => s.isAvailable === false).length, icon: "⛔", color: "bg-rose-50 border-rose-200 text-rose-700" },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`rounded-2xl border p-4 flex flex-col items-center text-center ${stat.color}`}
            >
              <span className="text-xl mb-1">{stat.icon}</span>
              <span className="text-2xl font-bold">{stat.value ?? 0}</span>
              <span className="text-xs font-medium mt-0.5 opacity-80">{stat.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Category Cards Grid */}
      {allCategories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allCategories.map((cat) => {
            const color = colorClass(COLOR_MAP[cat.id] || cat.color || "amber");
            const count = serviceCountByCategory[cat.id] || 0;
            const published = publishedCountByCategory[cat.id] || 0;
            const slug = categoryToSlug(cat.id);

            return (
              <div
                key={cat.id}
                className={`rounded-2xl border ${color.border} ${color.bg} p-5 flex flex-col gap-3 hover:shadow-md transition-shadow`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-serif font-bold text-base ${color.text} truncate`}>
                      {cat.label}
                    </h3>
                    {cat.isCustom && (
                      <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded-full">
                        Custom
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 text-sm">
                  <div className="flex flex-col items-center bg-white/70 rounded-xl px-3 py-2 flex-1 border border-white">
                    <span className="text-lg font-bold text-gray-800">{count}</span>
                    <span className="text-[10px] text-gray-500">Total</span>
                  </div>
                  <div className="flex flex-col items-center bg-white/70 rounded-xl px-3 py-2 flex-1 border border-white">
                    <span className="text-lg font-bold text-emerald-600">{published}</span>
                    <span className="text-[10px] text-gray-500">Published</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/vendor/home-setup/${slug}`)}
                  className={`w-full py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${color.btn}`}
                >
                  Manage Services →
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-amber-50/50 rounded-2xl border border-dashed border-amber-200">
          <span className="text-5xl mb-4 block">🎪</span>
          <h3 className="font-serif text-lg font-bold text-amber-900 mb-2">No categories yet</h3>
          <p className="text-sm text-amber-700 mb-5">
            Complete the setup to start adding your Home Setup service categories.
          </p>
          <button
            type="button"
            onClick={() => setShowOnboarding(true)}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-colors cursor-pointer"
          >
            Start Setup →
          </button>
        </div>
      )}

      {/* Service Locations */}
      {profile?.locations?.length > 0 && (
        <div className="p-5 rounded-2xl bg-white border border-amber-100 shadow-xs">
          <h3 className="font-semibold text-amber-900 text-sm mb-3 flex items-center gap-2">
            <span>📍</span> Service Locations
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile.locations.map((loc, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800"
              >
                {loc.city}{loc.state ? `, ${loc.state}` : ""}
                {loc.serviceRadius ? ` · ${loc.serviceRadius}` : ""}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
