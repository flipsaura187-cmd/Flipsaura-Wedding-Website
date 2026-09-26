import Link from "@/compat/Link";
import { usePathname } from "@/compat/navigation";
import { Outlet } from "react-router-dom";

export default function VendorLayout() {
  const path = usePathname();

  const links = [
    { href: "/vendor/dashboard", label: "Dashboard" },
    { href: "/vendor/items", label: "My Items" },
    { href: "/vendor/bookings", label: "Bookings" },
  ];

  return (
    <div className="dash">
      <aside className="dash-side">
        <h3>Vendor</h3>

        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={path === link.href ? "active" : ""}
          >
            {link.label}
          </Link>
        ))}
      </aside>

      <div className="dash-main">
        <Outlet />
      </div>
    </div>
  );
}
