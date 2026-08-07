import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { assignPhotosToColumns, GalleryGrid } from "@/components/gallery-grid";
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

  it("renders the first two artworks in separate balanced columns", () => {
    const photos = galleryPhotos.slice(0, 2);
    const { container } = render(<GalleryGrid photos={photos} />);

    expect(container.querySelector(".gallery-columns")).toBeInTheDocument();
    const columns = screen.getAllByTestId("gallery-column");
    expect(columns).toHaveLength(2);
    expect(within(columns[0]).getByRole("button", { name: "Open Sunlit Figure" })).toBeVisible();
    expect(within(columns[1]).getByRole("button", { name: "Open Campus After Rain" })).toBeVisible();
    expect(container.querySelector(".gallery-card")).not.toBeInTheDocument();
  });

  it("assigns each artwork to the currently shorter estimated column", () => {
    const photos = galleryPhotos.slice(0, 4).map((photo, index) => ({
      ...photo,
      aspectRatio: index === 1 ? "2 / 1" : "1 / 1"
    }));

    expect(assignPhotosToColumns(photos).map((column) => column.map((photo) => photo.id))).toEqual([
      ["sunlit-figure", "blue-hour"],
      ["campus-after-rain", "thread-map"]
    ]);
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
    expect(within(dialog).getByText("Size")).toBeVisible();
    expect(within(dialog).getByText("24 x 30 in.")).toBeVisible();
    expect(within(dialog).getByText(/caught between stillness and motion/)).toBeVisible();
  });

  it("omits empty optional details from the artwork view", async () => {
    const user = userEvent.setup();
    render(<GalleryGrid photos={[{ ...galleryPhotos[0], dimensions: "", statement: "" }]} />);

    await user.click(screen.getByRole("button", { name: "Open Sunlit Figure" }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).queryByText("Size")).not.toBeInTheDocument();
    expect(dialog.querySelectorAll(".lightbox-details > p:not(.eyebrow)")).toHaveLength(0);
  });

  it("closes the artwork view", async () => {
    const user = userEvent.setup();
    render(<GalleryGrid photos={galleryPhotos} />);

    await user.click(screen.getByRole("button", { name: "Open Sunlit Figure" }));
    await user.click(screen.getByRole("button", { name: "Close artwork details" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
