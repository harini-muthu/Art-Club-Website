import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AttendancePage from "@/app/attendance/page";
import { createClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn()
}));

vi.mock("@/app/attendance/actions", () => ({
  recordQrAttendance: "/attendance"
}));

function setupRpc(data: unknown) {
  vi.mocked(createClient).mockResolvedValue({
    rpc: vi.fn(async () => ({ data, error: null }))
  } as never);
}

describe("AttendancePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the name-only check-in form when exactly one activity is open today", async () => {
    setupRpc({
      status: "open",
      meeting_id: "meeting-1",
      activity: "Open Studio",
      meeting_date: "2026-07-20",
      starts_at: "18:30",
      location: "Art Room"
    });

    render(await AttendancePage({ searchParams: Promise.resolve({}) }));

    expect(
      screen.getByRole("heading", { name: "Attendance check-in" })
    ).toBeVisible();
    expect(screen.getByText("Open Studio")).toBeVisible();
    expect(screen.getByLabelText("Name")).toBeVisible();
    expect(screen.getByRole("button", { name: "Check in" })).toBeVisible();
  });

  it("shows a closed state instead of a form when today is unavailable", async () => {
    setupRpc({ status: "closed" });

    render(await AttendancePage({ searchParams: Promise.resolve({}) }));

    expect(
      screen.getByText("Attendance check-in is not open. Check with an officer.")
    ).toBeVisible();
    expect(screen.queryByRole("button", { name: "Check in" })).not.toBeInTheDocument();
  });

  it("shows success and duplicate messages from submission status", async () => {
    setupRpc({
      status: "open",
      meeting_id: "meeting-1",
      activity: "Open Studio",
      meeting_date: "2026-07-20"
    });

    const successPage = await AttendancePage({
      searchParams: Promise.resolve({ status: "checked-in" })
    });
    const { rerender } = render(successPage);

    expect(screen.getByText("You're checked in.")).toBeVisible();

    const duplicatePage = await AttendancePage({
      searchParams: Promise.resolve({ status: "already-checked-in" })
    });
    rerender(duplicatePage);

    expect(screen.getByText("You're already checked in.")).toBeVisible();
  });
});
