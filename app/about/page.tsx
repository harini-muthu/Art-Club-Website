import { PageSection } from "@/components/page-section";
import { OfficerRecord, sortOfficersForDisplay } from "@/lib/admin-data";
import { hasSupabaseBrowserConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type PublicOfficer = Omit<OfficerRecord, "email">;

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
          Studio Collective is a flexible campus club for students who want to
          make, share, perform, document, or support creative work together.
        </p>
      </section>

      <PageSection title="Club mission">
        <div className="text-grid">
          <p>
            The club helps students turn rough ideas into visible campus
            moments: showcases, workshops, poster runs, gallery walks, and
            collaborative projects.
          </p>
          <p>
            Members do not need a polished portfolio to join. The point is to
            learn in public, make useful things, and build a friendly creative
            network across campus.
          </p>
        </div>
      </PageSection>

      <PageSection
        eyebrow="Meetings"
        title="Meeting date and time"
        intro="Join the club during its regular weekly meeting."
      >
        <div className="meeting-card">
          <p className="meeting-time">Every Wednesday at 6:30 PM</p>
          <p>
            Meetings are the main place for member updates, project sharing,
            club planning, and open studio time.
          </p>
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
