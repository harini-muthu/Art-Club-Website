import { deleteGallerySubmission, reviewGallerySubmission } from "@/app/admin/actions";
import { GallerySubmissionsTable } from "@/components/gallery-submissions-table";
import { getAuthorizedOfficerProfile, getGallerySubmissionsData } from "@/lib/admin-dashboard";

export default async function GallerySubmissionsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const params = await searchParams;
  await getAuthorizedOfficerProfile();
  const submissions = await getGallerySubmissionsData();
  const message = params.status === "gallery-approved"
    ? "Artwork approved and published."
    : params.status === "gallery-rejected"
      ? "Artwork rejected."
      : params.status === "gallery-changes-needed"
        ? "Changes requested."
    : params.status === "gallery-deleted"
      ? "Artwork deleted."
      : null;

  return <section className="admin-panel"><div className="admin-panel-heading"><h2>Gallery submissions</h2><p>Review artwork before it appears in the public gallery.</p></div>{message ? <p role="status" className="form-success">{message}</p> : null}<GallerySubmissionsTable deleteSubmission={deleteGallerySubmission} reviewSubmission={reviewGallerySubmission} submissions={submissions} /></section>;
}
