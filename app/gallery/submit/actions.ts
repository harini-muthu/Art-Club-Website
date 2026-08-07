"use server";

import { redirect } from "next/navigation";
import { createGallerySubmissionId, deleteGallerySubmissionImage, uploadGallerySubmissionImage } from "@/lib/gallery-image-storage";
import { validateGallerySubmission } from "@/lib/gallery-submissions";
import { createAdminClient } from "@/lib/supabase/server";

function redirectWithError(): never {
  redirect("/gallery/submit?error=invalid-submission");
}

export async function submitGalleryArtwork(formData: FormData) {
  const validation = validateGallerySubmission(formData);
  if (!validation.ok) redirectWithError();

  try {
    const supabase = await createAdminClient();
    const { data: member } = await supabase
      .from<{ id: string; full_name: string | null; email: string | null }>("members")
      .select("id, full_name, email")
      .eq("email", validation.data.school_email)
      .single();

    if (!member?.full_name) redirectWithError();

    const { data: memberships } = await supabase
      .from<{ expires_on: string }>("memberships")
      .select("expires_on")
      .eq("member_id", member.id)
      .order("expires_on", { ascending: false });
    const today = new Date().toISOString().slice(0, 10);
    if (!(memberships ?? []).some((membership) => membership.expires_on >= today)) redirectWithError();

    const submissionId = createGallerySubmissionId();
    const upload = await uploadGallerySubmissionImage(supabase, submissionId, validation.data.image_file);
    if (!upload.ok) redirectWithError();

    const { error } = await supabase.from("gallery_submissions").insert({
      id: submissionId,
      member_id: member.id,
      artist_name: member.full_name,
      school_email: validation.data.school_email,
      title: validation.data.title,
      class_year: validation.data.class_year,
      medium: validation.data.medium,
      dimensions: validation.data.dimensions,
      statement: validation.data.statement,
      private_image_path: upload.path
    });
    if (error) {
      await deleteGallerySubmissionImage(supabase, upload.path);
      redirectWithError();
    }
  } catch {
    redirectWithError();
  }

  redirect("/gallery/submit?submitted=1");
}
