import { PageSection } from "@/components/page-section";
import { GalleryGrid } from "@/components/gallery-grid";
import { galleryPhotos } from "@/lib/site-data";
import { approvedSubmissionToGalleryPhoto, type ApprovedGallerySubmission } from "@/lib/gallery-submissions";
import { hasSupabaseBrowserConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

async function getGalleryPhotos() {
  if (!hasSupabaseBrowserConfig()) return galleryPhotos;
  try {
    const supabase = await createClient();
    const { data } = await supabase.from<ApprovedGallerySubmission>("gallery_submissions")
      .select("id, title, artist_name, class_year, medium, dimensions, statement, public_image_url")
      .eq("review_status", "approved")
      .order("reviewed_at", { ascending: false });
    return (data ?? []).filter((submission) => submission.public_image_url).map(approvedSubmissionToGalleryPhoto);
  } catch {
    return [];
  }
}

export default async function GalleryPage() {
  const photos = await getGalleryPhotos();
  return (
    <>
      <section className="page-hero gallery-hero">
        <p className="eyebrow">Gallery</p>
        <h1>Moments from the studio, stage, and campus.</h1>
        <p>
          Member-submitted work from the college art club. Select a piece to
          view it larger and read more about the artist behind it.
        </p>
        <Link className="button secondary" href="/gallery/submit">Submit artwork</Link>
      </section>

      <PageSection
        title="Member submissions"
        intro="A rotating showcase for artwork submitted by club members."
      >
        {photos.length ? <GalleryGrid photos={photos} /> : <p className="admin-empty">No approved artwork is available yet.</p>}
      </PageSection>
    </>
  );
}
