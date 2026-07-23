import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AttendanceQrPanel } from "@/components/attendance-qr-panel";
import { AdminEntryForms } from "@/components/admin-entry-forms";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import {
  AdminAttendanceRecord,
  AdminMeeting,
  AdminMember,
  AdminMembership,
  buildAdminDashboardStats,
  filterMembersBySearch,
  getMemberAttendanceCount,
  getMembershipStatus,
  OfficerRecord,
  sortOfficersForDisplay
} from "@/lib/admin-data";
import { adminLoginRedirectUrl } from "@/lib/admin-auth";
import {
  getAttendanceQrOrigin,
  getLocalLanAddress
} from "@/lib/request-origin";
import { createClient } from "@/lib/supabase/server";
import {
  deleteMeetingActivity,
  deleteMember,
  deleteOfficer,
  signOutAdmin,
  updateOfficer,
  updateMeetingActivity,
  updateMemberWithMembership,
  addOfficer
} from "@/app/admin/actions";

export const metadata = {
  title: "Admin | Studio Collective"
};

type OfficerProfile = {
  name: string;
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
  "activity-deleted": "Activity deleted.",
  "activity-updated": "Activity updated.",
  "attendance-added": "Attendance recorded.",
  "member-added": "Member and membership added.",
  "member-deleted": "Member deleted.",
  "member-updated": "Member updated.",
  "officer-added": "Officer added.",
  "officer-deleted": "Officer deleted.",
  "officer-updated": "Officer updated."
};

const errorMessages: Record<string, string> = {
  "activity-invalid": "Check the activity fields and try again.",
  "activity-save-failed": "Activity could not be saved. Check Supabase policies.",
  "attendance-invalid": "Choose a meeting and identify the attendee.",
  "attendance-save-failed": "Attendance could not be saved. Check Supabase policies.",
  "member-invalid": "Check the member fields and try again.",
  "member-save-failed": "Member could not be saved. Check Supabase policies.",
  "officer-final-delete": "Keep at least one officer so admin access is not locked out.",
  "officer-invalid": "Check the officer fields and try again.",
  "officer-save-failed": "Officer could not be saved. Check Supabase policies."
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

  const userEmail = user.email?.trim().toLowerCase();

  if (!userEmail) {
    redirect(adminLoginRedirectUrl("missing-profile"));
  }

  const { data: officerProfile } = await supabase
    .from("officers")
    .select("name, role, email")
    .eq("email", userEmail)
    .single();

  if (!officerProfile) {
    redirect(adminLoginRedirectUrl("missing-profile"));
  }

  const [
    membersResult,
    membershipsResult,
    meetingsResult,
    officersResult,
    attendanceResult
  ] = await Promise.all([
    supabase
      .from("members")
      .select("id, full_name, email, notes")
      .order("full_name", { ascending: true }),
    supabase
      .from("memberships")
      .select("id, member_id, membership_type, starts_on, expires_on, paid_amount")
      .order("expires_on", { ascending: false }),
    supabase
      .from("meetings")
      .select(
        "id, activity, meeting_date, starts_at, ends_at, location, image_url, image_alt, show_on_calendar"
      )
      .order("meeting_date", { ascending: false }),
    supabase
      .from("officers")
      .select("id, name, role, email, focus")
      .order("name", { ascending: true }),
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
    officers: sortOfficersForDisplay(
      (officersResult.data ?? []) as OfficerRecord[]
    ),
    attendanceRecords: (attendanceResult.data ?? []) as AdminAttendanceRecord[]
  };
}

async function getRequestOrigin() {
  const requestHeaders = await headers();
  return getAttendanceQrOrigin({
    forwardedHost: requestHeaders.get("x-forwarded-host"),
    forwardedProto: requestHeaders.get("x-forwarded-proto"),
    host: requestHeaders.get("host"),
    lanAddress: getLocalLanAddress()
  });
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
    officers,
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
  const requestOrigin = await getRequestOrigin();

  return (
    <section className="admin-shell">
      <div className="admin-toolbar">
        <div>
          <p className="eyebrow">Officer dashboard</p>
          <h1>Club admin</h1>
          <p>
            Signed in as {officerProfile.name} ({officerProfile.role}).
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

      <AttendanceQrPanel origin={requestOrigin} />

      <div className="admin-grid">
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <h2>Officers</h2>
            <p>Officer emails grant admin access and are not shown publicly.</p>
          </div>
          <form className="admin-entry-form inline" action={addOfficer}>
            <label>
              Name
              <input name="officerName" required type="text" />
            </label>
            <label>
              Title
              <input name="officerRole" required type="text" />
            </label>
            <label>
              Email
              <input name="officerEmail" required type="email" />
            </label>
            <label>
              Focus
              <textarea name="officerFocus" rows={3} />
            </label>
            <button className="button primary" type="submit">
              Add officer
            </button>
          </form>
          {officers.length ? (
            <div className="admin-list">
              {officers.map((officer) => (
                <article className="admin-row compact editable" key={officer.id}>
                  <div className="admin-row-summary compact">
                    <div>
                      <h3>{officer.name}</h3>
                      <p>{officer.role}</p>
                    </div>
                    <div>
                      <strong>{officer.email}</strong>
                      <p>{officer.focus || "No focus listed"}</p>
                    </div>
                  </div>
                  <div className="admin-row-actions">
                    <details>
                      <summary className="button secondary">Edit</summary>
                      <form action={updateOfficer} className="admin-entry-form inline">
                        <input name="officerId" type="hidden" value={officer.id} />
                        <label>
                          Name
                          <input
                            defaultValue={officer.name}
                            name="officerName"
                            required
                            type="text"
                          />
                        </label>
                        <label>
                          Title
                          <input
                            defaultValue={officer.role}
                            name="officerRole"
                            required
                            type="text"
                          />
                        </label>
                        <label>
                          Email
                          <input
                            defaultValue={officer.email ?? ""}
                            name="officerEmail"
                            required
                            type="email"
                          />
                        </label>
                        <label>
                          Focus
                          <textarea
                            defaultValue={officer.focus ?? ""}
                            name="officerFocus"
                            rows={3}
                          />
                        </label>
                        <button className="button primary" type="submit">
                          Save officer
                        </button>
                      </form>
                    </details>
                    <form action={deleteOfficer}>
                      <input name="officerId" type="hidden" value={officer.id} />
                      <ConfirmSubmitButton
                        className="button danger"
                        message={`Delete ${
                          officer.name ?? "this officer"
                        }? They will lose admin access.`}
                      >
                        Delete
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="admin-empty">No officers yet.</p>
          )}
        </section>

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
                  <article className="admin-row editable" key={member.id}>
                    <div className="admin-row-summary">
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
                    </div>
                    <div className="admin-row-actions">
                      <details>
                        <summary className="button secondary">Edit</summary>
                        <form
                          action={updateMemberWithMembership}
                          className="admin-entry-form inline"
                        >
                          <input name="memberId" type="hidden" value={member.id} />
                          <input
                            name="membershipId"
                            type="hidden"
                            value={membership?.id ?? ""}
                          />
                          <input
                            name="originalMembershipType"
                            type="hidden"
                            value={membership?.membership_type ?? ""}
                          />
                          <input
                            name="startsOn"
                            type="hidden"
                            value={membership?.starts_on ?? ""}
                          />
                          <input
                            name="expiresOn"
                            type="hidden"
                            value={membership?.expires_on ?? ""}
                          />
                          <label>
                            Full name
                            <input
                              defaultValue={member.full_name ?? ""}
                              name="fullName"
                              required
                              type="text"
                            />
                          </label>
                          <label>
                            Email
                            <input
                              defaultValue={member.email ?? ""}
                              name="email"
                              type="email"
                            />
                          </label>
                          <div className="admin-form-grid">
                            <label>
                              Paid for
                              <select
                                defaultValue={membership?.membership_type ?? "semester"}
                                name="membershipType"
                                required
                              >
                                <option value="semester">Semester</option>
                                <option value="year">Year</option>
                              </select>
                            </label>
                            <label>
                              Amount
                              <input
                                defaultValue={membership?.paid_amount ?? ""}
                                min="0"
                                name="paidAmount"
                                step="0.01"
                                type="number"
                              />
                            </label>
                          </div>
                          <label>
                            Notes
                            <textarea
                              defaultValue={member.notes ?? ""}
                              name="notes"
                              rows={3}
                            />
                          </label>
                          <button className="button primary" type="submit">
                            Save member
                          </button>
                        </form>
                      </details>
                      <form action={deleteMember}>
                        <input name="memberId" type="hidden" value={member.id} />
                        <ConfirmSubmitButton
                          className="button danger"
                          message={`Delete ${
                            member.full_name ?? "this member"
                          }? This cannot be undone.`}
                        >
                          Delete
                        </ConfirmSubmitButton>
                      </form>
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
                <article className="admin-row compact editable" key={meeting.id}>
                  <div className="admin-row-summary compact">
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
                  </div>
                  <div className="admin-row-actions">
                    <details>
                      <summary className="button secondary">Edit</summary>
                      <form
                        action={updateMeetingActivity}
                        className="admin-entry-form inline"
                        encType="multipart/form-data"
                      >
                        <input name="meetingId" type="hidden" value={meeting.id} />
                        <input
                          name="currentImageUrl"
                          type="hidden"
                          value={meeting.image_url ?? ""}
                        />
                        <label>
                          Activity
                          <input
                            defaultValue={meeting.activity ?? ""}
                            name="activity"
                            required
                            type="text"
                          />
                        </label>
                        <div className="admin-form-grid">
                          <label>
                            Date
                            <input
                              defaultValue={meeting.meeting_date ?? ""}
                              name="meetingDate"
                              required
                              type="date"
                            />
                          </label>
                          <label>
                            Starts
                            <input
                              defaultValue={meeting.starts_at ?? ""}
                              name="startsAt"
                              type="time"
                            />
                          </label>
                          <label>
                            Ends
                            <input
                              defaultValue={meeting.ends_at ?? ""}
                              name="endsAt"
                              type="time"
                            />
                          </label>
                          <label>
                            Location
                            <input
                              defaultValue={meeting.location ?? ""}
                              name="location"
                              type="text"
                            />
                          </label>
                        </div>
                        <label>
                          Replace image
                          <input
                            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                            name="eventImage"
                            type="file"
                          />
                        </label>
                        {meeting.image_url ? (
                          <label className="admin-checkbox">
                            <input name="removeImage" type="checkbox" />
                            Remove current image
                          </label>
                        ) : null}
                        <label>
                          Image description
                          <input
                            defaultValue={meeting.image_alt ?? ""}
                            name="imageAlt"
                            type="text"
                          />
                        </label>
                        <label className="admin-checkbox">
                          <input
                            defaultChecked={meeting.show_on_calendar !== false}
                            name="showOnCalendar"
                            type="checkbox"
                          />
                          Show on calendar
                        </label>
                        <button className="button primary" type="submit">
                          Save activity
                        </button>
                      </form>
                    </details>
                    <form action={deleteMeetingActivity}>
                      <input name="meetingId" type="hidden" value={meeting.id} />
                      <ConfirmSubmitButton
                        className="button danger"
                        message={`Delete ${
                          meeting.activity ?? "this activity"
                        }? Attendance for this meeting will also be removed.`}
                      >
                        Delete
                      </ConfirmSubmitButton>
                    </form>
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
