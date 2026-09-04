import { describe, expect, it } from "vitest";
import { navItems } from "@/lib/site-data";
import { contactPurposeOptions } from "@/lib/contact-validation";

describe("public site content model", () => {
  it("defines the four top-level tabs with Events as the home route", () => {
    expect(navItems).toEqual([
      { label: "Events", href: "/" },
      { label: "About", href: "/about" },
      { label: "Gallery", href: "/gallery" },
      { label: "Contact", href: "/contact" }
    ]);
  });

  it("defines the Phase B public contact purposes", () => {
    expect(contactPurposeOptions.map((option) => option.label)).toEqual([
      "General question",
      "Event/collaboration",
      "Other"
    ]);
  });
});
