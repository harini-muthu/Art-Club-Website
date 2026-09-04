import { PageSection } from "@/components/page-section";
import { OfficerRecord, sortOfficersForDisplay } from "@/lib/admin-data";
import {
  clubGroupMeUrl,
  clubInstagramHandle,
  clubInstagramUrl,
  clubName
} from "@/lib/site-data";
import { hasSupabaseBrowserConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type PublicOfficer = Omit<OfficerRecord, "email">;

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="17.2" cy="6.8" r="1.4" fill="currentColor"/>
    </svg>
  );
}

function GroupMeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 3.4c-4.6 0-8.3 3.2-8.3 7.2 0 2.2 1.2 4.1 3 5.4v3.5l3.4-1.8c.7.2 1.5.3 2.3.3 4.6 0 8.3-3.2 8.3-7.2S16.6 3.4 12 3.4Zm-2.8 8.8h5.6v1.5H9.2v-1.5Zm0-3h5.6v1.5H9.2V9.2Zm0 6.1h3.9v1.5H9.2v-1.5Z" fill="currentColor"/>
    </svg>
  );
}

function getOfficerInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("");
}

async function getPublicOfficers() {
  if (!hasSupabaseBrowserConfig()) {
    return [];
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("public_officers")
      .select("id, name, role, focus");

    if (error || !data?.length) {
      return [];
    }

    return sortOfficersForDisplay(data as PublicOfficer[]);
  } catch {
    return [];
  }
}

export default async function AboutPage() {
  const officers = await getPublicOfficers();

  return (
    <>
      <section className="page-hero compact-hero">
        <p className="eyebrow">About</p>
        <h1>Creative energy, student-led.</h1>
        <p>
          Purdue Art Community is a space for students to relax and be creative
          each week. We value exposing our members to different mediums and
          provide access to all materials. No experience necessary!
        </p>
      </section>

      <PageSection
        eyebrow="Community"
        title="Find us and ask questions"
        intro="Here is where you can find us and ask questions about the club."
      >
        <div className="find-us-grid">
          <a
            className="find-us-card social-link"
            href={clubInstagramUrl}
            rel="noreferrer"
            target="_blank"
            aria-label="Open Purdue Art Community Instagram"
          >
            <div className="social-card-header">
              <span className="social-icon instagram" aria-hidden="true">
                <InstagramIcon />
              </span>
              <div>
                <p className="eyebrow">Instagram</p>
                <h3>{clubInstagramHandle}</h3>
              </div>
            </div>
            <p>Follow along for weekly inspiration, photos, and announcements.</p>
          </a>
          <a
            className="find-us-card social-link"
            href={clubGroupMeUrl}
            rel="noreferrer"
            target="_blank"
            aria-label="Join the Purdue Art Community GroupMe"
          >
            <div className="social-card-header">
              <span className="social-icon groupme" aria-hidden="true">
                <GroupMeIcon />
              </span>
              <div>
                <p className="eyebrow">GroupMe</p>
                <h3>Join the group chat</h3>
              </div>
            </div>
            <p>Ask questions, meet other members, and hear about weekly hangouts.</p>
          </a>
        </div>
      </PageSection>

      <PageSection
        eyebrow="Board"
        title="Club officers"
        intro="Meet the students helping organize the club."
      >
        {officers.length ? (
          <div className="officer-grid">
            {officers.map((officer) => (
              <article className="officer-card" key={officer.id}>
                <div className="avatar" aria-hidden="true">
                  {getOfficerInitials(officer.name)}
                </div>
                <div>
                  <h3>{officer.name}</h3>
                  <p className="role">{officer.role}</p>
                  {officer.focus ? <p>{officer.focus}</p> : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="admin-empty">Officer information will be posted soon.</p>
        )}
      </PageSection>
    </>
  );
}
