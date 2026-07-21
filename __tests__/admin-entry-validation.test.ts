import { describe, expect, it } from "vitest";
import {
  getMembershipTerm,
  validateAttendanceSubmission,
  validateMeetingUpdateSubmission,
  validateMeetingSubmission,
  validateMemberSubmission
} from "@/lib/admin-entry-validation";

function formData(values: Record<string, string | File>) {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => data.set(key, value));
  return data;
}

describe("admin entry validation", () => {
  it("computes semester and yearly membership dates from the date added", () => {
    expect(getMembershipTerm("semester", new Date("2026-07-17T12:00:00Z"))).toEqual({
      starts_on: "2026-07-17",
      expires_on: "2026-12-31"
    });
    expect(getMembershipTerm("year", new Date("2026-07-17T12:00:00Z"))).toEqual({
      starts_on: "2026-07-17",
      expires_on: "2027-05-31"
    });
  });

  it("builds member and computed membership rows from a valid member form", () => {
    const result = validateMemberSubmission(
      formData({
        fullName: "  Harini Muthu  ",
        email: " harini@example.edu ",
        notes: "Paid at first meeting",
        membershipType: "semester",
        paidAmount: "15"
      }),
      new Date("2026-08-26T12:00:00Z")
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
          expires_on: "2026-12-31",
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
        paidAmount: "-5"
      })
    );

    expect(result).toEqual({
      ok: false,
      fieldErrors: {
        fullName: "Enter the member's full name.",
        email: "Enter a valid email address or leave it blank.",
        membershipType: "Choose semester or year.",
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
        imageAlt: "Watercolor meeting poster",
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
        image_file: null,
        image_url: null,
        current_image_url: null,
        image_alt: "Watercolor meeting poster",
        remove_image: false,
        show_on_calendar: true
      }
    });
  });

  it("accepts JPG and PNG event image uploads", () => {
    const jpg = new File(["image"], "poster.JPG", { type: "image/jpeg" });
    const png = new File(["image"], "poster.png", { type: "image/png" });

    const jpgResult = validateMeetingSubmission(
      formData({
        activity: "Figure Drawing",
        meetingDate: "2026-09-09",
        startsAt: "18:30",
        endsAt: "",
        location: "Studio 204",
        eventImage: jpg
      })
    );
    const pngResult = validateMeetingSubmission(
      formData({
        activity: "Print Night",
        meetingDate: "2026-09-16",
        startsAt: "",
        endsAt: "",
        location: "",
        eventImage: png
      })
    );

    expect(jpgResult.ok && jpgResult.data.image_file).toBe(jpg);
    expect(pngResult.ok && pngResult.data.image_file).toBe(png);
  });

  it("rejects unsupported or oversized event image uploads", () => {
    const gif = new File(["image"], "animation.gif", { type: "image/gif" });
    const oversized = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png", {
      type: "image/png"
    });

    expect(
      validateMeetingSubmission(
        formData({
          activity: "Figure Drawing",
          meetingDate: "2026-09-09",
          eventImage: gif
        })
      )
    ).toEqual({
      ok: false,
      fieldErrors: {
        eventImage: "Upload a JPG or PNG image."
      }
    });

    expect(
      validateMeetingSubmission(
        formData({
          activity: "Figure Drawing",
          meetingDate: "2026-09-09",
          eventImage: oversized
        })
      )
    ).toEqual({
      ok: false,
      fieldErrors: {
        eventImage: "Image must be 5 MB or smaller."
      }
    });
  });

  it("preserves or removes an existing event image during meeting updates", () => {
    expect(
      validateMeetingUpdateSubmission(
        formData({
          meetingId: "meeting-1",
          activity: "Watercolor Night",
          meetingDate: "2026-09-02",
          currentImageUrl: "https://example.edu/current.jpg"
        })
      )
    ).toMatchObject({
      ok: true,
      data: {
        meeting_id: "meeting-1",
        image_file: null,
        image_url: "https://example.edu/current.jpg",
        remove_image: false
      }
    });

    expect(
      validateMeetingUpdateSubmission(
        formData({
          meetingId: "meeting-1",
          activity: "Watercolor Night",
          meetingDate: "2026-09-02",
          currentImageUrl: "https://example.edu/current.jpg",
          removeImage: "on"
        })
      )
    ).toMatchObject({
      ok: true,
      data: {
        meeting_id: "meeting-1",
        image_file: null,
        image_url: null,
        remove_image: true
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
