"use client";
import { useEffect } from "react";
import Link from "@/compat/Link";
import { usePathname, useRouter } from "@/compat/navigation";
import { Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function AdminLayout() {
  const path = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(`/login?next=${encodeURIComponent(path)}`);
      } else if (String(user.role || "").toLowerCase() !== "admin") {
        router.push("/account");
      }
    }
  }, [user, loading, router, path]);

  if (loading) {
    return (
      <div className="container" style={{ padding: "80px 20px", textAlign: "center" }}>
        <p style={{ color: "#888", fontSize: 16 }}>Verifying administrative privileges...</p>
      </div>
    );
  }

  if (!user || String(user.role || "").toLowerCase() !== "admin") {
    return null;
  }

  const links = [
    { href: "/admin/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/admin/blogs", label: "Blogs", icon: "📝" },
    { href: "/admin/categories", label: "Categories", icon: "🏷️" },
    { href: "/admin/items", label: "Items", icon: "📦" },
    { href: "/admin/bookings", label: "Bookings", icon: "📅" },
    { href: "/admin/users", label: "Users", icon: "👥" },
  ];

  return (
    <div className="dash" style={{ minHeight: "80vh" }}>
      <aside className="dash-side" style={{ padding: "24px 16px" }}>
        <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <h3 style={{ margin: 0, color: "var(--wine, #8B1E3F)", fontSize: 18 }}>Admin Control</h3>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888" }}>{user.email}</p>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={path === link.href || (link.href === "/admin/blogs" && path.startsWith("/admin/blogs")) ? "active" : ""}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
                transition: "all 0.15s ease",
              }}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <div className="dash-main" style={{ padding: "32px 24px" }}>
        <Outlet />
      </div>
    </div>
  );
}
