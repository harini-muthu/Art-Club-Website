import React from "react";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GuestsTable } from "@/components/guests-table";

const guests = [
  { id: "guest-1", fullName: "Avery Guest", schoolEmail: "avery@school.edu", attendanceCount: 3 },
  { id: "guest-2", fullName: "Morgan Guest", schoolEmail: "morgan@school.edu", attendanceCount: 1 }
];

const noOp = "/admin/memberships";

describe("GuestsTable", () => {
  it("shows compact guest columns and filters by name", async () => {
    const user = userEvent.setup();
    render(
      <GuestsTable
        archiveGuest={noOp}
        guests={guests}
        resetGuests={noOp}
        updateGuest={noOp}
      />
    );

    expect(screen.getByRole("columnheader", { name: "Guest" })).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "School Email" })).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Attendance" })).toBeVisible();
    expect(screen.queryByRole("columnheader", { name: "Notes" })).not.toBeInTheDocument();

    await user.type(screen.getByRole("searchbox", { name: "Search guests" }), "Avery");

    expect(screen.getByDisplayValue("Avery Guest")).toBeVisible();
    expect(screen.queryByDisplayValue("Morgan Guest")).not.toBeInTheDocument();
  });
});
