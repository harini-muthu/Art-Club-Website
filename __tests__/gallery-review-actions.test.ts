import { beforeEach, describe, expect, it, vi } from "vitest";
import { reviewGallerySubmission } from "@/app/admin/actions";
import {
  deleteGalleryPublicImage,
  publishGallerySubmissionImage
} from "@/lib/gallery-image-storage";
import { createClient } from "@/lib/supabase/server";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn()
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  })
}));

vi.mock("@/lib/gallery-image-storage", () => ({
  deleteGalleryPublicImage: vi.fn(),
  deleteGallerySubmissionImage: vi.fn(),
  publishGallerySubmissionImage: vi.fn()
}));

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: vi.fn(),
  createClient: vi.fn()
}));

function reviewForm(reviewStatus: "approved" | "rejected" | "changes_needed") {
  const data = new FormData();
  data.set("submissionId", "submission-1");
  data.set("reviewStatus", reviewStatus);
  data.set("reviewNote", "Reviewed");
  return data;
}

function setupGalleryReview({ reviewStatus = "pending" } = {}) {
  const galleryUpdateEq = vi.fn(async () => ({ error: null }));
  const galleryUpdate = vi.fn(() => ({ eq: galleryUpdateEq }));
  const gallerySingle = vi.fn(async () => ({
    data: {
      private_image_path: "pending/submission-1.jpg",
      public_image_path: reviewStatus === "approved" ? "approved/submission-1.jpg" : null,
      review_status: reviewStatus
    },
    error: null
  }));
  const gallerySelectEq = vi.fn(() => ({ single: gallerySingle }));
  const gallerySelect = vi.fn(() => ({ eq: gallerySelectEq }));
  const officerSingle = vi.fn(async () => ({
    data: {
      id: "officer-1",
      name: "Officer One",
      role: "President",
      email: "officer@example.edu"
    },
    error: null
  }));

  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: { id: "auth-user-1", email: "officer@example.edu" } },
        error: null
      }))
    },
    from: vi.fn((table: string) => {
      if (table === "officers") {
        return {
          select: () => ({ eq: () => ({ single: officerSingle }) })
        };
      }

      if (table === "gallery_submissions") {
        return { select: gallerySelect, update: galleryUpdate };
      }

      throw new Error(`Unexpected table ${table}`);
    })
  } as never);

  return { gallerySelect, galleryUpdate, galleryUpdateEq };
}

describe("reviewGallerySubmission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(publishGallerySubmissionImage).mockResolvedValue({
      ok: true,
      publicPath: "approved/submission-1.jpg",
      publicUrl: "https://example.com/submission-1.jpg"
    });
    vi.mocked(deleteGalleryPublicImage).mockResolvedValue({ ok: true });
  });

  it.each([
    ["approved", "gallery-approved"],
    ["rejected", "gallery-rejected"],
    ["changes_needed", "gallery-changes-needed"]
  ] as const)("redirects a %s review with its own outcome", async (reviewStatus, redirectStatus) => {
    const { galleryUpdate } = setupGalleryReview();

    await expect(reviewGallerySubmission(reviewForm(reviewStatus))).rejects.toThrow(
      `REDIRECT:/admin/gallery?status=${redirectStatus}`
    );

    expect(galleryUpdate).toHaveBeenCalledWith(expect.objectContaining({
      review_status: reviewStatus,
      review_note: "Reviewed",
      reviewer_id: "officer-1"
    }));
    if (reviewStatus === "approved") {
      expect(publishGallerySubmissionImage).toHaveBeenCalledWith(
        expect.anything(),
        "submission-1",
        "pending/submission-1.jpg"
      );
    } else {
      expect(publishGallerySubmissionImage).not.toHaveBeenCalled();
    }
  });

  it("rejects a stale review request for already-approved artwork", async () => {
    const { gallerySelect, galleryUpdate } = setupGalleryReview({ reviewStatus: "approved" });

    await expect(reviewGallerySubmission(reviewForm("rejected"))).rejects.toThrow(
      "REDIRECT:/admin/gallery?error=gallery-invalid"
    );

    expect(gallerySelect).toHaveBeenCalledWith("private_image_path, public_image_path, review_status");
    expect(galleryUpdate).not.toHaveBeenCalled();
    expect(publishGallerySubmissionImage).not.toHaveBeenCalled();
  });
});
