import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SiteHeader } from "@/components/site-header";

vi.mock("next/navigation", () => ({
  usePathname: () => "/gallery"
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
