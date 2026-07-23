import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addOfficer,
  addAttendanceRecord,
  addMeetingActivity,
  addMemberWithMembership,
  deleteOfficer,
  deleteMeetingActivity,
  deleteMember,
  updateOfficer,
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

function formData(values: Record<string, string | File>) {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => data.set(key, value));
  return data;
}

function setupSupabaseMock({ officerCount = 2 } = {}) {
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
  const meetingSelectSingle = vi.fn(async () => ({
    data: {
      image_url:
        "https://example.supabase.co/storage/v1/object/public/event-images/events/meeting-1/old-poster.jpg"
    },
    error: null
  }));
  const meetingSelectEq = vi.fn(() => ({ single: meetingSelectSingle }));
  const meetingSelect = vi.fn(() => ({ eq: meetingSelectEq }));
  const attendanceInsert = vi.fn(async () => ({ error: null }));
  const officerInsert = vi.fn(async () => ({ error: null }));
  const officerUpdateEq = vi.fn(async () => ({ error: null }));
  const officerUpdate = vi.fn(() => ({ eq: officerUpdateEq }));
  const officerDeleteEq = vi.fn(async () => ({ error: null }));
  const officerDelete = vi.fn(() => ({ eq: officerDeleteEq }));
  const officerCountSelect = vi.fn(async () => ({ count: officerCount, error: null }));
  const officerAuthSingle = vi.fn(async () => ({
    data: {
      id: "officer-1",
      name: "Officer One",
      role: "President",
      email: "officer@example.edu"
    },
    error: null
  }));
  const officerAuthEq = vi.fn(() => ({ single: officerAuthSingle }));
  const officerSelect = vi.fn((columns?: string, options?: { count?: string; head?: boolean }) => {
    if (options?.count === "exact" && options.head) {
      return officerCountSelect();
    }

    return { eq: officerAuthEq };
  });
  const memberLookup = vi.fn(() => ({
    eq: () => ({
      single: async () => ({ data: { full_name: "Harini Muthu" }, error: null })
    })
  }));
  const storageUpload = vi.fn(async () => ({ data: { path: "uploaded" }, error: null }));
  const storageGetPublicUrl = vi.fn((path: string) => ({
    data: {
      publicUrl: `https://example.supabase.co/storage/v1/object/public/event-images/${path}`
    }
  }));
  const storageRemove = vi.fn(async () => ({ data: [], error: null }));
  const storageFrom = vi.fn(() => ({
    getPublicUrl: storageGetPublicUrl,
    remove: storageRemove,
    upload: storageUpload
  }));

  const supabase = {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: { id: "auth-user-1", email: "Officer@Example.EDU" } },
        error: null
      })),
      signOut: vi.fn()
    },
    from: vi.fn((table: string) => {
      if (table === "officers") {
        return {
          delete: officerDelete,
          insert: officerInsert,
          select: officerSelect,
          update: officerUpdate
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
          select: meetingSelect,
          update: meetingUpdate
        };
      }

      if (table === "attendance_records") {
        return { insert: attendanceInsert };
      }

      throw new Error(`Unexpected table ${table}`);
    }),
    storage: {
      from: storageFrom
    }
  };

  vi.mocked(createClient).mockResolvedValue(supabase as never);

  return {
    attendanceInsert,
    meetingDelete,
    meetingDeleteEq,
    meetingInsert,
    meetingSelect,
    meetingSelectEq,
    meetingSelectSingle,
    meetingUpdate,
    meetingUpdateEq,
    memberDelete,
    memberDeleteEq,
    memberInsert,
    memberUpdate,
    memberUpdateEq,
    membershipInsert,
    membershipUpdate,
    membershipUpdateEq,
    officerCountSelect,
    officerDelete,
    officerDeleteEq,
    officerInsert,
    officerSelect,
    officerUpdate,
    officerUpdateEq,
    storageFrom,
    storageGetPublicUrl,
    storageRemove,
    storageUpload
  };
}

describe("admin data entry actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-17T12:00:00Z"));
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-key";
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

  it("adds a calendar meeting activity with an uploaded event image", async () => {
    const { meetingInsert, storageFrom, storageGetPublicUrl, storageUpload } =
      setupSupabaseMock();
    const image = new File(["image"], "Figure Night.JPG", {
      type: "image/jpeg"
    });

    await expect(
      addMeetingActivity(
        formData({
          activity: "Figure Drawing",
          meetingDate: "2026-09-09",
          startsAt: "18:30",
          endsAt: "",
          location: "Studio 204",
          eventImage: image,
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
      image_url: expect.stringMatching(
        /^https:\/\/example\.supabase\.co\/storage\/v1\/object\/public\/event-images\/events\/event\/.+-figure-night\.jpg$/
      ),
      image_alt: "Figure drawing setup",
      show_on_calendar: true
    });
    expect(storageFrom).toHaveBeenCalledWith("event-images");
    expect(storageUpload).toHaveBeenCalledWith(
      expect.stringMatching(/^events\/event\/.+-figure-night\.jpg$/),
      image,
      {
        contentType: "image/jpeg",
        upsert: true
      }
    );
    expect(storageGetPublicUrl).toHaveBeenCalledWith(
      expect.stringMatching(/^events\/event\/.+-figure-night\.jpg$/)
    );
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

  it("adds an officer with a private normalized email", async () => {
    const { officerInsert } = setupSupabaseMock();

    await expect(
      addOfficer(
        formData({
          officerName: "Avery Park",
          officerRole: "VP of Events",
          officerEmail: " Avery@Example.EDU ",
          officerFocus: "Workshops"
        })
      )
    ).rejects.toThrow("REDIRECT:/admin?status=officer-added");

    expect(officerInsert).toHaveBeenCalledWith({
      name: "Avery Park",
      role: "VP of Events",
      email: "avery@example.edu",
      focus: "Workshops"
    });
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
    expect(revalidatePath).toHaveBeenCalledWith("/about");
  });

  it("updates an officer", async () => {
    const { officerUpdate, officerUpdateEq } = setupSupabaseMock();

    await expect(
      updateOfficer(
        formData({
          officerId: "officer-2",
          officerName: "Avery Park",
          officerRole: "Vice President",
          officerEmail: "avery@example.edu",
          officerFocus: ""
        })
      )
    ).rejects.toThrow("REDIRECT:/admin?status=officer-updated");

    expect(officerUpdate).toHaveBeenCalledWith({
      name: "Avery Park",
      role: "Vice President",
      email: "avery@example.edu",
      focus: null
    });
    expect(officerUpdateEq).toHaveBeenCalledWith("id", "officer-2");
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
    expect(revalidatePath).toHaveBeenCalledWith("/about");
  });

  it("deletes an officer after confirming another officer remains", async () => {
    const { officerCountSelect, officerDelete, officerDeleteEq } =
      setupSupabaseMock();

    await expect(
      deleteOfficer(formData({ officerId: "officer-2" }))
    ).rejects.toThrow("REDIRECT:/admin?status=officer-deleted");

    expect(officerCountSelect).toHaveBeenCalled();
    expect(officerDelete).toHaveBeenCalled();
    expect(officerDeleteEq).toHaveBeenCalledWith("id", "officer-2");
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
    expect(revalidatePath).toHaveBeenCalledWith("/about");
  });

  it("does not delete the final officer", async () => {
    const { officerDelete } = setupSupabaseMock({ officerCount: 1 });

    await expect(
      deleteOfficer(formData({ officerId: "officer-1" }))
    ).rejects.toThrow("REDIRECT:/admin?error=officer-final-delete");

    expect(officerDelete).not.toHaveBeenCalled();
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

  it("updates a meeting activity and replaces an uploaded image", async () => {
    const { meetingUpdate, meetingUpdateEq, storageRemove, storageUpload } =
      setupSupabaseMock();
    const image = new File(["image"], "Updated.png", { type: "image/png" });

    await expect(
      updateMeetingActivity(
        formData({
          meetingId: "meeting-1",
          activity: "Updated Figure Drawing",
          meetingDate: "2026-09-09",
          startsAt: "18:30",
          endsAt: "20:00",
          location: "Studio 204",
          currentImageUrl:
            "https://example.supabase.co/storage/v1/object/public/event-images/events/meeting-1/old-poster.jpg",
          eventImage: image,
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
      image_url: expect.stringMatching(
        /^https:\/\/example\.supabase\.co\/storage\/v1\/object\/public\/event-images\/events\/meeting-1\/.+-updated\.png$/
      ),
      image_alt: "Updated event image",
      show_on_calendar: true
    });
    expect(storageUpload).toHaveBeenCalledWith(
      expect.stringMatching(/^events\/meeting-1\/.+-updated\.png$/),
      image,
      {
        contentType: "image/png",
        upsert: true
      }
    );
    expect(storageRemove).toHaveBeenCalledWith([
      "events/meeting-1/old-poster.jpg"
    ]);
    expect(meetingUpdateEq).toHaveBeenCalledWith("id", "meeting-1");
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
  });

  it("updates a meeting activity and removes its uploaded image", async () => {
    const { meetingUpdate, storageRemove, storageUpload } = setupSupabaseMock();

    await expect(
      updateMeetingActivity(
        formData({
          meetingId: "meeting-1",
          activity: "Updated Figure Drawing",
          meetingDate: "2026-09-09",
          startsAt: "18:30",
          endsAt: "20:00",
          location: "Studio 204",
          currentImageUrl:
            "https://example.supabase.co/storage/v1/object/public/event-images/events/meeting-1/old-poster.jpg",
          removeImage: "on",
          imageAlt: "",
          showOnCalendar: "on"
        })
      )
    ).rejects.toThrow("REDIRECT:/admin?status=activity-updated");

    expect(storageUpload).not.toHaveBeenCalled();
    expect(storageRemove).toHaveBeenCalledWith([
      "events/meeting-1/old-poster.jpg"
    ]);
    expect(meetingUpdate).toHaveBeenCalledWith({
      activity: "Updated Figure Drawing",
      meeting_date: "2026-09-09",
      starts_at: "18:30",
      ends_at: "20:00",
      location: "Studio 204",
      image_url: null,
      image_alt: null,
      show_on_calendar: true
    });
  });

  it("deletes a meeting activity", async () => {
    const { meetingDelete, meetingDeleteEq, meetingSelectEq, storageRemove } =
      setupSupabaseMock();

    await expect(
      deleteMeetingActivity(formData({ meetingId: "meeting-1" }))
    ).rejects.toThrow("REDIRECT:/admin?status=activity-deleted");

    expect(meetingSelectEq).toHaveBeenCalledWith("id", "meeting-1");
    expect(storageRemove).toHaveBeenCalledWith([
      "events/meeting-1/old-poster.jpg"
    ]);
    expect(meetingDelete).toHaveBeenCalled();
    expect(meetingDeleteEq).toHaveBeenCalledWith("id", "meeting-1");
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
  });
});
