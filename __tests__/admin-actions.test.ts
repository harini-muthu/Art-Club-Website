import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addAttendanceRecord,
  addMeetingActivity,
  addMemberWithMembership,
  deleteMeetingActivity,
  deleteMember,
  updateMeetingActivity,
  updateMemberWithMembership
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
  const memberUpdateEq = vi.fn(async () => ({ error: null }));
  const memberUpdate = vi.fn(() => ({ eq: memberUpdateEq }));
  const memberDeleteEq = vi.fn(async () => ({ error: null }));
  const memberDelete = vi.fn(() => ({ eq: memberDeleteEq }));
  const membershipInsert = vi.fn(async () => ({ error: null }));
  const membershipUpdateEq = vi.fn(async () => ({ error: null }));
  const membershipUpdate = vi.fn(() => ({ eq: membershipUpdateEq }));
  const meetingInsert = vi.fn(async () => ({ error: null }));
  const meetingUpdateEq = vi.fn(async () => ({ error: null }));
  const meetingUpdate = vi.fn(() => ({ eq: meetingUpdateEq }));
  const meetingDeleteEq = vi.fn(async () => ({ error: null }));
  const meetingDelete = vi.fn(() => ({ eq: meetingDeleteEq }));
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
          delete: memberDelete,
          insert: memberInsert,
          update: memberUpdate,
          select: memberLookup
        };
      }

      if (table === "memberships") {
        return { insert: membershipInsert, update: membershipUpdate };
      }

      if (table === "meetings") {
        return {
          delete: meetingDelete,
          insert: meetingInsert,
          update: meetingUpdate
        };
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
    meetingDelete,
    meetingDeleteEq,
    meetingInsert,
    meetingUpdate,
    meetingUpdateEq,
    memberDelete,
    memberDeleteEq,
    memberInsert,
    memberUpdate,
    memberUpdateEq,
    membershipInsert,
    membershipUpdate,
    membershipUpdateEq
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

  it("updates a member and their latest membership term", async () => {
    const { memberUpdate, memberUpdateEq, membershipUpdate, membershipUpdateEq } =
      setupSupabaseMock();

    await expect(
      updateMemberWithMembership(
        formData({
          memberId: "member-1",
          membershipId: "membership-1",
          fullName: "Harini Muthu",
          email: "harini@example.edu",
          notes: "Updated note",
          membershipType: "semester",
          originalMembershipType: "semester",
          startsOn: "2026-07-17",
          expiresOn: "2026-12-31",
          paidAmount: "15"
        })
      )
    ).rejects.toThrow("REDIRECT:/admin?status=member-updated");

    expect(memberUpdate).toHaveBeenCalledWith({
      full_name: "Harini Muthu",
      email: "harini@example.edu",
      notes: "Updated note"
    });
    expect(memberUpdateEq).toHaveBeenCalledWith("id", "member-1");
    expect(membershipUpdate).toHaveBeenCalledWith({
      membership_type: "semester",
      starts_on: "2026-07-17",
      expires_on: "2026-12-31",
      paid_amount: 15
    });
    expect(membershipUpdateEq).toHaveBeenCalledWith("id", "membership-1");
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
  });

  it("deletes a member", async () => {
    const { memberDelete, memberDeleteEq } = setupSupabaseMock();

    await expect(
      deleteMember(formData({ memberId: "member-1" }))
    ).rejects.toThrow("REDIRECT:/admin?status=member-deleted");

    expect(memberDelete).toHaveBeenCalled();
    expect(memberDeleteEq).toHaveBeenCalledWith("id", "member-1");
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
  });

  it("updates a meeting activity", async () => {
    const { meetingUpdate, meetingUpdateEq } = setupSupabaseMock();

    await expect(
      updateMeetingActivity(
        formData({
          meetingId: "meeting-1",
          activity: "Updated Figure Drawing",
          meetingDate: "2026-09-09",
          startsAt: "18:30",
          endsAt: "20:00",
          location: "Studio 204",
          imageUrl: "https://example.edu/updated.jpg",
          imageAlt: "Updated event image",
          showOnCalendar: "on"
        })
      )
    ).rejects.toThrow("REDIRECT:/admin?status=activity-updated");

    expect(meetingUpdate).toHaveBeenCalledWith({
      activity: "Updated Figure Drawing",
      meeting_date: "2026-09-09",
      starts_at: "18:30",
      ends_at: "20:00",
      location: "Studio 204",
      image_url: "https://example.edu/updated.jpg",
      image_alt: "Updated event image",
      show_on_calendar: true
    });
    expect(meetingUpdateEq).toHaveBeenCalledWith("id", "meeting-1");
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
  });

  it("deletes a meeting activity", async () => {
    const { meetingDelete, meetingDeleteEq } = setupSupabaseMock();

    await expect(
      deleteMeetingActivity(formData({ meetingId: "meeting-1" }))
    ).rejects.toThrow("REDIRECT:/admin?status=activity-deleted");

    expect(meetingDelete).toHaveBeenCalled();
    expect(meetingDeleteEq).toHaveBeenCalledWith("id", "meeting-1");
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
  });
});
