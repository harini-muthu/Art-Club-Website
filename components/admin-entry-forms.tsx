import {
  addAttendanceRecord,
  addMeetingActivity,
  addMemberWithMembership
} from "@/app/admin/actions";
import { AdminMeeting, AdminMember } from "@/lib/admin-data";

type AdminEntryFormsProps = {
  members: AdminMember[];
  meetings: AdminMeeting[];
};

export function AdminEntryForms({ members, meetings }: AdminEntryFormsProps) {
  const hasMeetings = meetings.length > 0;

  return (
    <div className="admin-entry-grid" aria-label="Admin data entry">
      <section className="admin-panel admin-entry-panel">
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
              Starts
              <input name="startsOn" required type="date" />
            </label>
            <label>
              Expires
              <input name="expiresOn" required type="date" />
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
      </section>

      <section className="admin-panel admin-entry-panel">
        <div className="admin-panel-heading">
          <h2>Add activity</h2>
          <p>Activities appear in the admin list and can power the calendar.</p>
        </div>
        <form className="admin-entry-form" action={addMeetingActivity}>
          <label>
            Activity
            <input name="activity" required type="text" />
          </label>
          <div className="admin-form-grid">
            <label>
              Date
              <input name="meetingDate" required type="date" />
            </label>
            <label>
              Starts
              <input defaultValue="18:30" name="startsAt" type="time" />
            </label>
            <label>
              Ends
              <input name="endsAt" type="time" />
            </label>
            <label>
              Location
              <input name="location" type="text" />
            </label>
          </div>
          <label className="admin-checkbox">
            <input defaultChecked name="showOnCalendar" type="checkbox" />
            Show on calendar
          </label>
          <button className="button primary" type="submit">
            Add activity
          </button>
        </form>
      </section>

      <section className="admin-panel admin-entry-panel">
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
      </section>
    </div>
  );
}
