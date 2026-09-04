import type { GalleryPhoto } from "@/lib/site-data";

type FieldErrors = Record<string, string>;

export const maxGalleryImageSize = 1 * 1024 * 1024;
const acceptedGalleryImageTypes = ["image/jpeg", "image/png"];

export type GallerySubmission = {
  school_email: string;
  title: string;
  class_year: string;
  medium: string;
  dimensions: string;
  statement: string;
  image_file: File;
};

type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; fieldErrors: FieldErrors };

export type ApprovedGallerySubmission = {
  id: string;
  title: string;
  artist_name: string;
  class_year: string;
  medium: string;
  dimensions: string;
  statement: string;
  public_image_url: string;
};

function readField(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function readImage(formData: FormData) {
  const value = formData.get("image");
  return typeof File !== "undefined" && value instanceof File && value.name && value.size > 0
    ? value
    : null;
}

export function normalizeSchoolEmail(email: string) {
  return email.trim().toLowerCase();
}

export function validateGallerySubmission(formData: FormData): ValidationResult<GallerySubmission> {
  const schoolEmail = normalizeSchoolEmail(readField(formData, "schoolEmail"));
  const title = readField(formData, "title");
  const classYear = readField(formData, "classYear");
  const medium = readField(formData, "medium");
  const dimensions = readField(formData, "dimensions");
  const statement = readField(formData, "statement");
  const image = readImage(formData);
  const consent = formData.get("consent") === "on";
  const fieldErrors: FieldErrors = {};

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(schoolEmail)) fieldErrors.schoolEmail = "Enter a valid school email address.";
  if (!title) fieldErrors.title = "Enter the artwork title.";
  if (!classYear) fieldErrors.classYear = "Enter your class year.";
  if (!medium) fieldErrors.medium = "Enter the artwork medium.";
  if (!consent) fieldErrors.consent = "Confirm that you own this work and allow the club to publish it.";
  if (!image || !acceptedGalleryImageTypes.includes(image.type)) {
    fieldErrors.image = "Upload a JPG or PNG image.";
  } else if (image.size > maxGalleryImageSize) {
    fieldErrors.image = "Image must be 1 MB or smaller.";
  }

  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors };

  return {
    ok: true,
    data: { school_email: schoolEmail, title, class_year: classYear, medium, dimensions, statement, image_file: image! }
  };
}

export function approvedSubmissionToGalleryPhoto(submission: ApprovedGallerySubmission): GalleryPhoto {
  return {
    id: submission.id,
    title: submission.title,
    caption: submission.statement,
    artist: submission.artist_name,
    year: `Class of ${submission.class_year}`,
    medium: submission.medium,
    dimensions: submission.dimensions,
    aspectRatio: "4 / 5",
    statement: submission.statement,
    color: "violet",
    imageUrl: submission.public_image_url
  };
}
