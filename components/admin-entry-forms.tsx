import {
  addAttendanceRecord,
  addMeetingActivity,
  addMemberWithMembership
} from "@/app/admin/actions";
import { AdminMeeting, AdminMember } from "@/lib/admin-data";
import { ActivityScheduleFields } from "@/components/activity-schedule-fields";

type AdminEntryFormsProps = {
  members: AdminMember[];
  meetings: AdminMeeting[];
  sections?: Array<"member" | "activity" | "attendance">;
};

export function AdminEntryForms({
  members,
  meetings,
  sections = ["member", "activity", "attendance"]
}: AdminEntryFormsProps) {
  const hasMeetings = meetings.length > 0;

  return (
    <div
      className={
        sections.length === 1
          ? "admin-entry-grid admin-entry-grid-single"
          : "admin-entry-grid"
      }
      aria-label="Admin data entry"
    >
      {sections.includes("member") ? <section className="admin-panel admin-entry-panel">
        <div className="admin-panel-heading">
          <h2>Add member</h2>
          <p>Membership terms are stored with an expiration date.</p>
        </div>
        <form className="admin-entry-form" action={addMemberWithMembership}>
          <label>
            Full name
            <input name="fullName" required type="text" />
          </label>
          <label>
            Email
            <input name="email" type="email" />
          </label>
          <div className="admin-form-grid">
            <label>
              Paid for
              <select defaultValue="semester" name="membershipType" required>
                <option value="semester">Semester</option>
                <option value="year">Year</option>
              </select>
            </label>
            <label>
              Amount
              <input min="0" name="paidAmount" step="0.01" type="number" />
            </label>
          </div>
          <label>
            Notes
            <textarea name="notes" rows={3} />
          </label>
          <button className="button primary" type="submit">
            Add member
          </button>
        </form>
      </section> : null}

      {sections.includes("activity") ? <section className="admin-panel admin-entry-panel">
        <div className="admin-panel-heading">
          <h2>Add activity</h2>
          <p>Schedule future activities here. Public upcoming activities appear in the highlighted event panel.</p>
        </div>
        <form
          action={addMeetingActivity}
          className="admin-entry-form"
          //encType="multipart/form-data"
        >
          <label>
            Activity
            <input name="activity" required type="text" />
          </label>
          <ActivityScheduleFields meetings={meetings} defaultStartsAt="18:30" />
          <label>
            Event image
            <input accept=".jpg,.jpeg,.png,image/jpeg,image/png" name="eventImage" type="file" />
          </label>
          <label>
            Image description
            <input name="imageAlt" type="text" />
          </label>
          <label className="admin-checkbox">
            <input defaultChecked name="showOnCalendar" type="checkbox" />
            Publish on events page
          </label>
          <button className="button primary" type="submit">
            Add activity
          </button>
        </form>
      </section> : null}

      {sections.includes("attendance") ? <section className="admin-panel admin-entry-panel">
        <div className="admin-panel-heading">
          <h2>Record attendance</h2>
          <p>Counts update when a member is linked to the check-in.</p>
        </div>
        <form className="admin-entry-form" action={addAttendanceRecord}>
          <label>
            Meeting
            <select disabled={!hasMeetings} name="meetingId" required>
              <option value="">Choose meeting</option>
              {meetings.map((meeting) => (
                <option key={meeting.id} value={meeting.id}>
                  {meeting.meeting_date} - {meeting.activity}
                </option>
              ))}
            </select>
          </label>
          <label>
            Member
            <select name="memberId">
              <option value="">Not listed / visitor</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.full_name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Attendee name
            <input name="attendeeName" type="text" />
          </label>
          <button className="button primary" disabled={!hasMeetings} type="submit">
            Record attendance
          </button>
        </form>
      </section> : null}
    </div>
  );
}
