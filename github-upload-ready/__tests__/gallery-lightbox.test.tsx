import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { GalleryGrid } from "@/components/gallery-grid";
import { galleryPhotos } from "@/lib/site-data";

describe("GalleryGrid", () => {
  it("keeps artwork metadata out of the main grid", () => {
    render(<GalleryGrid photos={galleryPhotos} />);

    expect(screen.getByRole("button", { name: "Open Sunlit Figure" })).toBeVisible();
    expect(screen.queryByText("Mina Alvarez")).not.toBeInTheDocument();
    expect(
      screen.queryByText("A warm portrait study exploring afternoon light and quiet confidence.")
    ).not.toBeInTheDocument();
  });

  it("renders artwork in submission order with full-art aspect ratios", () => {
    const { container } = render(<GalleryGrid photos={galleryPhotos} />);

    expect(container.querySelector(".gallery-grid")).toHaveClass("masonry-flow");
    const artworkButtons = screen.getAllByRole("button", {
      name: /Open /
    });
    expect(artworkButtons.map((button) => button.getAttribute("aria-label"))).toEqual(
      galleryPhotos.map((photo) => `Open ${photo.title}`)
    );
    expect(artworkButtons[0].querySelector(".artwork-preview")).toHaveStyle({
      aspectRatio: "4 / 5"
    });
  });

  it("opens a high-quality artwork view with artist information", async () => {
    const user = userEvent.setup();
    render(<GalleryGrid photos={galleryPhotos} />);

    await user.click(screen.getByRole("button", { name: "Open Sunlit Figure" }));

    expect(screen.getByRole("dialog")).toHaveAttribute(
      "aria-label",
      "Sunlit Figure artwork details"
    );
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "Sunlit Figure" })).toBeVisible();
    expect(within(dialog).getByText("Mina Alvarez")).toBeVisible();
    expect(within(dialog).getByText("Oil and acrylic on canvas")).toBeVisible();
    expect(within(dialog).getByText("Class of 2027")).toBeVisible();
  });

  it("closes the artwork view", async () => {
    const user = userEvent.setup();
    render(<GalleryGrid photos={galleryPhotos} />);

    await user.click(screen.getByRole("button", { name: "Open Sunlit Figure" }));
    await user.click(screen.getByRole("button", { name: "Close artwork details" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
