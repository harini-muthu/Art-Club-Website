import Link from "next/link";
import { PageSection } from "@/components/page-section";
import {
  buildPublicEventsFromMeetings,
  buildPublicEventsFromStaticEvents,
  PublicEvent,
  PublicMeetingRow,
  selectHighlightedEvent
} from "@/lib/event-display";
import { clubName, events } from "@/lib/site-data";
import { hasSupabaseBrowserConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

async function getPublicEvents() {
  const fallbackEvents = buildPublicEventsFromStaticEvents(events);

  if (!hasSupabaseBrowserConfig()) {
    return fallbackEvents;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from<PublicMeetingRow>("meetings")
      .select(
        "id, activity, meeting_date, starts_at, ends_at, location, image_url, image_alt, show_on_calendar"
      )
      .order("meeting_date", { ascending: true });

    if (error || !data?.length) {
      return fallbackEvents;
    }

    const publicEvents = buildPublicEventsFromMeetings(data);
    return publicEvents.length ? publicEvents : fallbackEvents;
  } catch {
    return fallbackEvents;
  }
}

function EventImage({ event }: { event: PublicEvent }) {
  if (event.imageUrl) {
    return (
      <div
        aria-label={event.imageAlt ?? event.title}
        className="event-image"
        role="img"
        style={{ backgroundImage: `url(${event.imageUrl})` }}
      />
    );
  }

  return (
    <div className={`image-tile tone-${event.imageTone}`}>
      <span>{event.dateLabel}</span>
    </div>
  );
}

function FeaturedEvent({ event }: { event: PublicEvent }) {
  return (
    <article
      className={`featured-event tone-${event.imageTone} ${
        event.imageUrl ? "with-image" : ""
      }`}
    >
      {event.imageUrl ? (
        <div
          aria-label={event.imageAlt ?? event.title}
          className="featured-event-image"
          role="img"
          style={{ backgroundImage: `url(${event.imageUrl})` }}
        />
      ) : null}
      <div className="featured-event-copy">
        <span>Closest event</span>
        <h2>{event.title}</h2>
        <p>{event.description}</p>
        <dl>
          <div>
            <dt>Date</dt>
            <dd>{event.dateLabel}</dd>
          </div>
          <div>
            <dt>Time</dt>
            <dd>{event.time}</dd>
          </div>
          <div>
            <dt>Place</dt>
            <dd>{event.location}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}

export default async function EventsPage() {
  const publicEvents = await getPublicEvents();
  const featuredEvent = selectHighlightedEvent(publicEvents) ?? publicEvents[0];
  const otherEvents = publicEvents.filter((event) => event.id !== featuredEvent.id);

  return (
    <>
      <section className="hero event-hero">
        <div className="hero-copy">
          <p className="eyebrow">Club events</p>
          <h1>{clubName}</h1>
          <p>
            A student creative club for showcases, workshops, collaborations,
            and campus projects that need a little more imagination.
          </p>
          <div className="hero-actions">
            <Link className="button primary" href="/contact">
              Contact the club
            </Link>
            <Link className="button secondary" href="/gallery">
              View gallery
            </Link>
          </div>
        </div>
        <FeaturedEvent event={featuredEvent} />
      </section>

      <PageSection
        eyebrow="Calendar"
        title="Club events"
        intro="A current calendar of art club activities. The highlighted event is the one closest to today."
      >
        <div className="event-grid">
          {otherEvents.map((event) => (
            <article className="event-card" key={event.id}>
              <EventImage event={event} />
              <div>
                <h3>{event.title}</h3>
                <p>{event.description}</p>
                <p className="event-meta">
                  {event.dateLabel} / {event.time} / {event.location}
                </p>
              </div>
            </article>
          ))}
        </div>
      </PageSection>

      <section className="cta-band">
        <div>
          <p className="eyebrow">Have an idea?</p>
          <h2>Invite the club into a campus moment.</h2>
        </div>
        <Link className="button primary" href="/contact">
          Start with contact
        </Link>
      </section>
    </>
  );
}
