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
      <div className="loading" style={{ padding: "60px 0", textAlign: "center" }}>
        Loading vendor dashboard...
      </div>
    );
  }

  const completion = profileData?.completion;
  const profile = profileData?.profile;
  const isApproved = Boolean(stats?.isApproved || (profile?.approved && profile?.verificationStatus === "approved"));
  const status = profile?.verificationStatus || stats?.verificationStatus || "profile_incomplete";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: "0 0 4px" }}>
            {profile?.businessName ? profile.businessName : "Vendor Dashboard"}
          </h1>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14 }}>
            {isApproved
              ? "Welcome back! Your vendor account is active and verified."
              : "Welcome to FlipsAura! Complete onboarding and KYC to unlock client bookings."}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className={`badge badge-${status}`} style={{ fontSize: 13, padding: "6px 14px" }}>
            {isApproved
              ? "🟢 Approved Vendor"
              : status === "under_review"
              ? "🔵 Under Review"
              : status === "rejected"
              ? "🔴 Action Required"
              : "🟡 Incomplete Profile"}
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* VENDOR VERIFICATION PROGRESS SECTION (LOCKED OR REVIEW STATE) */}
      {/* ============================================================ */}
      {!isApproved && (
        <div
          className={`verification-banner ${
            status === "rejected"
              ? "banner-rejected"
              : status === "under_review"
              ? "banner-under_review"
              : "banner-incomplete"
          }`}
          style={{ marginBottom: 32 }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
            <div>
              <h3 style={{ margin: "0 0 4px", fontSize: 18, color: "var(--ink)" }}>
                Vendor Verification Progress
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                Follow the 4 verification milestones to unlock your vendor dashboard.
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: "var(--pink-700)" }}>
                {completion?.percentage || 0}%
              </span>
              <span style={{ fontSize: 13, color: "var(--muted)", marginLeft: 6 }}>Completed</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="progress-container" style={{ height: 12 }}>
            <div
              className="progress-bar-fill"
              style={{ width: `${completion?.percentage || 0}%` }}
            />
          </div>

          {/* 4 Milestones Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, margin: "20px 0" }}>
            {/* Milestone 1: Profile */}
            <div style={{ background: "#ffffff", padding: "14px 16px", borderRadius: 10, border: "1px solid #ebdbe2", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 22 }}>
                {completion?.isProfileComplete ? "✅" : "⚠️"}
              </span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Profile & Services</div>
                <span style={{ fontSize: 12, color: completion?.isProfileComplete ? "#2e7d32" : "#b78103" }}>
                  {completion?.isProfileComplete ? "Completed" : "Action Required"}
                </span>
              </div>
            </div>

            {/* Milestone 2: Documents */}
            <div style={{ background: "#ffffff", padding: "14px 16px", borderRadius: 10, border: "1px solid #ebdbe2", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 22 }}>
                {completion?.areDocumentsComplete ? "✅" : "⚠️"}
              </span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Mandatory Documents</div>
                <span style={{ fontSize: 12, color: completion?.areDocumentsComplete ? "#2e7d32" : "#b78103" }}>
                  {completion?.mandatoryUploaded || 0}/{completion?.mandatoryTotal || 3} Uploaded
                </span>
              </div>
            </div>

            {/* Milestone 3: KYC Status */}
            <div style={{ background: "#ffffff", padding: "14px 16px", borderRadius: 10, border: "1px solid #ebdbe2", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 22 }}>
                {completion?.kycStatus === "verified"
                  ? "✅"
                  : completion?.kycStatus === "rejected"
                  ? "🔴"
                  : completion?.kycStatus === "under_review"
                  ? "⏳"
                  : "🟡"}
              </span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>KYC Review</div>
                <span style={{ fontSize: 12, textTransform: "capitalize", color: completion?.kycStatus === "verified" ? "#2e7d32" : "#1565c0" }}>
                  {completion?.kycStatus?.replace("_", " ") || "Pending"}
                </span>
              </div>
            </div>

            {/* Milestone 4: Admin Approval */}
            <div style={{ background: "#ffffff", padding: "14px 16px", borderRadius: 10, border: "1px solid #ebdbe2", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 22 }}>
                {isApproved ? "🟢" : status === "under_review" ? "⏳" : status === "rejected" ? "🔴" : "⏳"}
              </span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Admin Approval</div>
                <span style={{ fontSize: 12, color: isApproved ? "#2e7d32" : "#b78103" }}>
                  {isApproved ? "Approved" : status === "under_review" ? "Review Pending" : status === "rejected" ? "Rejected" : "Pending Submission"}
                </span>
              </div>
            </div>
          </div>

          {/* Rejection Message if applicable */}
          {status === "rejected" && profile?.rejectionReason && (
            <div className="rejection-box">
              <h4 style={{ margin: "0 0 4px", fontSize: 14 }}>⚠️ Application Returned for Revision</h4>
              <p style={{ margin: 0, fontSize: 13 }}>
                <b>Admin Reason:</b> {profile.rejectionReason}
              </p>
            </div>
          )}

          {/* Missing Fields list */}
          {completion?.missingFields?.length > 0 && (
            <div style={{ background: "rgba(255,255,255,0.7)", padding: "14px 18px", borderRadius: 8, margin: "14px 0", border: "1px solid rgba(0,0,0,0.06)" }}>
              <b style={{ fontSize: 13, color: "#854d0e" }}>Still Missing:</b>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {completion.missingFields.map((field, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: "#fff",
                      border: "1px solid #fde047",
                      color: "#854d0e",
                      padding: "3px 10px",
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                  >
                    ⚠️ {field}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Call to action button */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 18, flexWrap: "wrap" }}>
            <Link
              href="/vendor/onboarding"
              className="btn btn-primary"
              style={{ padding: "12px 22px", fontSize: 14, fontWeight: 600 }}
            >
              {status === "rejected"
                ? "Review & Re-upload Documents →"
                : completion?.canSubmitForVerification
                ? "Submit for Admin Verification →"
                : "Complete Your Profile & KYC →"}
            </Link>

            {status === "under_review" && (
              <span style={{ fontSize: 13, color: "#1e40af" }}>
                ℹ️ Your submission is in the review queue. Admins typically review within 24 hours.
              </span>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* VENDOR DASHBOARD FEATURES: LOCKED VS UNLOCKED CARDS */}
      {/* ============================================================ */}
      <h3 style={{ margin: "0 0 16px", color: "var(--ink)", fontSize: 18 }}>
        {isApproved ? "Vendor Overview & Quick Actions" : "Vendor Dashboard Features"}
      </h3>

      {isApproved ? (
        <>
          {/* Active Stats Grid */}
          <div className="stat-grid" style={{ marginBottom: 32 }}>
            <div className="stat" style={{ background: "#fff", padding: 20, borderRadius: 12, border: "1px solid #ebdbe2" }}>
              <b style={{ fontSize: 28, color: "var(--pink-700)" }}>{stats?.items || 0}</b>
              <span style={{ color: "var(--muted)", fontSize: 13 }}>Listed Services / Items</span>
            </div>
            <div className="stat" style={{ background: "#fff", padding: 20, borderRadius: 12, border: "1px solid #ebdbe2" }}>
              <b style={{ fontSize: 28, color: "var(--pink-700)" }}>{stats?.bookings || 0}</b>
              <span style={{ color: "var(--muted)", fontSize: 13 }}>Client Bookings</span>
            </div>
            <div className="stat" style={{ background: "#fff", padding: 20, borderRadius: 12, border: "1px solid #ebdbe2" }}>
              <b style={{ fontSize: 28, color: "var(--pink-700)" }}>₹{(stats?.revenue || 0).toLocaleString("en-IN")}</b>
              <span style={{ color: "var(--muted)", fontSize: 13 }}>Total Revenue</span>
            </div>
          </div>

          {/* Quick Action Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18 }}>
            <div style={{ background: "#fff", padding: 22, borderRadius: 12, border: "1px solid #ebdbe2" }}>
              <h4 style={{ margin: "0 0 8px" }}>📦 Manage Services</h4>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>
                Add new wedding packages, update prices, and edit service descriptions.
              </p>
              <Link href="/vendor/items" className="btn btn-primary" style={{ fontSize: 13, padding: "8px 16px" }}>
                Open My Items →
              </Link>
            </div>

            <div style={{ background: "#fff", padding: 22, borderRadius: 12, border: "1px solid #ebdbe2" }}>
              <h4 style={{ margin: "0 0 8px" }}>📅 Client Bookings</h4>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>
                Review booking dates, customer contact information, and order statuses.
              </p>
              <Link href="/vendor/bookings" className="btn btn-primary" style={{ fontSize: 13, padding: "8px 16px" }}>
                View Bookings →
              </Link>
            </div>

            <div style={{ background: "#fff", padding: 22, borderRadius: 12, border: "1px solid #ebdbe2" }}>
              <h4 style={{ margin: "0 0 8px" }}>🎨 Portfolio Showcase</h4>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>
                Upload new photos and reels from recent weddings to attract couples.
              </p>
              <Link href="/vendor/onboarding?tab=portfolio" className="btn btn-ghost" style={{ fontSize: 13, padding: "8px 16px", border: "1px solid #ddd" }}>
                Manage Portfolio →
              </Link>
            </div>
          </div>
        </>
      ) : (
        /* LOCKED FEATURE CARDS */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          {/* Locked Card 1: Services */}
          <div className="locked-card">
            <div className="locked-overlay-tag">
              <span>🔒</span> Feature Locked
            </div>
            <h4 style={{ margin: "8px 0 6px", fontSize: 16 }}>Services & Item Management</h4>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 16px" }}>
              Listing public services and pricing packages requires an approved account.
            </p>
            <div style={{ fontSize: 12, color: "#854d0e", background: "#fef9c3", padding: "8px 12px", borderRadius: 6, marginBottom: 14 }}>
              Complete your profile and verification to unlock this feature.
            </div>
            <Link href="/vendor/onboarding" className="btn btn-ghost" style={{ fontSize: 12, padding: "6px 14px" }}>
              Complete Verification
            </Link>
          </div>

          {/* Locked Card 2: Bookings */}
          <div className="locked-card">
            <div className="locked-overlay-tag">
              <span>🔒</span> Feature Locked
            </div>
            <h4 style={{ margin: "8px 0 6px", fontSize: 16 }}>Booking Management</h4>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 16px" }}>
              Couples can book your services directly once verification is completed.
            </p>
            <div style={{ fontSize: 12, color: "#854d0e", background: "#fef9c3", padding: "8px 12px", borderRadius: 6, marginBottom: 14 }}>
              Complete your profile and verification to unlock this feature.
            </div>
            <Link href="/vendor/onboarding" className="btn btn-ghost" style={{ fontSize: 12, padding: "6px 14px" }}>
              Complete Verification
            </Link>
          </div>

          {/* Locked Card 3: Payouts */}
          <div className="locked-card">
            <div className="locked-overlay-tag">
              <span>🔒</span> Feature Locked
            </div>
            <h4 style={{ margin: "8px 0 6px", fontSize: 16 }}>Payments & Settlement Payouts</h4>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 16px" }}>
              Bank account verification ensures secure settlement of client payments.
            </p>
            <div style={{ fontSize: 12, color: "#854d0e", background: "#fef9c3", padding: "8px 12px", borderRadius: 6, marginBottom: 14 }}>
              Submit bank details and cheque proof to unlock.
            </div>
            <Link href="/vendor/onboarding?tab=bank" className="btn btn-ghost" style={{ fontSize: 12, padding: "6px 14px" }}>
              Add Bank Details
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
