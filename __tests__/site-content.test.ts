import { describe, expect, it } from "vitest";
import { events, galleryPhotos, navItems } from "@/lib/site-data";
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

  it("provides sample content for the public pages", () => {
    expect(events).toHaveLength(4);
    expect(events[0]).toMatchObject({ featured: true, status: "completed" });
    expect(events.every((event) => event.semester === "Spring 2026")).toBe(true);
    expect(events.every((event) => event.status === "completed")).toBe(true);
    expect(galleryPhotos).toHaveLength(8);
    expect(galleryPhotos[0]).toMatchObject({
      artist: expect.any(String),
      medium: expect.any(String),
      year: expect.any(String),
      statement: expect.any(String)
    });
  });

  it("defines the Phase B public contact purposes", () => {
    expect(contactPurposeOptions.map((option) => option.label)).toEqual([
      "General question",
      "Event/collaboration",
      "Other"
    ]);
  });
});
