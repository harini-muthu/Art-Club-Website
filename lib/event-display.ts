import { EventItem } from "@/lib/site-data";

export type PublicMeetingRow = {
  id: string;
  activity?: string | null;
  meeting_date?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  location?: string | null;
  image_url?: string | null;
  image_alt?: string | null;
  show_on_calendar?: boolean | null;
};

export type PublicEvent = {
  id: string;
  title: string;
  dateLabel: string;
  eventDate: string;
  time: string;
  location: string;
  description: string;
  imageTone: string;
  imageUrl?: string | null;
  imageAlt?: string | null;
};

const eventTones = ["teal", "rose", "amber", "violet", "green", "cyan"];

function formatDateLabel(date: string) {
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

function timeLabel(startsAt?: string | null, endsAt?: string | null) {
  const start = formatTime(startsAt);
  const end = formatTime(endsAt);

  if (start && end) {
    return `${start} - ${end}`;
  }

  return start || "Time to be announced";
}

function eventDistanceFromToday(eventDate: string, today: Date) {
  const eventTime = new Date(`${eventDate}T00:00:00Z`).getTime();
  const todayTime = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate()
  );

  return Math.abs(eventTime - todayTime);
}

export function buildPublicEventsFromMeetings(
  meetings: PublicMeetingRow[]
): PublicEvent[] {
  return meetings
    .filter(
      (meeting) =>
        meeting.show_on_calendar !== false &&
        Boolean(meeting.activity) &&
        Boolean(meeting.meeting_date)
    )
    .map((meeting, index) => ({
      id: meeting.id,
      title: meeting.activity ?? "Art Club Event",
      dateLabel: formatDateLabel(meeting.meeting_date ?? ""),
      eventDate: meeting.meeting_date ?? "",
      time: timeLabel(meeting.starts_at, meeting.ends_at),
      location: meeting.location || "Location to be announced",
      description: "Art club activity.",
      imageTone: eventTones[index % eventTones.length],
      imageUrl: meeting.image_url,
      imageAlt: meeting.image_alt || meeting.activity || "Art club event"
    }))
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate));
}

export function buildPublicEventsFromStaticEvents(
  staticEvents: EventItem[]
): PublicEvent[] {
  return staticEvents.map((event, index) => ({
    id: `sample-${index}`,
    title: event.title,
    dateLabel: event.date,
    eventDate: event.eventDate,
    time: event.time,
    location: event.location,
    description: event.description,
    imageTone: event.imageTone,
    imageUrl: event.imageUrl,
    imageAlt: event.imageAlt || event.title
  }));
}

export function selectHighlightedEvent(
  events: PublicEvent[],
  today: Date = new Date()
) {
  return [...events].sort((a, b) => {
    const distanceDifference =
      eventDistanceFromToday(a.eventDate, today) -
      eventDistanceFromToday(b.eventDate, today);

    if (distanceDifference !== 0) {
      return distanceDifference;
    }

    return a.eventDate.localeCompare(b.eventDate);
  })[0];
}
