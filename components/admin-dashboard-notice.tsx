"use client";

import { useSearchParams } from "next/navigation";
import { errorMessages, statusMessages } from "@/lib/admin-dashboard-messages";

export function AdminDashboardNotice() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const error = searchParams.get("error");
  const message = status ? statusMessages[status] : error ? errorMessages[error] : null;

  if (!message) {
    return null;
  }

  return (
    <p className={status ? "admin-notice success" : "admin-notice error"}>
      {message}
    </p>
  );
}
