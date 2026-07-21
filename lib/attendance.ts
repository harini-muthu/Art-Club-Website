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

export function normalizeAttendeeName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function mapAttendanceActivityResponse(
  response: AttendanceActivityRpcResponse | null | undefined
): AttendancePageState {
  if (
    response?.status === "open" &&
    response.meeting_id &&
    response.activity &&
    response.meeting_date
  ) {
    return {
      status: "open",
      activity: {
        id: response.meeting_id,
        activity: response.activity,
        meetingDate: response.meeting_date,
        startsAt: response.starts_at ?? null,
        location: response.location ?? null
      }
    };
  }

  return {
    status: "closed",
    reason: response?.status === "ambiguous" ? "ambiguous" : "closed"
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
  if (typeof client.rpc !== "function") {
    return mapAttendanceActivityResponse(null);
  }

  const { data, error } = await client.rpc("get_today_attendance_activity");

  if (error) {
    return mapAttendanceActivityResponse(null);
  }

  return mapAttendanceActivityResponse(data as AttendanceActivityRpcResponse);
}

export async function recordTodayAttendance(
  client: AttendanceRpcClient,
  submission: { attendeeName: string; honeypot: string }
) {
  if (typeof client.rpc !== "function") {
    return "invalid";
  }

  const { data, error } = await client.rpc("record_today_attendance", {
    attendee_name: submission.attendeeName,
    honeypot: submission.honeypot
  });

  return mapAttendanceSubmissionStatus(data, error);
}
