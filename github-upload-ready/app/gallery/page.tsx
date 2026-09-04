import { PageSection } from "@/components/page-section";
import { GalleryGrid } from "@/components/gallery-grid";
import { galleryPhotos } from "@/lib/site-data";

export default function GalleryPage() {
  return (
    <>
      <section className="page-hero gallery-hero">
        <p className="eyebrow">Gallery</p>
        <h1>Moments from the studio, stage, and campus.</h1>
        <p>
          Member-submitted work from the college art club. Select a piece to
          view it larger and read more about the artist behind it.
        </p>
      </section>

      <PageSection
        title="Member submissions"
        intro="A rotating showcase for artwork submitted by club members."
      >
        <GalleryGrid photos={galleryPhotos} />
      </PageSection>
    </>
  );
}
