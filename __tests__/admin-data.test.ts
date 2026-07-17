import { describe, expect, it } from "vitest";
import {
  buildAdminDashboardStats,
  filterMembersBySearch,
  getMembershipStatus,
  getMemberAttendanceCount
} from "@/lib/admin-data";

const referenceDate = new Date("2026-09-15T12:00:00Z");

describe("admin data helpers", () => {
  it("marks memberships active through their expiration date", () => {
    expect(getMembershipStatus("2026-09-15", referenceDate)).toBe("active");
    expect(getMembershipStatus("2026-09-14", referenceDate)).toBe("expired");
  });

  it("counts attendance records linked to a member", () => {
    expect(
      getMemberAttendanceCount("member-1", [
        { member_id: "member-1" },
        { member_id: "member-2" },
        { member_id: "member-1" },
        { member_id: null }
      ])
    ).toBe(2);
  });

  it("builds dashboard totals from members, memberships, meetings, and attendance", () => {
    const stats = buildAdminDashboardStats(
      {
        members: [{ id: "member-1" }, { id: "member-2" }],
        memberships: [
          { member_id: "member-1", expires_on: "2026-12-15" },
          { member_id: "member-2", expires_on: "2026-05-15" }
        ],
        meetings: [
          { id: "meeting-1", show_on_calendar: true },
          { id: "meeting-2", show_on_calendar: false }
        ],
        attendanceRecords: [
          { member_id: "member-1" },
          { member_id: "member-1" },
          { member_id: null }
        ]
      },
      referenceDate
    );

    expect(stats).toEqual({
      totalMembers: 2,
      activeMembers: 1,
      calendarActivities: 1,
      attendanceRecords: 3
    });
  });

  it("filters members by name or email for officer search", () => {
    expect(
      filterMembersBySearch(
        [
          { id: "member-1", full_name: "Harini Muthu", email: "harini@example.edu" },
          { id: "member-2", full_name: "Maya Chen", email: "maya@example.edu" }
        ],
        "hari"
      )
    ).toEqual([
      { id: "member-1", full_name: "Harini Muthu", email: "harini@example.edu" }
    ]);

    expect(
      filterMembersBySearch(
        [
          { id: "member-1", full_name: "Harini Muthu", email: "harini@example.edu" },
          { id: "member-2", full_name: "Maya Chen", email: "maya@example.edu" }
        ],
        "example.edu"
      )
    ).toHaveLength(2);
  });
});
