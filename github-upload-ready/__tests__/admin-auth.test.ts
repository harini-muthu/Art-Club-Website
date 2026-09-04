import { describe, expect, it } from "vitest";
import {
  adminLoginRedirectUrl,
  getAdminLoginRedirectMessage,
  isPresidentRole
} from "@/lib/admin-auth";

describe("admin auth redirects", () => {
  it("builds login redirect URLs with diagnostic reasons", () => {
    expect(adminLoginRedirectUrl("missing-session")).toBe(
      "/admin/login?reason=missing-session"
    );
    expect(adminLoginRedirectUrl("missing-profile")).toBe(
      "/admin/login?reason=missing-profile"
    );
  });

  it("maps redirect reasons to officer-friendly messages", () => {
    expect(getAdminLoginRedirectMessage("missing-session")).toBe(
      "Your sign-in was accepted, but the admin session was not available yet. Try signing in again."
    );
    expect(getAdminLoginRedirectMessage("missing-profile")).toBe(
      "Your sign-in worked, but this account is not configured as an officer."
    );
    expect(getAdminLoginRedirectMessage("unknown")).toBe("");
  });

  it("recognizes president titles without regard to case or surrounding whitespace", () => {
    expect(isPresidentRole("President")).toBe(true);
    expect(isPresidentRole(" president ")).toBe(true);
    expect(isPresidentRole("PRESIDENT")).toBe(true);
    expect(isPresidentRole("Vice President")).toBe(false);
    expect(isPresidentRole("Co-President")).toBe(false);
  });
});
