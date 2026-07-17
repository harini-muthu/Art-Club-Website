import { describe, expect, it } from "vitest";
import {
  buildPublicEventsFromMeetings,
  selectHighlightedEvent
} from "@/lib/event-display";

describe("event display helpers", () => {
  it("maps visible meeting rows into public event cards with images", () => {
    expect(
      buildPublicEventsFromMeetings([
        {
          id: "meeting-1",
          activity: "Watercolor Night",
          meeting_date: "2026-07-20",
          starts_at: "18:30",
          ends_at: "20:00",
          location: "Studio 204",
          image_url: "https://example.edu/watercolor.jpg",
          image_alt: "Students painting at tables",
          show_on_calendar: true
        },
        {
          id: "meeting-hidden",
          activity: "Officer Planning",
          meeting_date: "2026-07-21",
          show_on_calendar: false
        }
      ])
    ).toEqual([
      {
        id: "meeting-1",
        title: "Watercolor Night",
        dateLabel: "Jul 20, 2026",
        eventDate: "2026-07-20",
        time: "6:30 PM - 8:00 PM",
        location: "Studio 204",
        description: "Art club activity.",
        imageTone: "teal",
        imageUrl: "https://example.edu/watercolor.jpg",
        imageAlt: "Students painting at tables"
      }
    ]);
  });

  it("selects the event whose date is closest to today", () => {
    const events = buildPublicEventsFromMeetings([
      {
        id: "meeting-1",
        activity: "Far Future",
        meeting_date: "2026-09-10",
        show_on_calendar: true
      },
      {
        id: "meeting-2",
        activity: "Closest",
        meeting_date: "2026-07-20",
        show_on_calendar: true
      },
      {
        id: "meeting-3",
        activity: "Last Week",
        meeting_date: "2026-07-10",
        show_on_calendar: true
      }
    ]);

    expect(
      selectHighlightedEvent(events, new Date("2026-07-17T12:00:00Z"))?.title
    ).toBe("Closest");
  });
});
