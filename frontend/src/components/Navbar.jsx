"use client";
import React, { useState } from "react";
import Link from "@/compat/Link";
import { useAuth } from "@/context/AuthContext";
import Image from "@/compat/Image";
import { usePathname } from "@/compat/navigation";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const pathname = usePathname() || "/";

  const role = String(user?.role || "").toLowerCase();
  const isVendor = role === "vendor" || pathname.startsWith("/vendor");
  const userName = user?.name || "My Account";

  const navLinks = isVendor
    ? [
        { href: "/vendor/dashboard", label: "Vendor Portal" },
        { href: "/events", label: "Events" },
        { href: "/blogs", label: "Blogs" },
      ]
    : [
        { href: "/", label: "Home" },
        { href: "/categories/hotels", label: "🏨 Hotels" },
        { href: "/categories/venues", label: "Venue/Resorts" },
        { href: "/categories/home-setup-pandal-tent-dj", label: "Home Setup" },
        { href: "/categories/planning-decor", label: "Planning & Decor" },
        { href: "/events", label: "Events" },
        { href: "/blogs", label: "Blogs" },
      ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-line shadow-xs">
      <div className="w-full px-4 sm:px-6 lg:px-10 h-20 md:h-22 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href={isVendor ? "/vendor/dashboard" : "/"} className="flex items-center group flex-shrink-0 py-1">
          <Image
            src="/logo.png"
            alt="FlipsAura Logo"
            width={2088}
            height={922}
            className="h-12 sm:h-14 md:h-16 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
          />
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-3 flex-shrink-0">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : link.href === "/vendor/dashboard"
                ? pathname.startsWith("/vendor")
                : pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all duration-200 ${
                  isActive
                    ? "text-brand-600 font-semibold bg-brand-50"
                    : "text-ink/80 hover:text-brand-600 hover:bg-brand-50/50"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Auth / User Controls */}
        <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
          {user ? (
            <>
              {role === "admin" && (
                <Link
                  href="/admin/dashboard"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold hover:bg-amber-100 transition-colors"
                >
                  <span>👑 {userName}</span>
                  <span className="bg-amber-200 text-amber-950 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider">
                    Admin
                  </span>
                </Link>
              )}

              {role === "vendor" && (
                <Link
                  href="/vendor/dashboard"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200 text-xs font-semibold hover:bg-brand-100 transition-colors"
                >
                  <span>🏪 {userName}</span>
                  <span className="bg-brand-200 text-brand-900 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider">
                    Vendor
                  </span>
                </Link>
              )}

              {role !== "admin" && role !== "vendor" && (
                <Link
                  href="/account"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200 text-xs font-semibold hover:bg-brand-100 transition-colors"
                >
                  <span>👤</span>
                  <span className="max-w-[120px] truncate">{userName}</span>
                </Link>
              )}

              <button
                type="button"
                onClick={logout}
                className="px-3.5 py-1.5 rounded-xl border border-line text-xs font-medium text-ink hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap flex-shrink-0 text-ink hover:text-brand-600 hover:bg-brand-50/50 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-wine hover:from-brand-700 hover:to-brand-800 text-white text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-all shadow-xs hover:shadow-md"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile Header Controls */}
        <div className="flex md:hidden items-center gap-2">
          {user ? (
            <Link
              href={
                role === "admin"
                  ? "/admin/dashboard"
                  : role === "vendor"
                  ? "/vendor/dashboard"
                  : "/account"
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200 text-xs font-semibold"
            >
              <span>{role === "admin" ? "👑" : role === "vendor" ? "🏪" : "👤"}</span>
              <span className="max-w-[90px] truncate">{userName.split(" ")[0]}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-brand-700 bg-brand-50 border border-brand-200"
            >
              Login
            </Link>
          )}

          <button
            type="button"
            aria-label="Toggle Navigation Menu"
            onClick={() => setOpen((prev) => !prev)}
            className="w-10 h-10 rounded-xl border border-line flex items-center justify-center text-ink hover:text-brand-600 hover:border-brand-600 transition-colors"
          >
            {open ? (
              <span className="text-xl leading-none">✕</span>
            ) : (
              <span className="text-xl leading-none">☰</span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {open && (
        <div className="md:hidden border-t border-line bg-white/98 backdrop-blur-md px-5 py-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
          {user && (
            <div className="p-3.5 rounded-xl bg-brand-50/70 border border-brand-100 mb-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-brand-700 text-sm">{userName}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-100 text-brand-800">
                  {role}
                </span>
              </div>
              <div className="text-xs text-muted font-mono mt-0.5">{user.email}</div>
              {user.phone && (
                <div className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1">
                  <span>💬 +91 {user.phone}</span>
                  <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded-full font-bold">Verified ✓</span>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="px-3 py-2 rounded-xl text-sm font-medium text-ink hover:bg-brand-50 hover:text-brand-600 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-line space-y-2">
            {user ? (
              <>
                {role === "admin" && (
                  <Link
                    href="/admin/dashboard"
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2 rounded-xl text-sm font-semibold text-amber-900 bg-amber-50 border border-amber-200"
                  >
                    👑 Admin Dashboard
                  </Link>
                )}
                {role === "vendor" && (
                  <Link
                    href="/vendor/dashboard"
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2 rounded-xl text-sm font-semibold text-brand-700 bg-brand-50 border border-brand-200"
                  >
                    🏪 Vendor Portal
                  </Link>
                )}
                <Link
                  href="/account"
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-medium text-ink hover:bg-gray-50"
                >
                  My Account
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex gap-2.5 pt-1">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-line text-center text-sm font-medium text-ink hover:bg-gray-50 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-brand-600 text-center text-sm font-semibold text-white shadow-xs hover:bg-brand-700 transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
