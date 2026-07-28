"use client";

import { useMemo, useState } from "react";
import { AdminMeeting } from "@/lib/admin-data";

type ActivityScheduleFieldsProps = {
  meetings: AdminMeeting[];
  meetingId?: string;
  defaultMeetingDate?: string | null;
  defaultStartsAt?: string | null;
  defaultEndsAt?: string | null;
  defaultLocation?: string | null;
};

function startOfWindow(time: string) {
  return time || "00:00";
}

function endOfWindow(time: string) {
  return time || "24:00";
}

export function ActivityScheduleFields({
  meetings,
  meetingId,
  defaultMeetingDate = "",
  defaultStartsAt = "",
  defaultEndsAt = "",
  defaultLocation = ""
}: ActivityScheduleFieldsProps) {
  const [meetingDate, setMeetingDate] = useState(defaultMeetingDate ?? "");
  const [startsAt, setStartsAt] = useState(defaultStartsAt ?? "");
  const [endsAt, setEndsAt] = useState(defaultEndsAt ?? "");

  const overlaps = useMemo(
    () => meetings.filter((meeting) =>
      meeting.id !== meetingId &&
      meeting.meeting_date === meetingDate &&
      startOfWindow(startsAt) < endOfWindow(meeting.ends_at ?? "") &&
      startOfWindow(meeting.starts_at ?? "") < endOfWindow(endsAt)
    ),
    [endsAt, meetingDate, meetingId, meetings, startsAt]
  );

  return <>
    <div className="admin-form-grid">
      <label>Date<input name="meetingDate" onChange={(event) => setMeetingDate(event.target.value)} required type="date" value={meetingDate} /></label>
      <label>Starts<input name="startsAt" onChange={(event) => setStartsAt(event.target.value)} type="time" value={startsAt} /></label>
      <label>Ends<input name="endsAt" onChange={(event) => setEndsAt(event.target.value)} type="time" value={endsAt} /></label>
      <label>Location<input defaultValue={defaultLocation ?? ""} name="location" type="text" /></label>
    </div>
    {overlaps.length ? <p className="admin-notice warning" role="status">
      This schedule overlaps {overlaps.map((meeting) => meeting.activity || "another activity").join(", ")}. Officers can still save this activity; QR attendees will choose their event.
    </p> : null}
  </>;
}
