import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { assignPhotosToColumns, GalleryGrid } from "@/components/gallery-grid";
import type { GalleryPhoto } from "@/lib/site-data";

const galleryPhotos: GalleryPhoto[] = [
  { id: "sunlit-figure", title: "Sunlit Figure", caption: "", artist: "Mina Alvarez", year: "Class of 2027", medium: "Oil and acrylic on canvas", dimensions: "24 x 30 in.", aspectRatio: "4 / 5", statement: "I wanted the figure to feel caught between stillness and motion.", color: "violet", imageUrl: null },
  { id: "campus-after-rain", title: "Campus After Rain", caption: "", artist: "Theo Martin", year: "Class of 2026", medium: "Ink and watercolor", dimensions: "18 x 24 in.", aspectRatio: "3 / 4", statement: "", color: "teal", imageUrl: null },
  { id: "thread-map", title: "Thread Map", caption: "", artist: "Nia Brooks", year: "Class of 2025", medium: "Fiber", dimensions: "32 x 28 in.", aspectRatio: "8 / 7", statement: "", color: "amber", imageUrl: null },
  { id: "blue-hour", title: "Blue Hour", caption: "", artist: "Rae Kim", year: "Class of 2028", medium: "Digital painting", dimensions: "3600 x 4800 px", aspectRatio: "3 / 4", statement: "", color: "rose", imageUrl: null }
];

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

  it("balances production uploads using their loaded natural aspect ratios", async () => {
    const photos = galleryPhotos.slice(0, 3).map((photo, index) => ({
      ...photo,
      aspectRatio: "4 / 5",
      imageUrl: `https://images.example.test/upload-${index}.jpg`
    }));

    render(<GalleryGrid photos={photos} />);

    const columns = screen.getAllByTestId("gallery-column");
    expect(within(columns[0]).getByRole("button", { name: "Open Thread Map" })).toBeVisible();

    const firstImage = screen.getByRole("img", { name: "Sunlit Figure by Mina Alvarez" });
    Object.defineProperties(firstImage, {
      naturalWidth: { configurable: true, value: 1000 },
      naturalHeight: { configurable: true, value: 2000 }
    });
    fireEvent.load(firstImage);

    await waitFor(() => {
      expect(within(columns[1]).getByRole("button", { name: "Open Thread Map" })).toBeVisible();
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
