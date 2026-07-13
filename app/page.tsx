import Link from "next/link";
import { PageSection } from "@/components/page-section";
import { clubName, events } from "@/lib/site-data";

const featuredEvent = events.find((event) => event.featured) ?? events[0];
const otherEvents = events.filter((event) => event !== featuredEvent);

export default function EventsPage() {
  return (
    <>
      <section className="hero event-hero">
        <div className="hero-copy">
          <p className="eyebrow">Recent events</p>
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
        <article className={`featured-event tone-${featuredEvent.imageTone}`}>
          <span>Featured recent</span>
          <h2>{featuredEvent.title}</h2>
          <p>{featuredEvent.description}</p>
          <dl>
            <div>
              <dt>Date</dt>
              <dd>{featuredEvent.date}</dd>
            </div>
            <div>
              <dt>Time</dt>
              <dd>{featuredEvent.time}</dd>
            </div>
            <div>
              <dt>Place</dt>
              <dd>{featuredEvent.location}</dd>
            </div>
          </dl>
        </article>
      </section>

      <PageSection
        eyebrow="Calendar"
        title="Completed this semester"
        intro="A recent archive of art club events from this semester. Future events can be added after they happen."
      >
        <div className="event-grid">
          {otherEvents.map((event) => (
            <article className="event-card" key={event.title}>
              <div className={`image-tile tone-${event.imageTone}`}>
                <span>{event.date}</span>
              </div>
              <div>
                <h3>{event.title}</h3>
                <p>{event.description}</p>
                <p className="event-meta">
                  {event.time} / {event.location}
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
