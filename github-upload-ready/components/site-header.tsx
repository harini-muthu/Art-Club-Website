"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clubName, navItems } from "@/lib/site-data";

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label={`${clubName} events home`}>
        <span className="brand-mark">SC</span>
        <span>{clubName}</span>
      </Link>
      <nav className="top-tabs" aria-label="Primary navigation">
        {navItems.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className="top-tab"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
