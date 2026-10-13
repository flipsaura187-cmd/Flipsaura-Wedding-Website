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
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center text-muted">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Verifying administrative privileges...</p>
        </div>
      </div>
    );
  }

  if (!user || String(user.role || "").toLowerCase() !== "admin") {
    return null;
  }

  const links = [
    { href: "/admin/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/admin/events", label: "Events", icon: "🏆" },
    { href: "/admin/vendors", label: "Vendors", icon: "🏪" },
    { href: "/admin/blogs", label: "Blogs", icon: "📝" },
    { href: "/admin/categories", label: "Categories", icon: "🏷️" },
    { href: "/admin/items", label: "Items", icon: "📦" },
    { href: "/admin/bookings", label: "Bookings", icon: "📅" },
    { href: "/admin/users", label: "Users", icon: "👥" },
  ];

  return (
    <div className="min-h-[85vh] bg-surface flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-brand-100 flex-shrink-0 p-4 sm:p-6">
        <div className="mb-6 pb-4 border-b border-brand-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-600 animate-pulse" />
            <h3 className="font-serif font-bold text-lg text-ink">Admin Control</h3>
          </div>
          <p className="text-xs text-muted truncate mt-1">{user.email}</p>
        </div>

        <nav className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
          {links.map((link) => {
            const isActive =
              path === link.href ||
              (link.href === "/admin/blogs" && path.startsWith("/admin/blogs")) ||
              (link.href === "/admin/events" && path.startsWith("/admin/events"));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? "bg-brand-600 text-white shadow-md shadow-brand-600/20 font-semibold"
                    : "text-ink/80 hover:bg-brand-50 hover:text-brand-700"
                }`}
              >
                <span className="text-base">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
