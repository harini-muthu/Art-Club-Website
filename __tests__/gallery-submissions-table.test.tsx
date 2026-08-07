import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import GallerySubmissionsPage from "@/app/admin/(dashboard)/gallery/page";
import { GallerySubmissionsTable } from "@/components/gallery-submissions-table";
import { getAuthorizedOfficerProfile, getGallerySubmissionsData } from "@/lib/admin-dashboard";

vi.mock("@/lib/admin-dashboard", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/admin-dashboard")>()),
  getAuthorizedOfficerProfile: vi.fn(),
  getGallerySubmissionsData: vi.fn()
}));

vi.mock("@/app/admin/actions", () => ({
  deleteGallerySubmission: "/admin/gallery",
  reviewGallerySubmission: "/admin/gallery"
}));

const pendingSubmission = {
  id: "submission-pending",
  artist_name: "Avery Artist",
  school_email: "avery@school.edu",
  title: "Pending Piece",
  class_year: "2026",
  medium: "Oil on canvas",
  dimensions: "",
  statement: "",
  private_image_path: "pending.jpg",
  review_status: "pending" as const,
  review_note: null,
  created_at: "2026-08-01T00:00:00.000Z",
  reviewImageUrl: "https://example.com/pending.jpg"
};

const approvedSubmission = {
  ...pendingSubmission,
  id: "submission-approved",
  title: "Approved Piece",
  review_status: "approved" as const,
  reviewImageUrl: "https://example.com/approved.jpg"
};

const formAction = "/admin/gallery" as unknown as (formData: FormData) => Promise<void>;
const actions = { deleteSubmission: formAction, reviewSubmission: formAction };

describe("GallerySubmissionsTable", () => {
  it("renders approved artwork only in the compact published section", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<GallerySubmissionsTable submissions={[pendingSubmission, approvedSubmission]} {...actions} />);

    const publishedSection = screen.getByRole("heading", { name: "Published artwork" }).parentElement!;
    const pendingArticle = screen.getByRole("heading", { name: "Pending Piece" }).closest("article")!;

    expect(publishedSection).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Approve" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Delete" })).toHaveLength(2);
    expect(within(publishedSection).getByText("Avery Artist")).toBeInTheDocument();
    expect(within(publishedSection).queryByText("Avery Artist · Class of 2026")).not.toBeInTheDocument();
    expect(within(publishedSection).queryByRole("button", { name: "Needs changes" })).not.toBeInTheDocument();
    expect(within(publishedSection).queryByRole("button", { name: "Reject" })).not.toBeInTheDocument();
    expect(within(publishedSection).queryByRole("textbox", { name: "Review note" })).not.toBeInTheDocument();
    expect(within(pendingArticle).getByText("Oil on canvas")).toBeInTheDocument();
    expect(pendingArticle.querySelectorAll("p")).toHaveLength(3);

    fireEvent.click(within(publishedSection).getByRole("button", { name: "Delete" }));
    expect(confirmSpy).toHaveBeenCalledWith("Are you sure you want to delete this artwork?");
    confirmSpy.mockRestore();
  });
});

describe("GallerySubmissionsPage", () => {
  beforeEach(() => {
    vi.mocked(getAuthorizedOfficerProfile).mockResolvedValue({
      id: "officer-1",
      name: "Avery Artist",
      role: "President",
      email: "avery@school.edu"
    });
    vi.mocked(getGallerySubmissionsData).mockResolvedValue([]);
  });

  it("shows an approval receipt after an artwork is published", async () => {
    render(await GallerySubmissionsPage({ searchParams: Promise.resolve({ status: "gallery-approved" }) }));

    expect(screen.getByRole("status")).toHaveTextContent("Artwork approved and published.");
  });

  it.each([
    ["gallery-rejected", "Artwork rejected."],
    ["gallery-changes-needed", "Changes requested."]
  ])("shows the matching receipt for %s", async (status, message) => {
    render(await GallerySubmissionsPage({ searchParams: Promise.resolve({ status }) }));

    expect(screen.getByRole("status")).toHaveTextContent(message);
    expect(screen.getByRole("status")).not.toHaveTextContent("Artwork approved and published.");
  });

  it("shows a deletion receipt after an artwork is deleted", async () => {
    render(await GallerySubmissionsPage({ searchParams: Promise.resolve({ status: "gallery-deleted" }) }));

    expect(screen.getByRole("status")).toHaveTextContent("Artwork deleted.");
  });
});
