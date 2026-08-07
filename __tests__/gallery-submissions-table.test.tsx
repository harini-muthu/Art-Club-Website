import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GallerySubmissionsTable } from "@/components/gallery-submissions-table";

const pendingSubmission = {
  id: "submission-pending",
  artist_name: "Avery Artist",
  school_email: "avery@school.edu",
  title: "Pending Piece",
  class_year: "2026",
  medium: "Oil on canvas",
  dimensions: "24 x 36 in",
  statement: "A statement awaiting review.",
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

const actions = {
  deleteSubmission: async () => {},
  reviewSubmission: async () => {}
};

describe("GallerySubmissionsTable", () => {
  it("renders approved artwork only in the compact published section", () => {
    render(<GallerySubmissionsTable submissions={[pendingSubmission, approvedSubmission]} {...actions} />);

    expect(screen.getByRole("heading", { name: "Published artwork" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Approve" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Delete" })).toHaveLength(2);
  });
});
