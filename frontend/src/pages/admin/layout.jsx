import Link from "@/compat/Link";
import { usePathname } from "@/compat/navigation";
import { Outlet } from "react-router-dom";

export default function AdminLayout() {
  const path = usePathname();

  const links = [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/categories", label: "Categories" },
    { href: "/admin/items", label: "Items" },
    { href: "/admin/bookings", label: "Bookings" },
    { href: "/admin/blogs", label: "Blogs" },
    { href: "/admin/users", label: "Users" },
  ];

  return (
    <div className="dash">
      <aside className="dash-side">
        <h3>Admin</h3>

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
