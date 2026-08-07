import { describe, expect, it } from "vitest";
import {
  approvedSubmissionToGalleryPhoto,
  maxGalleryImageSize,
  normalizeSchoolEmail,
  validateGallerySubmission
} from "@/lib/gallery-submissions";

function formData(values: Record<string, FormDataEntryValue>) {
  const form = new FormData();
  Object.entries(values).forEach(([key, value]) => form.set(key, value));
  return form;
}

describe("gallery submissions", () => {
  it("normalizes school email for membership matching", () => {
    expect(normalizeSchoolEmail("  MEMBER@School.edu ")).toBe("member@school.edu");
  });

  it("accepts a complete JPG artwork submission", () => {
    const image = new File(["image"], "My Piece.JPG", { type: "image/jpeg" });

    expect(validateGallerySubmission(formData({
      schoolEmail: "member@school.edu",
      title: "My Piece",
      classYear: "2027",
      medium: "Oil on canvas",
      dimensions: "24 x 30 in.",
      statement: "A study in light.",
      image,
      consent: "on"
    }))).toEqual({
      ok: true,
      data: {
        school_email: "member@school.edu",
        title: "My Piece",
        class_year: "2027",
        medium: "Oil on canvas",
        dimensions: "24 x 30 in.",
        statement: "A study in light.",
        image_file: image
      }
    });
  });

  it("rejects missing consent and unsupported or oversized images", () => {
    const oversized = new File([new Uint8Array(maxGalleryImageSize + 1)], "piece.gif", {
      type: "image/gif"
    });

    expect(validateGallerySubmission(formData({
      schoolEmail: "member@school.edu",
      title: "Piece",
      classYear: "2027",
      medium: "Ink",
      dimensions: "8 x 10 in.",
      statement: "Statement",
      image: oversized
    }))).toEqual({
      ok: false,
      fieldErrors: {
        consent: "Confirm that you own this work and allow the club to publish it.",
        image: "Upload a JPG or PNG image."
      }
    });
  });

  it("maps approved database records to public gallery photos", () => {
    expect(approvedSubmissionToGalleryPhoto({
      id: "submission-1",
      title: "My Piece",
      artist_name: "Member Name",
      class_year: "2027",
      medium: "Oil on canvas",
      dimensions: "24 x 30 in.",
      statement: "A study in light.",
      public_image_url: "https://example.supabase.co/public/piece.jpg"
    })).toMatchObject({
      id: "submission-1",
      title: "My Piece",
      artist: "Member Name",
      year: "Class of 2027",
      imageUrl: "https://example.supabase.co/public/piece.jpg"
    });
  });
});
