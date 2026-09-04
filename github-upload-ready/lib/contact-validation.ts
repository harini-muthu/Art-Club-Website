export type ContactPurpose = "general" | "event-collaboration" | "other";

export type ContactPurposeOption = {
  value: ContactPurpose;
  label: string;
};

export type ContactSubmission = {
  nameOrOrganization: string;
  email: string;
  purpose: ContactPurpose;
  message: string;
  website: string;
};

export type ContactValidationResult =
  | { ok: true; data: ContactSubmission }
  | { ok: false; fieldErrors: Record<string, string> };

const maxMessageLength = 1500;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const contactPurposeOptions: ContactPurposeOption[] = [
  { value: "general", label: "General question" },
  { value: "event-collaboration", label: "Event/collaboration" },
  { value: "other", label: "Other" }
];

const allowedPurposes = new Set<ContactPurpose>(
  contactPurposeOptions.map((option) => option.value)
);

function valueAsString(input: unknown): string {
  return typeof input === "string" ? input.trim() : "";
}

function purposeLabel(purpose: ContactPurpose): string {
  return (
    contactPurposeOptions.find((option) => option.value === purpose)?.label ??
    "Other"
  );
}

export function getContactPurposeLabel(purpose: ContactPurpose) {
  return purposeLabel(purpose);
}

export function validateContactSubmission(
  input: unknown
): ContactValidationResult {
  const raw = typeof input === "object" && input !== null ? input : {};
  const values = raw as Record<string, unknown>;
  const nameOrOrganization = valueAsString(values.nameOrOrganization);
  const email = valueAsString(values.email);
  const purpose = valueAsString(values.purpose);
  const message = valueAsString(values.message);
  const website = valueAsString(values.website);
  const fieldErrors: Record<string, string> = {};

  if (!nameOrOrganization) {
    fieldErrors.nameOrOrganization = "Enter your name or organization.";
  }

  if (!emailPattern.test(email)) {
    fieldErrors.email = "Enter a valid email address.";
  }

  if (!purpose) {
    fieldErrors.purpose = "Choose a purpose.";
  } else if (!allowedPurposes.has(purpose as ContactPurpose)) {
    fieldErrors.purpose = "Choose a valid purpose.";
  }

  if (!message) {
    fieldErrors.message = "Enter a message.";
  } else if (message.length > maxMessageLength) {
    fieldErrors.message = "Keep the message to 1500 characters or fewer.";
  }

  if (website) {
    fieldErrors.website = "Unable to send this request.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  return {
    ok: true,
    data: {
      nameOrOrganization,
      email,
      purpose: purpose as ContactPurpose,
      message,
      website
    }
  };
}
