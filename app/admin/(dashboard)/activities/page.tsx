import { AdminEntryForms } from "@/components/admin-entry-forms";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { deleteMeetingActivity, updateMeetingActivity } from "@/app/admin/actions";
import { formatAdminDate, formatAdminTime, getActivitiesData } from "@/lib/admin-dashboard";

export default async function ActivitiesPage() {
  const meetings = await getActivitiesData();

  return (
    <>
      <AdminEntryForms members={[]} meetings={meetings} sections={["activity"]} />
      <section className="admin-panel">
        <div className="admin-panel-heading"><h2>Activities</h2><p>Future activities can appear in the public upcoming-event panel and power attendance check-in.</p></div>
        {meetings.length ? <div className="admin-list">
          {meetings.map((meeting) => <article className="admin-row compact editable" key={meeting.id}>
            <div className="admin-row-summary compact">
              <div><h3>{meeting.activity}</h3><p>{formatAdminDate(meeting.meeting_date)}{meeting.starts_at ? ` / ${formatAdminTime(meeting.starts_at)}` : ""}</p></div>
              <div><strong>{meeting.show_on_calendar === false ? "hidden" : "calendar"}</strong><p>{meeting.location || "No location listed"}</p></div>
            </div>
            <div className="admin-row-actions">
              <details>
                <summary className="button secondary">Edit</summary>
                <form action={updateMeetingActivity} className="admin-entry-form inline" encType="multipart/form-data">
                  <input name="meetingId" type="hidden" value={meeting.id} />
                  <input name="currentImageUrl" type="hidden" value={meeting.image_url ?? ""} />
                  <label>Activity<input defaultValue={meeting.activity ?? ""} name="activity" required type="text" /></label>
                  <div className="admin-form-grid">
                    <label>Date<input defaultValue={meeting.meeting_date ?? ""} name="meetingDate" required type="date" /></label>
                    <label>Starts<input defaultValue={meeting.starts_at ?? ""} name="startsAt" type="time" /></label>
                    <label>Ends<input defaultValue={meeting.ends_at ?? ""} name="endsAt" type="time" /></label>
                    <label>Location<input defaultValue={meeting.location ?? ""} name="location" type="text" /></label>
                  </div>
                  <label>Replace image<input accept=".jpg,.jpeg,.png,image/jpeg,image/png" name="eventImage" type="file" /></label>
                  {meeting.image_url ? <label className="admin-checkbox"><input name="removeImage" type="checkbox" />Remove current image</label> : null}
                  <label>Image description<input defaultValue={meeting.image_alt ?? ""} name="imageAlt" type="text" /></label>
                  <label className="admin-checkbox"><input defaultChecked={meeting.show_on_calendar !== false} name="showOnCalendar" type="checkbox" />Publish on events page</label>
                  <button className="button primary" type="submit">Save activity</button>
                </form>
              </details>
              <form action={deleteMeetingActivity}>
                <input name="meetingId" type="hidden" value={meeting.id} />
                <ConfirmSubmitButton className="button danger" message={`Delete ${meeting.activity ?? "this activity"}? Attendance for this meeting will also be removed.`}>Delete</ConfirmSubmitButton>
              </form>
            </div>
          </article>)}
        </div> : <p className="admin-empty">No activities yet.</p>}
      </section>
    </>
  );
}
