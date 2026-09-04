import { describe, expect, it } from "vitest";
import {
  contactPurposeOptions,
  validateContactSubmission
} from "@/lib/contact-validation";

const validSubmission = {
  nameOrOrganization: "Campus Film Club",
  email: "student@example.edu",
  purpose: "event-collaboration",
  message: "We would like to collaborate on a zine night.",
  website: ""
};

describe("contact submission validation", () => {
  it("accepts the Phase B contact fields", () => {
    const result = validateContactSubmission(validSubmission);

    expect(result.ok).toBe(true);
    expect(contactPurposeOptions.map((option) => option.value)).toEqual([
      "general",
      "event-collaboration",
      "other"
    ]);
  });

  it("rejects missing required values and invalid email", () => {
    const result = validateContactSubmission({
      nameOrOrganization: "",
      email: "not-an-email",
      purpose: "",
      message: ""
    });

    expect(result).toEqual({
      ok: false,
      fieldErrors: {
        nameOrOrganization: "Enter your name or organization.",
        email: "Enter a valid email address.",
        purpose: "Choose a purpose.",
        message: "Enter a message."
      }
    });
  });

  it("rejects unknown purposes, long messages, and honeypot spam", () => {
    const result = validateContactSubmission({
      ...validSubmission,
      purpose: "commission",
      message: "a".repeat(1501),
      website: "https://spam.example"
    });

    expect(result).toEqual({
      ok: false,
      fieldErrors: {
        purpose: "Choose a valid purpose.",
        message: "Keep the message to 1500 characters or fewer.",
        website: "Unable to send this request."
      }
    });
  });
});
