import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addAttendanceRecord,
  addMeetingActivity,
  addMemberWithMembership
} from "@/app/admin/actions";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn()
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  })
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn()
}));

function formData(values: Record<string, string>) {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => data.set(key, value));
  return data;
}

function setupSupabaseMock() {
  const memberInsert = vi.fn(() => ({
    select: () => ({
      single: async () => ({ data: { id: "member-1" }, error: null })
    })
  }));
  const membershipInsert = vi.fn(async () => ({ error: null }));
  const meetingInsert = vi.fn(async () => ({ error: null }));
  const attendanceInsert = vi.fn(async () => ({ error: null }));
  const memberLookup = vi.fn(() => ({
    eq: () => ({
      single: async () => ({ data: { full_name: "Harini Muthu" }, error: null })
    })
  }));

  const supabase = {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: { id: "auth-user-1" } },
        error: null
      })),
      signOut: vi.fn()
    },
    from: vi.fn((table: string) => {
      if (table === "officer_profiles") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { full_name: "Officer One", role: "president" },
                error: null
              })
            })
          })
        };
      }

      if (table === "members") {
        return {
          insert: memberInsert,
          select: memberLookup
        };
      }

      if (table === "memberships") {
        return { insert: membershipInsert };
      }

      if (table === "meetings") {
        return { insert: meetingInsert };
      }

      if (table === "attendance_records") {
        return { insert: attendanceInsert };
      }

      throw new Error(`Unexpected table ${table}`);
    })
  };

  vi.mocked(createClient).mockResolvedValue(supabase as never);

  return {
    attendanceInsert,
    meetingInsert,
    memberInsert,
    membershipInsert
  };
}

describe("admin data entry actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-17T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("adds a member and matching membership term", async () => {
    const { memberInsert, membershipInsert } = setupSupabaseMock();

    await expect(
      addMemberWithMembership(
        formData({
          fullName: "Harini Muthu",
          email: "harini@example.edu",
          notes: "Paid in cash",
          membershipType: "year",
          paidAmount: "25"
        })
      )
    ).rejects.toThrow("REDIRECT:/admin?status=member-added");

    expect(memberInsert).toHaveBeenCalledWith({
      full_name: "Harini Muthu",
      email: "harini@example.edu",
      notes: "Paid in cash"
    });
    expect(membershipInsert).toHaveBeenCalledWith({
      member_id: "member-1",
      membership_type: "year",
      starts_on: "2026-07-17",
      expires_on: "2027-05-31",
      paid_amount: 25,
      added_by: "Officer One"
    });
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
  });

  it("adds a calendar meeting activity", async () => {
    const { meetingInsert } = setupSupabaseMock();

    await expect(
      addMeetingActivity(
        formData({
          activity: "Figure Drawing",
          meetingDate: "2026-09-09",
          startsAt: "18:30",
          endsAt: "",
          location: "Studio 204",
          imageUrl: "https://example.edu/figure-night.jpg",
          imageAlt: "Figure drawing setup",
          showOnCalendar: "on"
        })
      )
    ).rejects.toThrow("REDIRECT:/admin?status=activity-added");

    expect(meetingInsert).toHaveBeenCalledWith({
      activity: "Figure Drawing",
      meeting_date: "2026-09-09",
      starts_at: "18:30",
      ends_at: null,
      location: "Studio 204",
      image_url: "https://example.edu/figure-night.jpg",
      image_alt: "Figure drawing setup",
      show_on_calendar: true
    });
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
  });

  it("records attendance for a selected member", async () => {
    const { attendanceInsert } = setupSupabaseMock();

    await expect(
      addAttendanceRecord(
        formData({
          meetingId: "meeting-1",
          memberId: "member-1",
          attendeeName: ""
        })
      )
    ).rejects.toThrow("REDIRECT:/admin?status=attendance-added");

    expect(attendanceInsert).toHaveBeenCalledWith({
      meeting_id: "meeting-1",
      member_id: "member-1",
      attendee_name: "Harini Muthu"
    });
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
  });

  it("does not write when member form validation fails", async () => {
    const { memberInsert } = setupSupabaseMock();

    await expect(
      addMemberWithMembership(
        formData({
          fullName: "",
          membershipType: "semester"
        })
      )
    ).rejects.toThrow("REDIRECT:/admin?error=member-invalid");

    expect(memberInsert).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
