"use client";
import Link from "@/compat/Link";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Image from "@/compat/Image";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link href="/" className="brand">
          <Image src="/logo.png" alt="FlipsAura Logo" width={500} height={300} />
        </Link>
        <nav className="nav-links">
          <Link href="/">Home</Link>
          <Link href="/categories/venues">Venues</Link>
          <Link href="/categories/wedding-setup">Wedding Setup</Link>
          <Link href="/categories/planning-decor">Planning & Decor</Link>
          <Link href="/blogs">Blogs</Link>
          <Link href="/account">My Account</Link>
        </nav>
        <div className="nav-cta">
          {user ? (
            <>
              {String(user.role || "").toLowerCase() === "admin" && <Link href="/admin/dashboard" className="btn btn-ghost hide-sm">Admin</Link>}
              {String(user.role || "").toLowerCase() === "vendor" && <Link href="/vendor/dashboard" className="btn btn-ghost hide-sm">Vendor</Link>}
              <button className="btn btn-outline hide-sm" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost hide-sm">Login</Link>
              <Link href="/register" className="btn btn-primary hide-sm">Sign up</Link>
            </>
          )}
          <button className="menu-btn" aria-label="Menu" onClick={() => setOpen(o => !o)}>☰</button>
        </div>
      </div>
      <div className={`mobile-menu ${open ? "open" : ""}`}>
        <Link href="/" onClick={() => setOpen(false)}>Home</Link>
        <Link href="/categories/venues" onClick={() => setOpen(false)}>Venues</Link>
        <Link href="/categories/wedding-setup" onClick={() => setOpen(false)}>Wedding Setup</Link>
        <Link href="/categories/planning-decor" onClick={() => setOpen(false)}>Planning & Decor</Link>
        {user ? (
          <>
            <Link href="/account" onClick={() => setOpen(false)}>Account</Link>
            {String(user.role || "").toLowerCase() === "admin" && <Link href="/admin/dashboard" onClick={() => setOpen(false)}>Admin</Link>}
            {String(user.role || "").toLowerCase() === "vendor" && <Link href="/vendor/dashboard" onClick={() => setOpen(false)}>Vendor</Link>}
            <a onClick={() => { setOpen(false); logout(); }}>Logout</a>
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
