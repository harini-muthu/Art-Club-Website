import Image from "next/image";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import type { AdminGallerySubmission } from "@/lib/admin-dashboard";

export function GallerySubmissionsTable({ submissions, deleteSubmission, reviewSubmission }: {
  submissions: Array<AdminGallerySubmission & { reviewImageUrl: string | null }>;
  deleteSubmission: (formData: FormData) => Promise<void>;
  reviewSubmission: (formData: FormData) => Promise<void>;
}) {
  if (!submissions.length) return <p className="admin-empty">No artwork submissions yet.</p>;
  return <div className="admin-list">{submissions.map((submission) => <article className="admin-row editable" key={submission.id}>
    <div className="admin-row-summary compact">
      {submission.reviewImageUrl ? <Image alt={`${submission.title} by ${submission.artist_name}`} className="admin-activity-thumbnail" height={90} src={submission.reviewImageUrl} unoptimized width={90} /> : null}
      <div><h3>{submission.title}</h3><p>{submission.artist_name} · Class of {submission.class_year}</p><p>{submission.medium} · {submission.dimensions}</p><p>Status: {submission.review_status}</p></div>
    </div>
    <p>{submission.statement}</p>
    <div className="admin-row-actions">
      <form action={reviewSubmission} className="admin-entry-form inline"><input name="submissionId" type="hidden" value={submission.id} /><label>Review note<textarea defaultValue={submission.review_note ?? ""} name="reviewNote" rows={2} /></label><button className="button primary" name="reviewStatus" type="submit" value="approved">Approve</button><button className="button secondary" name="reviewStatus" type="submit" value="changes_needed">Needs changes</button><button className="button secondary" name="reviewStatus" type="submit" value="rejected">Reject</button></form>
      <form action={deleteSubmission}><input name="submissionId" type="hidden" value={submission.id} /><ConfirmSubmitButton className="button danger" message={`Delete ${submission.title}?`}>Delete</ConfirmSubmitButton></form>
    </div>
  </article>)}</div>;
}
