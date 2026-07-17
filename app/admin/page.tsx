import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminEntryForms } from "@/components/admin-entry-forms";
import {
  AdminAttendanceRecord,
  AdminMeeting,
  AdminMember,
  AdminMembership,
  buildAdminDashboardStats,
  filterMembersBySearch,
  getMemberAttendanceCount,
  getMembershipStatus
} from "@/lib/admin-data";
import { adminLoginRedirectUrl } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { signOutAdmin } from "@/app/admin/actions";

export const metadata = {
  title: "Admin | Studio Collective"
};

type OfficerProfile = {
  full_name: string;
  role: string;
};

function formatDate(date?: string | null) {
  if (!date) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(`${date}T00:00:00Z`));
}

function formatTime(time?: string | null) {
  if (!time) {
    return "";
  }

  const [hours = "0", minutes = "0"] = time.split(":");
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(2026, 0, 1, Number(hours), Number(minutes)));
}

function latestMembershipForMember(
  memberId: string,
  memberships: AdminMembership[]
) {
  return memberships
    .filter((membership) => membership.member_id === memberId)
    .sort((a, b) => b.expires_on.localeCompare(a.expires_on))[0];
}

const statusMessages: Record<string, string> = {
  "activity-added": "Activity added.",
  "attendance-added": "Attendance recorded.",
  "member-added": "Member and membership added."
};

const errorMessages: Record<string, string> = {
  "activity-invalid": "Check the activity fields and try again.",
  "activity-save-failed": "Activity could not be saved. Check Supabase policies.",
  "attendance-invalid": "Choose a meeting and identify the attendee.",
  "attendance-save-failed": "Attendance could not be saved. Check Supabase policies.",
  "member-invalid": "Check the member fields and try again.",
  "member-save-failed": "Member could not be saved. Check Supabase policies."
};

type AdminPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function getAdminDashboardData() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(adminLoginRedirectUrl("missing-session"));
  }

  const { data: officerProfile } = await supabase
    .from("officer_profiles")
    .select("full_name, role")
    .eq("auth_user_id", user.id)
    .single();

  if (!officerProfile) {
    redirect(adminLoginRedirectUrl("missing-profile"));
  }

  const [
    membersResult,
    membershipsResult,
    meetingsResult,
    attendanceResult
  ] = await Promise.all([
    supabase
      .from("members")
      .select("id, full_name, email, notes")
      .order("full_name", { ascending: true }),
    supabase
      .from("memberships")
      .select("member_id, membership_type, starts_on, expires_on")
      .order("expires_on", { ascending: false }),
    supabase
      .from("meetings")
      .select(
        "id, activity, meeting_date, starts_at, ends_at, location, show_on_calendar"
      )
      .order("meeting_date", { ascending: false }),
    supabase
      .from("attendance_records")
      .select("member_id, attendee_name, checked_in_at")
      .order("checked_in_at", { ascending: false })
  ]);

  return {
    officerProfile: officerProfile as OfficerProfile,
    members: (membersResult.data ?? []) as AdminMember[],
    memberships: (membershipsResult.data ?? []) as AdminMembership[],
    meetings: (meetingsResult.data ?? []) as AdminMeeting[],
    attendanceRecords: (attendanceResult.data ?? []) as AdminAttendanceRecord[]
  };
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const memberSearch = firstSearchParam(params?.memberSearch) ?? "";
  const status = firstSearchParam(params?.status);
  const error = firstSearchParam(params?.error);
  const {
    officerProfile,
    members,
    memberships,
    meetings,
    attendanceRecords
  } = await getAdminDashboardData();
  const stats = buildAdminDashboardStats({
    members,
    memberships,
    meetings,
    attendanceRecords
  });
  const visibleMembers = filterMembersBySearch(members, memberSearch);
  const dashboardMessage = status
    ? statusMessages[status]
    : error
      ? errorMessages[error]
      : null;

  return (
    <section className="admin-shell">
      <div className="admin-toolbar">
        <div>
          <p className="eyebrow">Officer dashboard</p>
          <h1>Club admin</h1>
          <p>
            Signed in as {officerProfile.full_name} ({officerProfile.role}).
          </p>
        </div>
        <form action={signOutAdmin}>
          <button className="button secondary" type="submit">
            Sign out
          </button>
        </form>
      </div>

      {dashboardMessage ? (
        <p className={status ? "admin-notice success" : "admin-notice error"}>
          {dashboardMessage}
        </p>
      ) : null}

      <div className="admin-stats" aria-label="Admin summary">
        <article>
          <span>{stats.totalMembers}</span>
          <p>Total members</p>
        </article>
        <article>
          <span>{stats.activeMembers}</span>
          <p>Active memberships</p>
        </article>
        <article>
          <span>{stats.calendarActivities}</span>
          <p>Calendar activities</p>
        </article>
        <article>
          <span>{stats.attendanceRecords}</span>
          <p>Attendance check-ins</p>
        </article>
      </div>

      <AdminEntryForms members={members} meetings={meetings} />

      <div className="admin-grid">
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <h2>Members</h2>
            <form action="/admin" className="admin-search-form" method="get">
              <input
                aria-label="Search members"
                defaultValue={memberSearch}
                name="memberSearch"
                placeholder="Search members"
                type="search"
              />
              <button className="button secondary" type="submit">
                Search
              </button>
              {memberSearch ? (
                <Link className="button secondary" href="/admin">
                  Clear
                </Link>
              ) : null}
            </form>
          </div>
          {visibleMembers.length ? (
            <div className="admin-list">
              {visibleMembers.map((member) => {
                const membership = latestMembershipForMember(
                  member.id,
                  memberships
                );
                const attendanceCount = getMemberAttendanceCount(
                  member.id,
                  attendanceRecords
                );
                return (
                  <article className="admin-row" key={member.id}>
                    <div>
                      <h3>{member.full_name}</h3>
                      <p>{member.email || "No email listed"}</p>
                    </div>
                    <div>
                      <strong>
                        {membership
                          ? getMembershipStatus(membership.expires_on)
                          : "no membership"}
                      </strong>
                      <p>
                        {membership
                          ? `${membership.membership_type} through ${formatDate(
                              membership.expires_on
                            )}`
                          : "Add a membership term later"}
                      </p>
                    </div>
                    <div>
                      <strong>{attendanceCount}</strong>
                      <p>meetings attended</p>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : members.length ? (
            <p className="admin-empty">No members match that search.</p>
          ) : (
            <p className="admin-empty">
              No members yet.
            </p>
          )}
        </section>

        <section className="admin-panel">
          <div className="admin-panel-heading">
            <h2>Activities</h2>
            <p>These will power both the calendar and attendance check-in.</p>
          </div>
          {meetings.length ? (
            <div className="admin-list">
              {meetings.map((meeting) => (
                <article className="admin-row compact" key={meeting.id}>
                  <div>
                    <h3>{meeting.activity}</h3>
                    <p>
                      {formatDate(meeting.meeting_date)}
                      {meeting.starts_at ? ` / ${formatTime(meeting.starts_at)}` : ""}
                    </p>
                  </div>
                  <div>
                    <strong>
                      {meeting.show_on_calendar === false ? "hidden" : "calendar"}
                    </strong>
                    <p>{meeting.location || "No location listed"}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="admin-empty">
              No activities yet. Add meeting/activity creation next.
            </p>
          )}
        </section>
      </div>
    </section>
  );
}
