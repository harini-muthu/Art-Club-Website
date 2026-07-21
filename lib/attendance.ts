import { getSupabaseBrowserConfig } from "@/lib/supabase/config";

export type AttendanceActivityRpcResponse = {
  status?: string | null;
  meeting_id?: string | null;
  activity?: string | null;
  meeting_date?: string | null;
  starts_at?: string | null;
  location?: string | null;
};

export type AttendancePageState =
  | {
      status: "open";
      activity: {
        id: string;
        activity: string;
        meetingDate: string;
        startsAt: string | null;
        location: string | null;
      };
    }
  | {
      status: "closed";
      reason: "closed" | "ambiguous";
    };

export type AttendanceSubmissionStatus =
  | "checked-in"
  | "already-checked-in"
  | "closed"
  | "invalid";

type AttendanceRpcClient = {
  rpc?: (
    fn: string,
    args?: Record<string, unknown>
  ) => Promise<{
    data: unknown;
    error: { message: string } | null;
  }>;
};

const knownSubmissionStatuses: AttendanceSubmissionStatus[] = [
  "checked-in",
  "already-checked-in",
  "closed",
  "invalid"
];

async function callAttendanceRpc(
  fn: string,
  args?: Record<string, unknown>
): Promise<{
  data: unknown;
  error: { message: string } | null;
}> {
  try {
    const { url, publishableKey } = getSupabaseBrowserConfig();
    const response = await fetch(
      `${url.replace(/\/$/, "")}/rest/v1/rpc/${fn}`,
      {
        body: JSON.stringify(args ?? {}),
        cache: "no-store",
        headers: {
          apikey: publishableKey,
          Authorization: `Bearer ${publishableKey}`,
          "Content-Type": "application/json"
        },
        method: "POST"
      }
    );
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: null,
        error: {
          message:
            typeof data?.message === "string"
              ? data.message
              : "Supabase RPC request failed."
        }
      };
    }

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : "Supabase RPC failed."
      }
    };
  }
}

export function normalizeAttendeeName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function mapAttendanceActivityResponse(
  response:
    | AttendanceActivityRpcResponse
    | AttendanceActivityRpcResponse[]
    | null
    | undefined
): AttendancePageState {
  const activityResponse = Array.isArray(response) ? response[0] : response;

  if (
    activityResponse?.status === "open" &&
    activityResponse.meeting_id &&
    activityResponse.activity &&
    activityResponse.meeting_date
  ) {
    return {
      status: "open",
      activity: {
        id: activityResponse.meeting_id,
        activity: activityResponse.activity,
        meetingDate: activityResponse.meeting_date,
        startsAt: activityResponse.starts_at ?? null,
        location: activityResponse.location ?? null
      }
    };
  }

  return {
    status: "closed",
    reason: activityResponse?.status === "ambiguous" ? "ambiguous" : "closed"
  };
}

export function mapAttendanceSubmissionStatus(
  status: unknown,
  error: { message: string } | null
): AttendanceSubmissionStatus {
  if (error || typeof status !== "string") {
    return "invalid";
  }

  if (knownSubmissionStatuses.includes(status as AttendanceSubmissionStatus)) {
    return status as AttendanceSubmissionStatus;
  }

  return "invalid";
}

export function attendanceStatusMessage(
  status: string | string[] | undefined
) {
  const normalizedStatus = Array.isArray(status) ? status[0] : status;

  if (normalizedStatus === "checked-in") {
    return { tone: "success", text: "You're checked in." };
  }

  if (normalizedStatus === "already-checked-in") {
    return { tone: "success", text: "You're already checked in." };
  }

  if (normalizedStatus === "closed") {
    return {
      tone: "error",
      text: "Attendance check-in is not open. Check with an officer."
    };
  }

  if (normalizedStatus === "invalid") {
    return {
      tone: "error",
      text: "Check your name and try again."
    };
  }

  return null;
}

export async function getTodayAttendanceActivity(client: AttendanceRpcClient) {
  const { data, error } =
    typeof client.rpc === "function"
      ? await client.rpc("get_today_attendance_activity")
      : await callAttendanceRpc("get_today_attendance_activity");

  if (error) {
    return mapAttendanceActivityResponse(null);
  }

  return mapAttendanceActivityResponse(
    data as AttendanceActivityRpcResponse | AttendanceActivityRpcResponse[]
  );
}

export async function recordTodayAttendance(
  client: AttendanceRpcClient,
  submission: { attendeeName: string; honeypot: string }
) {
  const args = {
    attendee_name: submission.attendeeName,
    honeypot: submission.honeypot
  };
  const { data, error } =
    typeof client.rpc === "function"
      ? await client.rpc("record_today_attendance", args)
      : await callAttendanceRpc("record_today_attendance", args);

  return mapAttendanceSubmissionStatus(data, error);
}
