"use client";
import { useEffect, useState } from "react";
import Link from "@/compat/Link";
import api from "@/api/axios";

export default function VendorDashboard() {
  const [stats, setStats] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/api/vendor/stats"),
      api.get("/api/vendor/profile"),
    ])
      .then(([statsRes, profRes]) => {
        if (statsRes.data?.ok) {
          setStats(statsRes.data.data.stats);
        }
        if (profRes.data?.ok) {
          setProfileData(profRes.data.data);
        }
      })
      .catch((err) => {
        console.error("Failed to load vendor dashboard data:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4" />
        <p className="text-muted text-base font-medium">Loading vendor dashboard...</p>
      </div>
    );
  }

  const completion = profileData?.completion;
  const profile = profileData?.profile;
  const isApproved = Boolean(stats?.isApproved || (profile?.approved && profile?.verificationStatus === "approved"));
  const status = profile?.verificationStatus || stats?.verificationStatus || "profile_incomplete";
  const hasHotelService = Boolean(
    profileData?.hasHotelService ||
    profile?.categories?.some((c) => c?.slug === "hotels" || (c?.name || "").toLowerCase().includes("hotel")) ||
    profile?.servicesList?.some((s) => (s?.categoryName || "").toLowerCase().includes("hotel"))
  );

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-wine tracking-tight">
            {profile?.businessName ? profile.businessName : "Vendor Dashboard"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {isApproved
              ? "Welcome back! Your vendor account is active, verified, and visible to couples."
              : "Welcome to FlipsAura! Complete onboarding and KYC verification to unlock client bookings."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold ${
              isApproved
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : status === "under_review"
                ? "bg-sky-50 text-sky-700 border border-sky-200"
                : status === "rejected"
                ? "bg-rose-50 text-rose-700 border border-rose-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            <span>
              {isApproved ? "🟢" : status === "under_review" ? "🔵" : status === "rejected" ? "🔴" : "🟡"}
            </span>
            {isApproved
              ? "Approved Vendor"
              : status === "under_review"
              ? "Under Review"
              : status === "rejected"
              ? "Action Required"
              : "Incomplete Profile"}
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* VENDOR VERIFICATION PROGRESS SECTION (LOCKED OR REVIEW STATE) */}
      {/* ============================================================ */}
      {!isApproved && (
        <div
          className={`p-6 md:p-8 rounded-2xl border shadow-xs ${
            status === "rejected"
              ? "bg-rose-50/70 border-rose-200"
              : status === "under_review"
              ? "bg-sky-50/70 border-sky-200"
              : "bg-amber-50/60 border-amber-200"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="font-serif text-lg md:text-xl font-bold text-ink">
                Vendor Verification Progress
              </h3>
              <p className="mt-1 text-xs md:text-sm text-muted">
                Follow the 4 verification milestones to unlock your vendor dashboard.
              </p>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-brand-600">
                {completion?.percentage || 0}%
              </span>
              <span className="text-xs text-muted font-medium">Completed</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-white/80 rounded-full overflow-hidden border border-line mb-6">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full transition-all duration-500"
              style={{ width: `${completion?.percentage || 0}%` }}
            />
          </div>

          {/* 4 Milestones Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
            {/* Milestone 1: Profile */}
            <div className="bg-white p-4 rounded-xl border border-line flex items-center gap-3.5 shadow-2xs">
              <span className="text-2xl flex-shrink-0">
                {completion?.isProfileComplete ? "✅" : "⚠️"}
              </span>
              <div>
                <div className="text-sm font-semibold text-ink">Profile & Services</div>
                <span
                  className={`text-xs font-medium ${
                    completion?.isProfileComplete ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {completion?.isProfileComplete ? "Completed" : "Action Required"}
                </span>
              </div>
            </div>

            {/* Milestone 2: Documents */}
            <div className="bg-white p-4 rounded-xl border border-line flex items-center gap-3.5 shadow-2xs">
              <span className="text-2xl flex-shrink-0">
                {completion?.areDocumentsComplete ? "✅" : "⚠️"}
              </span>
              <div>
                <div className="text-sm font-semibold text-ink">Mandatory Documents</div>
                <span
                  className={`text-xs font-medium ${
                    completion?.areDocumentsComplete ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {completion?.mandatoryUploaded || 0}/{completion?.mandatoryTotal || 3} Uploaded
                </span>
              </div>
            </div>

            {/* Milestone 3: KYC Status */}
            <div className="bg-white p-4 rounded-xl border border-line flex items-center gap-3.5 shadow-2xs">
              <span className="text-2xl flex-shrink-0">
                {completion?.kycStatus === "verified"
                  ? "✅"
                  : completion?.kycStatus === "rejected"
                  ? "🔴"
                  : completion?.kycStatus === "under_review"
                  ? "⏳"
                  : "🟡"}
              </span>
              <div>
                <div className="text-sm font-semibold text-ink">KYC Review</div>
                <span
                  className={`text-xs font-medium capitalize ${
                    completion?.kycStatus === "verified"
                      ? "text-emerald-700"
                      : "text-sky-700"
                  }`}
                >
                  {completion?.kycStatus?.replace("_", " ") || "Pending"}
                </span>
              </div>
            </div>

            {/* Milestone 4: Admin Approval */}
            <div className="bg-white p-4 rounded-xl border border-line flex items-center gap-3.5 shadow-2xs">
              <span className="text-2xl flex-shrink-0">
                {isApproved ? "🟢" : status === "under_review" ? "⏳" : status === "rejected" ? "🔴" : "⏳"}
              </span>
              <div>
                <div className="text-sm font-semibold text-ink">Admin Approval</div>
                <span
                  className={`text-xs font-medium ${
                    isApproved ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {isApproved
                    ? "Approved"
                    : status === "under_review"
                    ? "Review Pending"
                    : status === "rejected"
                    ? "Rejected"
                    : "Pending Submission"}
                </span>
              </div>
            </div>
          </div>

          {/* Rejection Message if applicable */}
          {status === "rejected" && profile?.rejectionReason && (
            <div className="bg-white p-4 rounded-xl border border-rose-300 text-rose-900 mb-5">
              <h4 className="font-bold text-sm mb-1">⚠️ Application Returned for Revision</h4>
              <p className="text-xs md:text-sm text-ink/80">
                <b className="text-rose-900">Admin Reason:</b> {profile.rejectionReason}
              </p>
            </div>
          )}

          {/* Missing Fields list */}
          {completion?.missingFields?.length > 0 && (
            <div className="bg-white/80 p-4 rounded-xl border border-amber-200 mb-6">
              <b className="text-xs font-semibold text-amber-900 block mb-2">Still Missing:</b>
              <div className="flex flex-wrap gap-2">
                {completion.missingFields.map((field, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 bg-white border border-amber-300 text-amber-900 px-2.5 py-1 rounded-lg text-xs font-medium"
                  >
                    <span>⚠️</span> {field}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Call to action button */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/vendor/onboarding"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition-colors shadow-sm"
            >
              {status === "rejected"
                ? "Review & Re-upload Documents →"
                : completion?.canSubmitForVerification
                ? "Submit for Admin Verification →"
                : "Complete Your Profile & KYC →"}
            </Link>

            {status === "under_review" && (
              <span className="text-xs text-sky-800 font-medium flex items-center gap-1.5">
                <span>ℹ️</span> Your submission is in the review queue. FlipsAura admins typically review within 24 hours.
              </span>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* VENDOR DASHBOARD FEATURES: LOCKED VS UNLOCKED CARDS */}
      {/* ============================================================ */}
      <div>
        <h3 className="font-serif text-lg md:text-xl font-bold text-ink mb-4">
          {isApproved ? "Vendor Overview & Quick Actions" : "Vendor Dashboard Features"}
        </h3>

        {isApproved ? (
          <>
            {/* Active Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              <div className="bg-white p-6 rounded-2xl border border-line shadow-2xs hover:shadow-xs transition-shadow">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">Listed Services</span>
                <b className="text-3xl font-serif font-bold text-wine">{stats?.items || 0}</b>
                <p className="mt-2 text-xs text-muted">Active items and wedding packages</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-line shadow-2xs hover:shadow-xs transition-shadow">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">Client Bookings</span>
                <b className="text-3xl font-serif font-bold text-wine">{stats?.bookings || 0}</b>
                <p className="mt-2 text-xs text-muted">Total inquiries and confirmed dates</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-line shadow-2xs hover:shadow-xs transition-shadow">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">Total Revenue</span>
                <b className="text-3xl font-serif font-bold text-wine">₹{(stats?.revenue || 0).toLocaleString("en-IN")}</b>
                <p className="mt-2 text-xs text-muted">Cumulative gross revenue earned</p>
              </div>
            </div>

            {/* Quick Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white p-6 rounded-2xl border border-line shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center text-xl mb-3">
                    📦
                  </div>
                  <h4 className="font-semibold text-ink text-base mb-1.5">Manage Services</h4>
                  <p className="text-xs md:text-sm text-muted mb-4">
                    Add new wedding packages, update prices, and edit service descriptions.
                  </p>
                </div>
                <Link
                  href="/vendor/items"
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs transition-colors shadow-2xs"
                >
                  Open My Items →
                </Link>
              </div>

              {hasHotelService && (
                <div className="bg-white p-6 rounded-2xl border border-line shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center text-xl mb-3">
                      🛏️
                    </div>
                    <h4 className="font-semibold text-ink text-base mb-1.5">Manage Rooms</h4>
                    <p className="text-xs md:text-sm text-muted mb-4">
                      Add Deluxe, Suite, AC rooms with per-night tariffs, guest capacities and amenities.
                    </p>
                  </div>
                  <Link
                    href="/vendor/rooms"
                    className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs transition-colors shadow-2xs"
                  >
                    Manage Rooms →
                  </Link>
                </div>
              )}

              <div className="bg-white p-6 rounded-2xl border border-line shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center text-xl mb-3">
                    📅
                  </div>
                  <h4 className="font-semibold text-ink text-base mb-1.5">Client Bookings</h4>
                  <p className="text-xs md:text-sm text-muted mb-4">
                    Review booking dates, customer contact information, and order statuses.
                  </p>
                </div>
                <Link
                  href="/vendor/bookings"
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs transition-colors shadow-2xs"
                >
                  View Bookings →
                </Link>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-line shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl mb-3">
                    🎨
                  </div>
                  <h4 className="font-semibold text-ink text-base mb-1.5">Portfolio Showcase</h4>
                  <p className="text-xs md:text-sm text-muted mb-4">
                    Upload new photos and reels from recent weddings to attract couples.
                  </p>
                </div>
                <Link
                  href="/vendor/onboarding?tab=portfolio"
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-line hover:border-brand-600 text-ink hover:text-brand-600 font-medium text-xs transition-colors"
                >
                  Manage Portfolio →
                </Link>
              </div>
            </div>
          </>
        ) : (
          /* LOCKED FEATURE CARDS */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Locked Card 1: Services */}
            <div className="bg-white/80 p-6 rounded-2xl border border-line/80 shadow-2xs relative flex flex-col justify-between opacity-80 hover:opacity-100 transition-opacity">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold mb-3">
                  <span>🔒</span> Feature Locked
                </div>
                <h4 className="font-semibold text-ink text-base mb-1.5">Services & Item Management</h4>
                <p className="text-xs md:text-sm text-muted mb-4">
                  Listing public services and pricing packages requires an approved account.
                </p>
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-xl mb-4">
                  Complete your profile and verification to unlock this feature.
                </div>
              </div>
              <Link
                href="/vendor/onboarding"
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-line hover:border-brand-600 text-ink hover:text-brand-600 text-xs font-medium transition-colors"
              >
                Complete Verification
              </Link>
            </div>

            {/* Locked Card 2: Bookings */}
            <div className="bg-white/80 p-6 rounded-2xl border border-line/80 shadow-2xs relative flex flex-col justify-between opacity-80 hover:opacity-100 transition-opacity">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold mb-3">
                  <span>🔒</span> Feature Locked
                </div>
                <h4 className="font-semibold text-ink text-base mb-1.5">Booking Management</h4>
                <p className="text-xs md:text-sm text-muted mb-4">
                  Couples can book your services directly once verification is completed.
                </p>
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-xl mb-4">
                  Complete your profile and verification to unlock this feature.
                </div>
              </div>
              <Link
                href="/vendor/onboarding"
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-line hover:border-brand-600 text-ink hover:text-brand-600 text-xs font-medium transition-colors"
              >
                Complete Verification
              </Link>
            </div>

            {/* Locked Card 3: Payouts */}
            <div className="bg-white/80 p-6 rounded-2xl border border-line/80 shadow-2xs relative flex flex-col justify-between opacity-80 hover:opacity-100 transition-opacity">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold mb-3">
                  <span>🔒</span> Feature Locked
                </div>
                <h4 className="font-semibold text-ink text-base mb-1.5">Payments & Settlement Payouts</h4>
                <p className="text-xs md:text-sm text-muted mb-4">
                  Bank account verification ensures secure settlement of client payments.
                </p>
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-xl mb-4">
                  Submit bank details and cheque proof to unlock.
                </div>
              </div>
              <Link
                href="/vendor/onboarding?tab=bank"
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-line hover:border-brand-600 text-ink hover:text-brand-600 text-xs font-medium transition-colors"
              >
                Add Bank Details
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
