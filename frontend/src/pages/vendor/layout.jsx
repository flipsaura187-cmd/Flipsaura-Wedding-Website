"use client";
import { useEffect, useState } from "react";
import Link from "@/compat/Link";
import { usePathname, useRouter } from "@/compat/navigation";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api from "@/api/axios";

export default function VendorLayout() {
  const path = usePathname();
  const location = useLocation();
  const router = useRouter();
  const { user, loading, login, logout } = useAuth();
  const [vendorStatus, setVendorStatus] = useState(null);
  const [loggingInDemo, setLoggingInDemo] = useState(false);
  const [localHasHotel, setLocalHasHotel] = useState(false);

  const fetchStatus = () => {
    if (!loading && user && (String(user.role || "").toLowerCase() === "vendor" || String(user.role || "").toLowerCase() === "admin")) {
      api.get("/api/vendor/status")
        .then((res) => {
          if (res.data?.ok) {
            setVendorStatus(res.data.data);
          }
        })
        .catch(() => {});
    }
    try {
      setLocalHasHotel(localStorage.getItem("flipsaura_has_hotel") === "true");
    } catch {}
  };

  useEffect(() => {
    fetchStatus();
    window.addEventListener("vendor_profile_updated", fetchStatus);
    window.addEventListener("storage", fetchStatus);
    return () => {
      window.removeEventListener("vendor_profile_updated", fetchStatus);
      window.removeEventListener("storage", fetchStatus);
    };
  }, [user, loading]);

  const handleDemoLogin = async () => {
    setLoggingInDemo(true);
    try {
      await login("royalheritage.vendor@example.com", "VendorPass123!");
    } catch (e) {
      console.error(e);
    } finally {
      setLoggingInDemo(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="inline-block w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4" />
        <p className="text-muted text-base font-medium">Loading vendor portal...</p>
      </div>
    );
  }

  const isOnboarding = location.pathname.startsWith("/vendor/onboarding");

  // Not signed in and not on onboarding page: show clear friendly sign-in card
  if (!user && !isOnboarding) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4 bg-surface">
        <div className="w-full max-w-lg bg-white p-8 md:p-10 rounded-3xl border border-line shadow-xl shadow-brand-500/5 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center text-3xl mx-auto shadow-xs">
            🏪
          </div>
          <div>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-wine">
              Vendor Portal Sign In
            </h2>
            <p className="text-sm text-muted mt-2">
              Please sign in with a Vendor account to access Vendor Portal, Services, and Bookings.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              href={`/login?next=${encodeURIComponent(location.pathname + location.search)}`}
              className="w-full block py-3 px-4 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 shadow-md shadow-brand-500/20 transition-all text-center"
            >
              Sign In to Your Vendor Account →
            </Link>

            <Link
              href="/register"
              className="w-full block py-2.5 px-4 rounded-xl text-ink font-semibold text-sm bg-white hover:bg-brand-50 border border-brand-200 transition-all text-center"
            >
              Register New Vendor Account
            </Link>
          </div>

          <div className="pt-4 border-t border-line">
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loggingInDemo}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>🚀</span>
              <span>
                {loggingInDemo ? "Logging in..." : "1-Click Demo Vendor Login (Royal Heritage Palace)"}
              </span>
            </button>
            <p className="text-[11px] text-muted mt-1.5">
              Quickly test the portal with pre-verified sample vendor credentials.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Signed in as customer and not on onboarding: show clear message with option to switch
  const isVendorOrAdmin = user && (String(user.role || "").toLowerCase() === "vendor" || String(user.role || "").toLowerCase() === "admin");
  if (user && !isVendorOrAdmin && !isOnboarding) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4 bg-surface">
        <div className="w-full max-w-lg bg-white p-8 md:p-10 rounded-3xl border border-line shadow-xl shadow-brand-500/5 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center text-3xl mx-auto shadow-xs">
            ⚠️
          </div>
          <div>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-wine">
              Vendor Account Required
            </h2>
            <p className="text-sm text-muted mt-2">
              You are currently signed in as a Customer (<b>{user.email}</b>). The Vendor Portal is reserved for wedding vendors and businesses.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              href="/vendor/onboarding"
              className="w-full block py-3 px-4 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 shadow-md shadow-brand-500/20 transition-all text-center"
            >
              Start Vendor Onboarding Now →
            </Link>

            <button
              type="button"
              onClick={async () => {
                await logout();
                router.push(`/login?next=${encodeURIComponent(location.pathname + location.search)}`);
              }}
              className="w-full py-2.5 px-4 rounded-xl text-ink font-semibold text-sm bg-white hover:bg-brand-50 border border-brand-200 transition cursor-pointer"
            >
              Switch Account / Sign In with Different Email
            </button>
          </div>

          <div className="pt-4 border-t border-line">
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loggingInDemo}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>🚀</span>
              <span>
                {loggingInDemo ? "Logging in..." : "Switch to Demo Vendor (Royal Heritage Palace)"}
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isApproved = Boolean(vendorStatus ? vendorStatus.isApproved : user?.isApproved);
  const status = vendorStatus ? vendorStatus.verificationStatus : user?.verificationStatus || "profile_incomplete";
  const hasHotelService = Boolean(
    vendorStatus?.hasHotelService ||
    localHasHotel ||
    user?.vendorProfile?.categories?.some((c) => c?.slug === "hotels" || (c?.name || "").toLowerCase().includes("hotel")) ||
    user?.vendorProfile?.servicesList?.some((s) => (s?.categoryName || "").toLowerCase().includes("hotel"))
  );

  const navLinks = [
    { href: "/vendor/dashboard", label: "Dashboard", icon: "📊", locked: !user || !isApproved },
    { href: "/vendor/onboarding?tab=profile", label: "Basic Profile", icon: "👤", locked: false },
    { href: "/vendor/onboarding?tab=services", label: "Services & Amenities", icon: "✨", locked: false },
    { href: "/vendor/onboarding?tab=documents", label: "KYC Documents", icon: "📄", locked: false },
    { href: "/vendor/onboarding?tab=bank", label: "Bank Details", icon: "🏦", locked: false },
    { href: "/vendor/onboarding?tab=portfolio", label: "Portfolio", icon: "🎨", locked: false },
    { href: "/vendor/items", label: "My Services / Items", icon: "📦", locked: !user || !isApproved },
    ...(hasHotelService
      ? [{ href: "/vendor/rooms", label: "Manage Rooms", icon: "🛏️", locked: !user || !isApproved }]
      : []),
    { href: "/vendor/bookings", label: "Bookings", icon: "📅", locked: !user || !isApproved },
  ];

  return (
    <div className="min-h-[85vh] bg-surface flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-line p-5 md:p-6 flex-shrink-0">
        <div className="pb-5 mb-5 border-b border-line">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-600 animate-pulse" />
            <h3 className="font-serif text-lg font-bold text-wine tracking-tight">Vendor Portal</h3>
          </div>
          <p className="text-xs text-muted truncate font-medium">
            {user?.vendorProfile?.businessName || user?.name || "Vendor Onboarding"}
          </p>
          <div className="mt-3">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                isApproved
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : status === "under_review"
                  ? "bg-sky-50 text-sky-700 border border-sky-200"
                  : status === "rejected"
                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              <span className="text-[10px]">
                {isApproved ? "🟢" : status === "under_review" ? "🔵" : status === "rejected" ? "🔴" : "🟡"}
              </span>
              {isApproved
                ? "Approved"
                : status === "under_review"
                ? "Under Review"
                : status === "rejected"
                ? "Rejected"
                : "Incomplete"}
            </span>
          </div>
        </div>

        <nav className="flex flex-col gap-1.5">
          {navLinks.map((link) => {
            const currentTab = new URLSearchParams(location.search).get("tab") || "profile";
            const linkTab = link.href.includes("tab=") ? link.href.split("tab=")[1] : "";
            const isActive =
              (location.pathname + location.search) === link.href ||
              (link.href.startsWith("/vendor/onboarding") && location.pathname === "/vendor/onboarding" && linkTab === currentTab);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-brand-50 text-brand-600 font-semibold shadow-xs"
                    : "text-ink/80 hover:bg-gray-50 hover:text-ink"
                } ${link.locked ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">{link.icon}</span>
                  <span>{link.label}</span>
                </div>
                {link.locked && (
                  <span title="Locked until admin approval" className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                    🔒
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-5 md:p-8 overflow-y-auto">
        {/* Guest Preview Mode Banner on Onboarding */}
        {!user && isOnboarding && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs md:text-sm shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">ℹ️</span>
              <div>
                <b className="font-bold">Guest Preview Mode: </b>
                <span>You can configure and test vendor services & amenities below. Log in with a vendor account to persist to database.</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loggingInDemo}
                className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50"
              >
                {loggingInDemo ? "Logging in..." : "🚀 1-Click Demo Login"}
              </button>
              <Link
                href={`/login?next=${encodeURIComponent(location.pathname + location.search)}`}
                className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 font-semibold text-xs transition text-center"
              >
                Sign In
              </Link>
            </div>
          </div>
        )}

        {/* Customer Onboarding Notice Banner */}
        {user && !isVendorOrAdmin && isOnboarding && (
          <div className="mb-6 p-4 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs md:text-sm shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🏪</span>
              <div>
                <b className="font-bold">New Vendor Onboarding: </b>
                <span>Signed in as <b>{user.email}</b>. Save your business details and amenities below to activate your vendor profile.</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loggingInDemo}
                className="px-3.5 py-1.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50"
              >
                {loggingInDemo ? "Logging in..." : "🚀 Switch to Demo Vendor"}
              </button>
            </div>
          </div>
        )}

        {/* Prominent Verification Notice Banner if not approved (outside onboarding) */}
        {!isOnboarding && !isApproved && (
          <div
            className={`p-4 md:p-5 rounded-2xl mb-8 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs ${
              status === "rejected"
                ? "bg-rose-50/80 border-rose-200"
                : status === "under_review"
                ? "bg-sky-50/80 border-sky-200"
                : "bg-amber-50/80 border-amber-200"
            }`}
          >
            <div className="flex items-start sm:items-center gap-3.5">
              <span className="text-2xl mt-0.5 sm:mt-0">
                {status === "rejected" ? "🔴" : status === "under_review" ? "⏳" : "⚠️"}
              </span>
              <div>
                <b
                  className={`text-sm md:text-base font-bold ${
                    status === "rejected"
                      ? "text-rose-900"
                      : status === "under_review"
                      ? "text-sky-900"
                      : "text-amber-900"
                  }`}
                >
                  {status === "rejected"
                    ? "Verification Rejected: Action Required"
                    : status === "under_review"
                    ? "Account Under Review by Admin"
                    : "Vendor Features Locked — Profile Completion Required"}
                </b>
                <p className="mt-1 text-xs sm:text-sm text-ink/70 max-w-2xl leading-relaxed">
                  {status === "rejected"
                    ? "One or more documents were rejected by admin. Please review the reasons and re-upload required credentials."
                    : status === "under_review"
                    ? "Your submission is currently in the admin review queue. All vendor features will unlock automatically upon approval."
                    : "Listing services, receiving bookings, and customer features remain locked until KYC submission and admin verification."}
                </p>
              </div>
            </div>

            <Link
              href="/vendor/onboarding"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs sm:text-sm transition-colors shadow-xs flex-shrink-0"
            >
              {status === "rejected"
                ? "Fix & Re-upload →"
                : status === "under_review"
                ? "View Submission →"
                : "Complete Verification →"}
            </Link>
          </div>
        )}

        <Outlet />
      </main>
    </div>
  );
}
