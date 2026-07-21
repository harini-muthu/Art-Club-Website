import { recordQrAttendance } from "@/app/attendance/actions";
import {
  attendanceStatusMessage,
  getTodayAttendanceActivity
} from "@/lib/attendance";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Attendance | Studio Collective"
};

type AttendancePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(`${date}T00:00:00Z`));
}

function formatTime(time?: string | null) {
  if (!time) {
    return null;
  }

  const [hours = "0", minutes = "0"] = time.split(":");
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(2026, 0, 1, Number(hours), Number(minutes)));
}

async function getAttendanceState() {
  const supabase = await createClient();
  return getTodayAttendanceActivity(supabase);
}

export default async function AttendancePage({
  searchParams
}: AttendancePageProps) {
  const params = await searchParams;
  const state = await getAttendanceState();
  const message = attendanceStatusMessage(params?.status);

  return (
    <section className="attendance-page">
      <div className="attendance-panel">
        <p className="eyebrow">Studio Collective</p>
        <h1>Attendance check-in</h1>
        {message ? (
          <p
            className={
              message.tone === "success"
                ? "attendance-notice success"
                : "attendance-notice error"
            }
          >
            {message.text}
          </p>
        ) : null}

        {state.status === "open" ? (
          <>
            <div className="attendance-activity">
              <p>Today&apos;s activity</p>
              <h2>{state.activity.activity}</h2>
              <span>
                {formatDate(state.activity.meetingDate)}
                {state.activity.startsAt
                  ? ` / ${formatTime(state.activity.startsAt)}`
                  : ""}
                {state.activity.location ? ` / ${state.activity.location}` : ""}
              </span>
            </div>
            <form action={recordQrAttendance} className="attendance-form">
              <label>
                Name
                <input
                  autoComplete="name"
                  maxLength={90}
                  name="attendeeName"
                  required
                  type="text"
                />
              </label>
              <label className="attendance-honeypot">
                Website
                <input
                  autoComplete="off"
                  name="website"
                  tabIndex={-1}
                  type="text"
                />
              </label>
              <button className="button primary" type="submit">
                Check in
              </button>
            </form>
          </>
        ) : (
          <p className="attendance-closed">
            Attendance check-in is not open. Check with an officer.
          </p>
        )}
      </div>
    </section>
  );
}
