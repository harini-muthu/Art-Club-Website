import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MembershipsTable } from "@/components/memberships-table";

const members = [
  {
    id: "member-1",
    fullName: "Avery Park",
    email: "avery@example.edu",
    membershipId: "membership-1",
    membershipType: "semester",
    startsOn: "2026-08-26",
    expiresOn: "2026-12-31",
    paidAmount: 15,
    notes: "Paid in cash",
    membershipStatus: "active",
    attendanceCount: 4
  },
  {
    id: "member-2",
    fullName: "Maya Chen",
    email: "maya@example.edu",
    membershipId: "membership-2",
    membershipType: "year",
    startsOn: "2026-08-26",
    expiresOn: "2027-05-31",
    paidAmount: 25,
    notes: "",
    membershipStatus: "active",
    attendanceCount: 2
  }
];

const noOp = "/admin/memberships";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("MembershipsTable", () => {
  it("renders members in table rows rather than individual member cards", () => {
    render(<MembershipsTable deleteMember={noOp} members={members} updateMember={noOp} />);

    expect(screen.getByRole("table", { name: "Members" })).toBeVisible();
    expect(screen.getAllByRole("row")).toHaveLength(3);
    expect(screen.getByRole("columnheader", { name: "Membership" })).toBeVisible();
    expect(screen.queryByText("Add a membership term later")).not.toBeInTheDocument();
  });

  it("filters table rows in place without navigating away from the members view", async () => {
    const user = userEvent.setup();
    render(<MembershipsTable deleteMember={noOp} members={members} updateMember={noOp} />);

    await user.type(screen.getByRole("searchbox", { name: "Search members" }), "maya");

    expect(screen.getByDisplayValue("Maya Chen")).toBeVisible();
    expect(screen.queryByDisplayValue("Avery Park")).not.toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Members" })).toBeVisible();
  });

  it("enables only the selected member row and changes its pencil to save", async () => {
    const user = userEvent.setup();
    render(<MembershipsTable deleteMember={noOp} members={members} updateMember={noOp} />);

    expect(screen.getByLabelText("Full name for Avery Park")).toBeDisabled();
    expect(screen.getByLabelText("Full name for Maya Chen")).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Edit Avery Park" }));

    expect(screen.getByLabelText("Full name for Avery Park")).toBeEnabled();
    expect(screen.getByLabelText("Full name for Maya Chen")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save Avery Park" })).toBeVisible();
  });

  it("keeps the edit trigger outside the update form", () => {
    render(<MembershipsTable deleteMember={noOp} members={members} updateMember={noOp} />);

    expect(
      screen.getByRole("button", { name: "Edit Avery Park" }).closest("form")
    ).toBeNull();
  });

  it("keeps the control non-submitting after edit mode opens", async () => {
    const user = userEvent.setup();
    render(<MembershipsTable deleteMember={noOp} members={members} updateMember={noOp} />);

    await user.click(screen.getByRole("button", { name: "Edit Avery Park" }));

    const saveButton = screen.getByRole("button", { name: "Save Avery Park" });
    expect(saveButton).toHaveAttribute("type", "button");
    expect(saveButton).not.toHaveAttribute("form");
  });

  it("asks for confirmation before the icon-only delete control submits", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<MembershipsTable deleteMember={noOp} members={members} updateMember={noOp} />);

    const deleteButton = screen.getByRole("button", { name: "Delete Avery Park" });
    expect(deleteButton).toHaveAttribute("title", "Delete Avery Park");

    fireEvent.click(deleteButton);

    expect(confirm).toHaveBeenCalledWith(
      "Delete Avery Park? This cannot be undone."
    );
  });
});
