import { recordQrAttendance } from "@/app/attendance/actions";
import {
  attendanceStatusMessage,
  getTodayAttendanceActivity
} from "@/lib/attendance";
import { clubName } from "@/lib/site-data";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: `Attendance | ${clubName}`
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

function activityOptionLabel(activity: {
  activity: string;
  startsAt: string | null;
  location: string | null;
}) {
  return [
    activity.activity,
    activity.startsAt ? formatTime(activity.startsAt) : null,
    activity.location
  ].filter(Boolean).join(" / ");
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
        <p className="eyebrow">{clubName}</p>
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
            {state.activities.length === 1 ? <div className="attendance-activity">
              <p>Today&apos;s activity</p>
              <h2>{state.activities[0].activity}</h2>
              <span>
                {formatDate(state.activities[0].meetingDate)}
                {state.activities[0].startsAt
                  ? ` / ${formatTime(state.activities[0].startsAt)}`
                  : ""}
                {state.activities[0].location ? ` / ${state.activities[0].location}` : ""}
              </span>
            </div> : <div className="attendance-activity">
              <p>Choose the activity you are attending</p>
              <h2>Today&apos;s activities</h2>
            </div>}
            <form action={recordQrAttendance} className="attendance-form">
              {state.activities.length === 1 ? (
                <input name="meetingId" type="hidden" value={state.activities[0].id} />
              ) : (
                <label>
                  Activity
                  <select defaultValue="" name="meetingId" required>
                    <option disabled value="">Choose an activity</option>
                    {state.activities.map((activity) => (
                      <option key={activity.id} value={activity.id}>
                        {activityOptionLabel(activity)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
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
              <label>
                School Email
                <input
                  autoComplete="email"
                  maxLength={254}
                  name="schoolEmail"
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
