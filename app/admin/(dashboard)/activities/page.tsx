import { AdminEntryForms } from "@/components/admin-entry-forms";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { ActivityScheduleFields } from "@/components/activity-schedule-fields";
import Image from "next/image";
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
              {meeting.image_url ? <Image
                alt={meeting.image_alt || `${meeting.activity ?? "Activity"} image`}
                className="admin-activity-thumbnail"
                height={60}
                unoptimized
                src={meeting.image_url}
                width={60}
              /> : null}
              <div><h3>{meeting.activity}</h3><p>{formatAdminDate(meeting.meeting_date)}{meeting.starts_at ? ` / ${formatAdminTime(meeting.starts_at)}` : ""}</p></div>
              <div><strong>{meeting.show_on_calendar === false ? "hidden" : "calendar"}</strong><p>{meeting.location || "No location listed"}</p></div>
              <div><strong>{meeting.attendance_count ?? 0} attendees</strong><p>Saved attendance</p></div>
            </div>
            <div className="admin-row-actions">
              <details>
                <summary className="button secondary">Edit</summary>
                <form action={updateMeetingActivity} className="admin-entry-form inline" encType="multipart/form-data">
                  <input name="meetingId" type="hidden" value={meeting.id} />
                  <input name="currentImageUrl" type="hidden" value={meeting.image_url ?? ""} />
                  <label>Activity<input defaultValue={meeting.activity ?? ""} name="activity" required type="text" /></label>
                  <ActivityScheduleFields
                    defaultEndsAt={meeting.ends_at}
                    defaultLocation={meeting.location}
                    defaultMeetingDate={meeting.meeting_date}
                    defaultStartsAt={meeting.starts_at}
                    meetingId={meeting.id}
                    meetings={meetings}
                  />
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
