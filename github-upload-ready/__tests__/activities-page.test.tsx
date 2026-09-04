import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ActivitiesPage from "@/app/admin/(dashboard)/activities/page";
import { getActivitiesData } from "@/lib/admin-dashboard";

vi.mock("@/lib/admin-dashboard", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/admin-dashboard")>()),
  getActivitiesData: vi.fn()
}));

vi.mock("@/components/admin-entry-forms", () => ({
  AdminEntryForms: () => <div />
}));

vi.mock("@/app/admin/actions", () => ({
  deleteMeetingActivity: "/admin/activities",
  updateMeetingActivity: "/admin/activities"
}));

describe("ActivitiesPage", () => {
  beforeEach(() => {
    vi.mocked(getActivitiesData).mockResolvedValue([
      {
        id: "meeting-1",
        activity: "Open Studio",
        meeting_date: "2026-07-20",
        image_url: "https://example.test/open-studio.jpg",
        image_alt: "Open Studio poster",
        attendance_count: 18,
        location: "Art Room"
      },
      {
        id: "meeting-2",
        activity: "Figure Drawing",
        meeting_date: "2026-07-21",
        attendance_count: 0,
        show_on_calendar: true
      }
    ]);
  });

  it("shows the saved attendee total and thumbnail for each activity", async () => {
    render(await ActivitiesPage());

    expect(screen.getByText("18 attendees")).toBeVisible();
    expect(screen.getByText("0 attendees")).toBeVisible();
    expect(screen.getByRole("img", { name: "Open Studio poster" })).toHaveAttribute(
      "src",
      "https://example.test/open-studio.jpg"
    );
    expect(screen.getByText("Art Room")).toBeVisible();
    expect(screen.queryByText("calendar")).not.toBeInTheDocument();
    expect(screen.queryByText("Saved attendance")).not.toBeInTheDocument();
  });
});
