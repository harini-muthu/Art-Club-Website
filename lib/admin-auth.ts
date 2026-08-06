export type AdminLoginRedirectReason = "missing-session" | "missing-profile";

export function isPresidentRole(role: string | null | undefined) {
  return role?.trim().toLowerCase() === "president";
}

const adminLoginRedirectMessages: Record<AdminLoginRedirectReason, string> = {
  "missing-profile":
    "Your sign-in worked, but this account is not configured as an officer.",
  "missing-session":
    "Your sign-in was accepted, but the admin session was not available yet. Try signing in again."
};

export function adminLoginRedirectUrl(reason: AdminLoginRedirectReason) {
  return `/admin/login?reason=${reason}`;
}

export function getAdminLoginRedirectMessage(reason: string | null) {
  if (reason === "missing-profile" || reason === "missing-session") {
    return adminLoginRedirectMessages[reason];
  }

  return "";
}
