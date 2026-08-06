import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import OfficersPage from "@/app/admin/(dashboard)/officers/page";
import {
  getAuthorizedOfficerProfile,
  getOfficersData
} from "@/lib/admin-dashboard";

vi.mock("@/lib/admin-dashboard", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/admin-dashboard")>()),
  getAuthorizedOfficerProfile: vi.fn(),
  getOfficersData: vi.fn()
}));

vi.mock("@/app/admin/actions", () => ({
  addOfficer: "/admin/officers",
  deleteOfficer: "/admin/officers",
  updateOfficer: "/admin/officers"
}));

describe("OfficersPage", () => {
  beforeEach(() => {
    vi.mocked(getOfficersData).mockResolvedValue([
      {
        id: "officer-1",
        name: "Harini Muthu",
        role: "President",
        email: "harini@example.edu",
        focus: "Leadership"
      },
      {
        id: "officer-2",
        name: "Avery Park",
        role: "Treasurer",
        email: "avery@example.edu",
        focus: "Budget"
      }
    ]);
  });

  it("limits a non-president to editing their own profile without title controls", async () => {
    vi.mocked(getAuthorizedOfficerProfile).mockResolvedValue({
      id: "officer-2",
      name: "Avery Park",
      role: "Treasurer",
      email: "avery@example.edu"
    });

    render(await OfficersPage());

    expect(screen.queryByRole("button", { name: "Add officer" })).not.toBeInTheDocument();
    expect(screen.getAllByText("Edit")).toHaveLength(1);
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
    expect(screen.getByText("Title: Treasurer")).toBeInTheDocument();
  });

  it("shows full officer management controls to a president regardless of title case", async () => {
    vi.mocked(getAuthorizedOfficerProfile).mockResolvedValue({
      id: "officer-1",
      name: "Harini Muthu",
      role: "president",
      email: "harini@example.edu"
    });

    render(await OfficersPage());

    expect(screen.getByRole("button", { name: "Add officer" })).toBeVisible();
    expect(screen.getAllByText("Edit")).toHaveLength(2);
    expect(screen.getAllByText("Delete")).toHaveLength(2);
  });
});
