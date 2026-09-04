import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminNavigation } from "@/components/admin-navigation";
import { SiteHeader } from "@/components/site-header";

let pathname = "/gallery";

vi.mock("next/navigation", () => ({
  usePathname: () => pathname
}));

describe("SiteHeader", () => {
  it("renders the four public tabs and marks the active tab", () => {
    render(<SiteHeader />);

    expect(screen.getByRole("link", { name: "Events" })).toHaveAttribute(
      "href",
      "/"
    );
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute(
      "href",
      "/about"
    );
    expect(screen.getByRole("link", { name: "Gallery" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("link", { name: "Contact" })).toHaveAttribute(
      "href",
      "/contact"
    );
  });
});

describe("AdminNavigation", () => {
  it("keeps a clear Overview & Attendance path on every admin page", () => {
    pathname = "/admin/activities";
    render(<AdminNavigation />);

    expect(
      screen.getByRole("link", { name: "Overview & Attendance" })
    ).toHaveAttribute("href", "/admin");
    expect(screen.getByRole("link", { name: "Activities" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("link", { name: "Memberships" })).toHaveAttribute(
      "href",
      "/admin/memberships"
    );
    expect(screen.getByRole("link", { name: "Officers" })).toHaveAttribute(
      "href",
      "/admin/officers"
    );
  });
});
