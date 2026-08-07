import { deleteGallerySubmission, reviewGallerySubmission } from "@/app/admin/actions";
import { GallerySubmissionsTable } from "@/components/gallery-submissions-table";
import { getAuthorizedOfficerProfile, getGallerySubmissionsData } from "@/lib/admin-dashboard";

export default async function GallerySubmissionsPage() {
  await getAuthorizedOfficerProfile();
  const submissions = await getGallerySubmissionsData();
  return <section className="admin-panel"><div className="admin-panel-heading"><h2>Gallery submissions</h2><p>Review artwork before it appears in the public gallery.</p></div><GallerySubmissionsTable deleteSubmission={deleteGallerySubmission} reviewSubmission={reviewGallerySubmission} submissions={submissions} /></section>;
}
