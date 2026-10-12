"use client";
import { useEffect, useState } from "react";
import Link from "@/compat/Link";
import { usePathname, useRouter } from "@/compat/navigation";
import { Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api from "@/api/axios";

export default function VendorLayout() {
  const path = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [vendorStatus, setVendorStatus] = useState(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(`/login?next=${encodeURIComponent(path)}`);
      } else if (String(user.role || "").toLowerCase() !== "vendor" && String(user.role || "").toLowerCase() !== "admin") {
        router.push("/account");
      } else {
        // Fetch fresh vendor status
        api.get("/api/vendor/status")
          .then((res) => {
            if (res.data?.ok) {
              setVendorStatus(res.data.data);
            }
          })
          .catch(() => {});
      }
    }
  }, [user, loading, router, path]);

  if (loading) {
    return (
      <div className="container" style={{ padding: "80px 20px", textAlign: "center" }}>
        <p style={{ color: "#888", fontSize: 16 }}>Loading vendor portal...</p>
      </div>
    );
  }

  if (!user || (String(user.role || "").toLowerCase() !== "vendor" && String(user.role || "").toLowerCase() !== "admin")) {
    return null;
  }

  const isApproved = Boolean(vendorStatus ? vendorStatus.isApproved : user.isApproved);
  const status = vendorStatus ? vendorStatus.verificationStatus : user.verificationStatus || "profile_incomplete";

  const navLinks = [
    { href: "/vendor/dashboard", label: "Dashboard", icon: "📊", locked: false },
    { href: "/vendor/onboarding?tab=profile", label: "Profile & Services", icon: "👤", locked: false },
    { href: "/vendor/onboarding?tab=documents", label: "KYC Documents", icon: "📄", locked: false },
    { href: "/vendor/onboarding?tab=bank", label: "Bank Details", icon: "🏦", locked: false },
    { href: "/vendor/onboarding?tab=portfolio", label: "Portfolio", icon: "🎨", locked: false },
    { href: "/vendor/items", label: "My Services / Items", icon: "📦", locked: !isApproved },
    { href: "/vendor/bookings", label: "Bookings", icon: "📅", locked: !isApproved },
  ];

  return (
    <div className="dash" style={{ minHeight: "85vh" }}>
      <aside className="dash-side" style={{ padding: "24px 16px" }}>
        <div style={{ marginBottom: 20, paddingBottom: 14, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <h3 style={{ margin: 0, color: "var(--wine, #8B1E3F)", fontSize: 18 }}>Vendor Portal</h3>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888" }}>
            {user.vendorProfile?.businessName || user.name}
          </p>
          <div style={{ marginTop: 8 }}>
            <span className={`badge badge-${status}`}>
              {isApproved ? "🟢 Approved" : status === "under_review" ? "🔵 Under Review" : status === "rejected" ? "🔴 Rejected" : "🟡 Incomplete"}
            </span>
          </div>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {navLinks.map((link) => {
            const isActive = path === link.href || (link.href.includes("onboarding") && path.startsWith("/vendor/onboarding"));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={isActive ? "active" : ""}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                  opacity: link.locked ? 0.7 : 1,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </div>
                {link.locked && (
                  <span title="Locked until admin approval" style={{ fontSize: 13 }}>
                    🔒
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="dash-main" style={{ padding: "32px 24px" }}>
        {/* Prominent Verification Notice Banner if not approved */}
        {!isApproved && (
          <div
            style={{
              padding: "14px 20px",
              borderRadius: 10,
              marginBottom: 24,
              background: status === "rejected" ? "#fff1f2" : status === "under_review" ? "#eff6ff" : "#fffbeb",
              border: `1px solid ${status === "rejected" ? "#fecdd3" : status === "under_review" ? "#bfdbfe" : "#fef08a"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 24 }}>
                {status === "rejected" ? "🔴" : status === "under_review" ? "⏳" : "⚠️"}
              </span>
              <div>
                <b style={{ color: status === "rejected" ? "#9f1239" : status === "under_review" ? "#1e40af" : "#854d0e", fontSize: 14 }}>
                  {status === "rejected"
                    ? "Verification Rejected: Action Required"
                    : status === "under_review"
                    ? "Account Under Review by Admin"
                    : "Vendor Features Locked — Profile Completion Required"}
                </b>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: "#666" }}>
                  {status === "rejected"
                    ? "One or more documents were rejected by admin. Please review reasons and re-upload."
                    : status === "under_review"
                    ? "Your submission is being reviewed. All vendor features will unlock automatically upon admin approval."
                    : "Services, bookings, and customer features remain locked until KYC submission and admin approval."}
                </p>
              </div>
            </div>

            <Link
              href="/vendor/onboarding"
              className="btn btn-primary"
              style={{ fontSize: 13, padding: "8px 16px", whiteSpace: "nowrap" }}
            >
              {status === "rejected" ? "Fix & Re-upload →" : status === "under_review" ? "View Submission" : "Complete Verification →"}
            </Link>
          </div>
        )}

        <Outlet />
      </div>
    </div>
  );
}
