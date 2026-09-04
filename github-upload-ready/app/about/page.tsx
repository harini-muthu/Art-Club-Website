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
