"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const adminLinks = [
  { href: "/admin", label: "Overview & Attendance" },
  { href: "/admin/memberships", label: "Memberships" },
  { href: "/admin/activities", label: "Activities" },
  { href: "/admin/gallery", label: "Gallery submissions" },
  { href: "/admin/officers", label: "Officers" }
];

export function AdminNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin sections" className="admin-navigation">
      {adminLinks.map((link) => {
        const isActive = pathname === link.href;

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={isActive ? "admin-navigation-link active" : "admin-navigation-link"}
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
