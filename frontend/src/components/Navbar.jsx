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
  const userName = user?.name || "My Account";

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link href="/" className="brand">
          <Image src="/logo.png" alt="FlipsAura Logo" width={220} height={58} />
        </Link>

        <nav className="nav-links">
          <Link href="/" className={pathname === "/" ? "active" : ""}>
            Home
          </Link>
          <Link href="/categories/venues" className={pathname === "/categories/venues" ? "active" : ""}>
            Venues
          </Link>
          <Link
            href="/categories/home-setup-pandal-tent-dj"
            className={pathname === "/categories/home-setup-pandal-tent-dj" ? "active" : ""}
          >
            Home Setup
          </Link>
          <Link
            href="/categories/planning-decor"
            className={pathname === "/categories/planning-decor" ? "active" : ""}
          >
            Planning & Decor
          </Link>
          <Link href="/events" className={pathname.startsWith("/events") ? "active" : ""}>
            Events
          </Link>
          <Link href="/blogs" className={pathname.startsWith("/blogs") ? "active" : ""}>
            Blogs
          </Link>
        </nav>

        <div className="nav-cta">
          {user ? (
            <>
              {role === "admin" && (
                <Link href="/admin/dashboard" className="nav-user-tag hide-sm">
                  <span>👑 {userName}</span>
                  <span className="nav-role-pill admin">Admin</span>
                </Link>
              )}

              {role === "vendor" && (
                <Link href="/vendor/dashboard" className="nav-user-tag hide-sm">
                  <span>🏪 {userName}</span>
                  <span className="nav-role-pill vendor">Vendor</span>
                </Link>
              )}

              {role !== "admin" && role !== "vendor" && (
                <Link href="/account" className="nav-user-tag hide-sm">
                  <span>👤 {userName}</span>
                </Link>
              )}

              <button
                type="button"
                className="btn btn-outline hide-sm"
                onClick={logout}
                style={{ padding: "8px 18px", fontSize: "0.88rem" }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost hide-sm" style={{ padding: "8px 16px" }}>
                Login
              </Link>
              <Link href="/register" className="btn btn-primary hide-sm" style={{ padding: "8px 20px" }}>
                Sign up
              </Link>
            </>
          )}
          <button
            type="button"
            className="menu-btn"
            aria-label="Menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      <div className={`mobile-menu ${open ? "open" : ""}`}>
        {user && (
          <div style={{ padding: "10px 0 14px", borderBottom: "1px solid var(--line)", marginBottom: 10 }}>
            <div style={{ fontWeight: 600, color: "var(--pink-700)" }}>{userName}</div>
            <div style={{ fontSize: "0.8rem", color: "#666" }}>{user.email}</div>
          </div>
        )}

        <Link href="/" onClick={() => setOpen(false)}>Home</Link>
        <Link href="/categories/venues" onClick={() => setOpen(false)}>Venues</Link>
        <Link href="/categories/home-setup-pandal-tent-dj" onClick={() => setOpen(false)}>Home Setup</Link>
        <Link href="/categories/planning-decor" onClick={() => setOpen(false)}>Planning & Decor</Link>
        <Link href="/events" onClick={() => setOpen(false)}>Events</Link>
        <Link href="/blogs" onClick={() => setOpen(false)}>Blogs</Link>

        {user ? (
          <>
            {role === "admin" && (
              <Link href="/admin/dashboard" onClick={() => setOpen(false)}>
                👑 Admin Dashboard
              </Link>
            )}
            {role === "vendor" && (
              <Link href="/vendor/dashboard" onClick={() => setOpen(false)}>
                🏪 Vendor Dashboard
              </Link>
            )}
            <Link href="/account" onClick={() => setOpen(false)}>My Account</Link>
            <a
              onClick={() => {
                setOpen(false);
                logout();
              }}
              style={{ color: "#DC2626", cursor: "pointer" }}
            >
              Logout
            </a>
          </>
        ) : (
          <>
            <Link href="/login" onClick={() => setOpen(false)}>Login</Link>
            <Link href="/register" onClick={() => setOpen(false)}>Sign up</Link>
          </>
        )}
      </div>
    </header>
  );
}
