import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getTodayAttendanceActivity,
  mapAttendanceActivityResponse,
  mapAttendanceSubmissionStatus,
  normalizeAttendeeName,
  recordTodayAttendance
} from "@/lib/attendance";

describe("QR attendance helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

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

  it("maps the one-row table response Supabase returns for the open activity RPC", () => {
    expect(
      mapAttendanceActivityResponse([
        {
          status: "open",
          meeting_id: "meeting-1",
          activity: "Open Studio",
          meeting_date: "2026-07-20",
          starts_at: "18:30",
          location: "Art Room"
        }
      ])
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

  it("calls the REST RPC endpoint when the local Supabase client does not expose RPC", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://studio.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key");
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify([
          {
            status: "open",
            meeting_id: "meeting-1",
            activity: "Open Studio",
            meeting_date: "2026-07-20",
            starts_at: "18:30",
            location: "Art Room"
          }
        ])
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getTodayAttendanceActivity({})).resolves.toEqual({
      status: "open",
      activity: {
        id: "meeting-1",
        activity: "Open Studio",
        meetingDate: "2026-07-20",
        startsAt: "18:30",
        location: "Art Room"
      }
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://studio.supabase.co/rest/v1/rpc/get_today_attendance_activity",
      expect.objectContaining({
        body: "{}",
        method: "POST"
      })
    );
  });

  it("records attendance through the REST RPC endpoint when RPC is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://studio.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key");
    const fetchMock = vi.fn(async () => new Response(JSON.stringify("checked-in")));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      recordTodayAttendance({}, { attendeeName: "Maya Chen", honeypot: "" })
    ).resolves.toBe("checked-in");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://studio.supabase.co/rest/v1/rpc/record_today_attendance",
      expect.objectContaining({
        body: JSON.stringify({
          attendee_name: "Maya Chen",
          honeypot: ""
        }),
        method: "POST"
      })
    );
  });

  it("falls back safely when the local Supabase client and config are missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    await expect(getTodayAttendanceActivity({})).resolves.toEqual({
      status: "closed",
      reason: "closed"
    });
    await expect(
      recordTodayAttendance({}, { attendeeName: "Maya Chen", honeypot: "" })
    ).resolves.toBe("invalid");
  });
});
