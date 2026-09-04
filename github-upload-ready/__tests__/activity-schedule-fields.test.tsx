import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActivityScheduleFields } from "@/components/activity-schedule-fields";

describe("ActivityScheduleFields", () => {
  it("warns officers when the chosen schedule overlaps an existing activity", async () => {
    render(
      <ActivityScheduleFields
        meetings={[
          {
            id: "meeting-1",
            activity: "Open Studio",
            meeting_date: "2026-07-20",
            starts_at: "18:00",
            ends_at: "20:00"
          }
        ]}
      />
    );

    fireEvent.change(screen.getByLabelText("Date"), { target: { value: "2026-07-20" } });
    fireEvent.change(screen.getByLabelText("Starts"), { target: { value: "19:00" } });
    fireEvent.change(screen.getByLabelText("Ends"), { target: { value: "20:00" } });

    expect(
      screen.getByText(/overlaps Open Studio.*Officers can still save this activity/i)
    ).toBeVisible();
  });

  it("does not warn for adjacent activity windows", async () => {
    render(
      <ActivityScheduleFields
        meetings={[
          {
            id: "meeting-1",
            activity: "Open Studio",
            meeting_date: "2026-07-20",
            starts_at: "18:00",
            ends_at: "20:00"
          }
        ]}
      />
    );

    fireEvent.change(screen.getByLabelText("Date"), { target: { value: "2026-07-20" } });
    fireEvent.change(screen.getByLabelText("Starts"), { target: { value: "20:00" } });
    fireEvent.change(screen.getByLabelText("Ends"), { target: { value: "21:00" } });

    expect(screen.queryByText(/overlaps Open Studio/i)).not.toBeInTheDocument();
  });
});
