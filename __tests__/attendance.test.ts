import { describe, expect, it } from "vitest";
import {
  getTodayAttendanceActivity,
  mapAttendanceActivityResponse,
  mapAttendanceSubmissionStatus,
  normalizeAttendeeName,
  recordTodayAttendance
} from "@/lib/attendance";

describe("QR attendance helpers", () => {
  it("normalizes attendee names for duplicate matching", () => {
    expect(normalizeAttendeeName("  Maya   Chen ")).toBe("maya chen");
    expect(normalizeAttendeeName("HARINI MUTHU")).toBe("harini muthu");
  });

  it("maps an open activity RPC response into page state", () => {
    expect(
      mapAttendanceActivityResponse({
        status: "open",
        meeting_id: "meeting-1",
        activity: "Open Studio",
        meeting_date: "2026-07-20",
        starts_at: "18:30",
        location: "Art Room"
      })
    ).toEqual({
      status: "open",
      activity: {
        id: "meeting-1",
        activity: "Open Studio",
        meetingDate: "2026-07-20",
        startsAt: "18:30",
        location: "Art Room"
      }
    });
  });

  it("maps closed and ambiguous RPC responses into non-submitting states", () => {
    expect(mapAttendanceActivityResponse({ status: "closed" })).toEqual({
      status: "closed",
      reason: "closed"
    });
    expect(mapAttendanceActivityResponse({ status: "ambiguous" })).toEqual({
      status: "closed",
      reason: "ambiguous"
    });
  });

  it("maps known submission statuses and treats errors as invalid", () => {
    expect(mapAttendanceSubmissionStatus("checked-in", null)).toBe("checked-in");
    expect(mapAttendanceSubmissionStatus("already-checked-in", null)).toBe(
      "already-checked-in"
    );
    expect(mapAttendanceSubmissionStatus("closed", null)).toBe("closed");
    expect(mapAttendanceSubmissionStatus("unexpected", null)).toBe("invalid");
    expect(mapAttendanceSubmissionStatus("checked-in", { message: "failed" })).toBe(
      "invalid"
    );
  });

  it("falls back safely when the local Supabase client does not expose RPC", async () => {
    await expect(getTodayAttendanceActivity({})).resolves.toEqual({
      status: "closed",
      reason: "closed"
    });
    await expect(
      recordTodayAttendance({}, { attendeeName: "Maya Chen", honeypot: "" })
    ).resolves.toBe("invalid");
  });
});
