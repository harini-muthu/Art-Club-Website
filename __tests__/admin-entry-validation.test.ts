import { describe, expect, it } from "vitest";
import {
  validateAttendanceSubmission,
  validateMeetingSubmission,
  validateMemberSubmission
} from "@/lib/admin-entry-validation";

function formData(values: Record<string, string>) {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => data.set(key, value));
  return data;
}

describe("admin entry validation", () => {
  it("builds member and membership rows from a valid member form", () => {
    const result = validateMemberSubmission(
      formData({
        fullName: "  Harini Muthu  ",
        email: " harini@example.edu ",
        notes: "Paid at first meeting",
        membershipType: "semester",
        startsOn: "2026-08-26",
        expiresOn: "2026-12-15",
        paidAmount: "15"
      })
    );

    expect(result).toEqual({
      ok: true,
      data: {
        member: {
          full_name: "Harini Muthu",
          email: "harini@example.edu",
          notes: "Paid at first meeting"
        },
        membership: {
          membership_type: "semester",
          starts_on: "2026-08-26",
          expires_on: "2026-12-15",
          paid_amount: 15
        }
      }
    });
  });

  it("rejects incomplete or invalid member forms", () => {
    const result = validateMemberSubmission(
      formData({
        fullName: "",
        email: "not-an-email",
        membershipType: "weekly",
        startsOn: "2026-12-15",
        expiresOn: "2026-08-26",
        paidAmount: "-5"
      })
    );

    expect(result).toEqual({
      ok: false,
      fieldErrors: {
        fullName: "Enter the member's full name.",
        email: "Enter a valid email address or leave it blank.",
        membershipType: "Choose semester or year.",
        expiresOn: "Expiration date must be on or after the start date.",
        paidAmount: "Paid amount must be zero or more."
      }
    });
  });

  it("builds meeting activity rows for the events calendar", () => {
    const result = validateMeetingSubmission(
      formData({
        activity: "Watercolor Night",
        meetingDate: "2026-09-02",
        startsAt: "18:30",
        endsAt: "20:00",
        location: "Art Studio 204",
        showOnCalendar: "on"
      })
    );

    expect(result).toEqual({
      ok: true,
      data: {
        activity: "Watercolor Night",
        meeting_date: "2026-09-02",
        starts_at: "18:30",
        ends_at: "20:00",
        location: "Art Studio 204",
        show_on_calendar: true
      }
    });
  });

  it("requires attendance to identify a meeting and a member or attendee name", () => {
    expect(
      validateAttendanceSubmission(
        formData({ meetingId: "meeting-1", memberId: "member-1", attendeeName: "" })
      )
    ).toEqual({
      ok: true,
      data: {
        meeting_id: "meeting-1",
        member_id: "member-1",
        attendee_name: null
      }
    });

    expect(validateAttendanceSubmission(formData({ meetingId: "" }))).toEqual({
      ok: false,
      fieldErrors: {
        meetingId: "Choose a meeting.",
        attendeeName: "Choose a member or enter an attendee name."
      }
    });
  });
});
