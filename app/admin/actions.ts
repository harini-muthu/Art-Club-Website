"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  deleteEventImage,
  uploadEventImage
} from "@/lib/event-image-storage";
import {
  getOfficerProvisioningConfig,
  getSupabaseBrowserConfig
} from "@/lib/supabase/config";
import {
  MeetingSubmission,
  validateOfficerSubmission,
  validateOfficerUpdateSubmission,
  validateAttendanceSubmission,
  validateMeetingUpdateSubmission,
  validateMeetingSubmission,
  validateMemberSubmission,
  validateMemberUpdateSubmission
} from "@/lib/admin-entry-validation";
import { adminLoginRedirectUrl, isPresidentRole } from "@/lib/admin-auth";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { deleteGalleryPublicImage, deleteGallerySubmissionImage, publishGallerySubmissionImage } from "@/lib/gallery-image-storage";

export async function signOutAdmin() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

type OfficerProfile = {
  id: string;
  email: string;
  full_name: string;
  role: string;
};

async function provisionOfficerAuth(email: string, sharedPassword: string) {
  try {
    const adminSupabase = await createAdminClient();
    const adminAuth = adminSupabase.auth.admin;

    if (!adminAuth) {
      return false;
    }

    const { error: createError } = await adminAuth.createUser({
      email,
      password: sharedPassword,
      email_confirm: true
    });

    if (!createError) {
      return true;
    }

    if (!/already registered/i.test(createError.message)) {
      return false;
    }

    const perPage = 1000;
    for (let page = 1; ; page += 1) {
      const { data, error: listError } = await adminAuth.listUsers({ page, perPage });
      if (listError) {
        return false;
      }

      const existingUser = data.users.find(
        (user) => user.email?.trim().toLowerCase() === email
      );

      if (existingUser) {
        const { error: updateError } = await adminAuth.updateUserById(existingUser.id, {
          password: sharedPassword
        });
        return !updateError;
      }

      if (data.users.length < perPage) {
        return false;
      }
    }
  } catch {
    return false;
  }
}

async function getAuthorizedAdminClient() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(adminLoginRedirectUrl("missing-session"));
  }

  const userEmail = user.email?.trim().toLowerCase();

  if (!userEmail) {
    redirect(adminLoginRedirectUrl("missing-profile"));
  }

  const { data: officer } = await supabase
    .from("officers")
    .select("id, name, role, email")
    .eq("email", userEmail)
    .single();

  if (!officer) {
    redirect(adminLoginRedirectUrl("missing-profile"));
  }

  return {
    supabase,
    officerProfile: {
      id: officer.id,
      email: officer.email,
      full_name: officer.name,
      role: officer.role
    } as OfficerProfile
  };
}

function redirectToAdminWithStatus(status: string): never {
  const path = status.startsWith("member-")
    ? "/admin/memberships"
    : status.startsWith("guest-") || status.startsWith("guests-")
      ? "/admin/memberships"
    : status.startsWith("activity-")
      ? "/admin/activities"
      : "/admin";

  revalidatePath(path);
  redirect(`${path}?status=${status}`);
}

function redirectToAdminWithError(error: string): never {
  const path = error.startsWith("member-")
    ? "/admin/memberships"
    : error.startsWith("activity-")
      ? "/admin/activities"
    : error.startsWith("gallery-")
      ? "/admin/gallery"
      : error.startsWith("officer-")
        ? "/admin/officers"
        : "/admin";

  redirect(`${path}?error=${error}`);
}

function redirectToGalleryReview(status: string): never {
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
  redirect(`/admin/gallery?status=${status}`);
}

function redirectToAdminWithOfficerStatus(status: string): never {
  revalidatePath("/admin/officers");
  revalidatePath("/about");
  redirect(`/admin/officers?status=${status}`);
}

function requirePresident(role: string): void {
  if (!isPresidentRole(role)) {
    redirectToAdminWithError("officer-access-denied");
  }
}

function redirectToOfficerMutationError(error: { message?: string } | null): never {
  if (/at least one president must remain/i.test(error?.message ?? "")) {
    redirectToAdminWithError("officer-last-president");
  }

  if (/no more than two presidents are allowed/i.test(error?.message ?? "")) {
    redirectToAdminWithError("officer-president-limit");
  }

  redirectToAdminWithError("officer-save-failed");
}

function meetingRowFromSubmission(data: MeetingSubmission) {
  const {
    current_image_url: _currentImageUrl,
    image_file: _imageFile,
    remove_image: _removeImage,
    ...meetingRow
  } = data;

  return meetingRow;
}

async function removeStoredEventImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  imageUrl: string | null | undefined
) {
  const { url } = getSupabaseBrowserConfig();
  const result = await deleteEventImage(supabase, imageUrl, url);

  if (!result.ok) {
    redirectToAdminWithError("activity-save-failed");
  }
}

export async function addMemberWithMembership(formData: FormData) {
  const validation = validateMemberSubmission(formData);

  if (!validation.ok) {
    redirectToAdminWithError("member-invalid");
  }

  const { supabase, officerProfile } = await getAuthorizedAdminClient();
  if (typeof supabase.rpc === "function") {
    const { data: promotedMemberId, error: promotionError } = await supabase.rpc("promote_active_guest_by_email", {
      email_input: validation.data.member.email ?? "",
      notes_input: validation.data.member.notes ?? "",
      membership_type_input: validation.data.membership.membership_type,
      starts_on_input: validation.data.membership.starts_on,
      expires_on_input: validation.data.membership.expires_on,
      paid_amount_input: validation.data.membership.paid_amount,
      added_by_input: officerProfile.full_name
    });
    if (promotionError) redirectToAdminWithError("member-save-failed");
    if (promotedMemberId) redirectToAdminWithStatus("member-linked-guest");
  }
  const { data: member, error: memberError } = await supabase
    .from<{ id: string }>("members")
    .insert(validation.data.member)
    .select("id")
    .single();

  if (memberError || !member) {
    redirectToAdminWithError("member-save-failed");
  }

  const { error: membershipError } = await supabase.from("memberships").insert({
    member_id: member.id,
    ...validation.data.membership,
    added_by: officerProfile.full_name
  });

  if (membershipError) {
    redirectToAdminWithError("member-save-failed");
  }

  redirectToAdminWithStatus("member-added");
}

export async function updateMemberWithMembership(formData: FormData) {
  const validation = validateMemberUpdateSubmission(formData);

  if (!validation.ok) {
    redirectToAdminWithError("member-invalid");
  }

  const { supabase, officerProfile } = await getAuthorizedAdminClient();
  const { error: memberError } = await supabase
    .from("members")
    .update(validation.data.member)
    .eq("id", validation.data.member_id);

  if (memberError) {
    redirectToAdminWithError("member-save-failed");
  }

  if (validation.data.membership_id) {
    const { error: membershipError } = await supabase
      .from("memberships")
      .update(validation.data.membership)
      .eq("id", validation.data.membership_id);

    if (membershipError) {
      redirectToAdminWithError("member-save-failed");
    }
  } else {
    const { error: membershipError } = await supabase.from("memberships").insert({
      member_id: validation.data.member_id,
      ...validation.data.membership,
      added_by: officerProfile.full_name
    });

    if (membershipError) {
      redirectToAdminWithError("member-save-failed");
    }
  }

  redirectToAdminWithStatus("member-updated");
}

export async function deleteMember(formData: FormData) {
  const memberId = formData.get("memberId");

  if (typeof memberId !== "string" || !memberId.trim()) {
    redirectToAdminWithError("member-invalid");
  }

  const { supabase } = await getAuthorizedAdminClient();
  const { error } = await supabase
    .from("members")
    .delete()
    .eq("id", memberId.trim());

  if (error) {
    redirectToAdminWithError("member-save-failed");
  }

  redirectToAdminWithStatus("member-deleted");
}

export async function updateGuest(formData: FormData) {
  const guestId = formData.get("guestId");
  const fullName = formData.get("fullName");
  const schoolEmail = formData.get("schoolEmail");
  if (typeof guestId !== "string" || typeof fullName !== "string" || typeof schoolEmail !== "string" || !guestId || !fullName.trim() || !schoolEmail.trim()) redirectToAdminWithError("member-invalid");
  const { supabase } = await getAuthorizedAdminClient();
  const { error } = await supabase.from("guests").update({ full_name: fullName.trim(), school_email: schoolEmail.trim().toLowerCase() }).eq("id", guestId);
  if (error) redirectToAdminWithError("member-save-failed");
  redirectToAdminWithStatus("guest-updated");
}

export async function archiveGuest(formData: FormData) {
  const guestId = formData.get("guestId");
  if (typeof guestId !== "string" || !guestId) redirectToAdminWithError("member-invalid");
  const { supabase } = await getAuthorizedAdminClient();
  const { error } = await supabase.from("guests").update({ archived_at: new Date().toISOString() }).eq("id", guestId);
  if (error) redirectToAdminWithError("member-save-failed");
  redirectToAdminWithStatus("guest-archived");
}

export async function archiveGuestsForSemester() {
  const { supabase } = await getAuthorizedAdminClient();
  const { error } = await supabase.rpc("archive_active_guests");
  if (error) redirectToAdminWithError("member-save-failed");
  redirectToAdminWithStatus("guests-reset");
}

export async function addOfficer(formData: FormData) {
  const validation = validateOfficerSubmission(formData);

  if (!validation.ok) {
    redirectToAdminWithError("officer-invalid");
  }

  const { supabase, officerProfile } = await getAuthorizedAdminClient();
  requirePresident(officerProfile.role);

  let provisioningConfig;
  try {
    provisioningConfig = getOfficerProvisioningConfig();
  } catch {
    redirectToAdminWithError("officer-auth-config-missing");
  }

  const provisioned = await provisionOfficerAuth(
    validation.data.email,
    provisioningConfig.sharedPassword
  );

  if (!provisioned) {
    redirectToAdminWithError("officer-auth-provision-failed");
  }

  const { error } = await supabase.from("officers").insert(validation.data);

  if (error) {
    redirectToOfficerMutationError(error);
  }

  redirectToAdminWithOfficerStatus("officer-added");
}

export async function updateOfficer(formData: FormData) {
  const validation = validateOfficerUpdateSubmission(formData);

  if (!validation.ok) {
    redirectToAdminWithError("officer-invalid");
  }

  const { officer_id: officerId, role, email, ...profileFields } = validation.data;
  const { supabase, officerProfile } = await getAuthorizedAdminClient();
  const { data: targetOfficer } = await supabase
    .from("officers")
    .select("id, role, email")
    .eq("id", officerId)
    .single();

  if (!targetOfficer || targetOfficer.email !== email) {
    redirectToAdminWithError("officer-email-immutable");
  }

  let officerRow: typeof profileFields | (typeof profileFields & { role: string }) = {
    ...profileFields,
    role
  };

  if (!isPresidentRole(officerProfile.role)) {
    if (
      targetOfficer.id !== officerProfile.id ||
      targetOfficer.role !== role
    ) {
      redirectToAdminWithError("officer-access-denied");
    }

    officerRow = profileFields;
  }

  const { error } = await supabase
    .from("officers")
    .update(officerRow)
    .eq("id", officerId);

  if (error) {
    redirectToOfficerMutationError(error);
  }

  redirectToAdminWithOfficerStatus("officer-updated");
}

export async function deleteOfficer(formData: FormData) {
  const officerId = formData.get("officerId");

  if (typeof officerId !== "string" || !officerId.trim()) {
    redirectToAdminWithError("officer-invalid");
  }

  const { supabase, officerProfile } = await getAuthorizedAdminClient();
  requirePresident(officerProfile.role);
  const { count, error: countError } = await supabase
    .from("officers")
    .select("id", { count: "exact", head: true });

  if (countError || typeof count !== "number") {
    redirectToAdminWithError("officer-save-failed");
  }

  if (count <= 1) {
    redirectToAdminWithError("officer-final-delete");
  }

  const { error } = await supabase
    .from("officers")
    .delete()
    .eq("id", officerId.trim());

  if (error) {
    redirectToOfficerMutationError(error);
  }

  redirectToAdminWithOfficerStatus("officer-deleted");
}

export async function addMeetingActivity(formData: FormData) {
  const validation = validateMeetingSubmission(formData);

  if (!validation.ok) {
    redirectToAdminWithError("activity-invalid");
  }

  const { supabase } = await getAuthorizedAdminClient();
  const meetingRow = meetingRowFromSubmission(validation.data);

  if (validation.data.image_file) {
    const upload = await uploadEventImage(supabase, validation.data.image_file, {
      scopeId: "event"
    });

    if (!upload.ok) {
      redirectToAdminWithError("activity-save-failed");
    }

    meetingRow.image_url = upload.publicUrl;
  }

  const { error } = await supabase.from("meetings").insert(meetingRow);

  if (error) {
    redirectToAdminWithError("activity-save-failed");
  }

  revalidatePath("/");
  redirectToAdminWithStatus("activity-added");
}

export async function updateMeetingActivity(formData: FormData) {
  const validation = validateMeetingUpdateSubmission(formData);

  if (!validation.ok) {
    redirectToAdminWithError("activity-invalid");
  }

  const { meeting_id: meetingId, ...meetingData } = validation.data;
  const { supabase } = await getAuthorizedAdminClient();
  const meetingRow = meetingRowFromSubmission(meetingData);

  if (meetingData.image_file) {
    const upload = await uploadEventImage(supabase, meetingData.image_file, {
      scopeId: meetingId
    });

    if (!upload.ok) {
      redirectToAdminWithError("activity-save-failed");
    }

    meetingRow.image_url = upload.publicUrl;

    if (meetingData.current_image_url) {
      await removeStoredEventImage(supabase, meetingData.current_image_url);
    }
  } else if (meetingData.remove_image && meetingData.current_image_url) {
    await removeStoredEventImage(supabase, meetingData.current_image_url);
  }

  const { error } = await supabase
    .from("meetings")
    .update(meetingRow)
    .eq("id", meetingId);

  if (error) {
    redirectToAdminWithError("activity-save-failed");
  }

  revalidatePath("/");
  redirectToAdminWithStatus("activity-updated");
}

export async function deleteMeetingActivity(formData: FormData) {
  const meetingId = formData.get("meetingId");

  if (typeof meetingId !== "string" || !meetingId.trim()) {
    redirectToAdminWithError("activity-invalid");
  }

  const { supabase } = await getAuthorizedAdminClient();
  const { data: meeting } = await supabase
    .from<{ image_url: string | null }>("meetings")
    .select("image_url")
    .eq("id", meetingId.trim())
    .single();

  if (meeting?.image_url) {
    await removeStoredEventImage(supabase, meeting.image_url);
  }

  const { error } = await supabase
    .from("meetings")
    .delete()
    .eq("id", meetingId.trim());

  if (error) {
    redirectToAdminWithError("activity-save-failed");
  }

  revalidatePath("/");
  redirectToAdminWithStatus("activity-deleted");
}

export async function reviewGallerySubmission(formData: FormData) {
  const submissionId = formData.get("submissionId");
  const reviewStatus = formData.get("reviewStatus");
  const reviewNote = formData.get("reviewNote");
  if (typeof submissionId !== "string" || !submissionId || !["approved", "rejected", "changes_needed"].includes(String(reviewStatus))) redirectToAdminWithError("gallery-invalid");
  const { supabase, officerProfile } = await getAuthorizedAdminClient();
  const { data: submission } = await supabase.from<{ private_image_path: string; public_image_path: string | null; review_status: string }>("gallery_submissions").select("private_image_path, public_image_path, review_status").eq("id", submissionId).single();
  if (!submission || submission.review_status === "approved") redirectToAdminWithError("gallery-invalid");

  const update: Record<string, unknown> = { review_status: reviewStatus, review_note: typeof reviewNote === "string" ? reviewNote.trim() || null : null, reviewer_id: officerProfile.id, reviewed_at: new Date().toISOString() };
  if (reviewStatus === "approved" && !submission.public_image_path) {
    const published = await publishGallerySubmissionImage(supabase, submissionId, submission.private_image_path);
    if (!published.ok) redirectToAdminWithError("gallery-publish-failed");
    update.public_image_path = published.publicPath;
    update.public_image_url = published.publicUrl;
  }
  const { error } = await supabase.from("gallery_submissions").update(update).eq("id", submissionId);
  if (error) {
    if (typeof update.public_image_path === "string") await deleteGalleryPublicImage(supabase, update.public_image_path);
    redirectToAdminWithError("gallery-save-failed");
  }
  redirectToGalleryReview(`gallery-${reviewStatus === "changes_needed" ? "changes-needed" : reviewStatus}`);
}

export async function deleteGallerySubmission(formData: FormData) {
  const submissionId = formData.get("submissionId");
  if (typeof submissionId !== "string" || !submissionId) redirectToAdminWithError("gallery-invalid");
  const { supabase } = await getAuthorizedAdminClient();
  const { data: submission } = await supabase.from<{ private_image_path: string; public_image_path: string | null }>("gallery_submissions").select("private_image_path, public_image_path").eq("id", submissionId).single();
  if (!submission) redirectToAdminWithError("gallery-invalid");
  const [privateDelete, publicDelete] = await Promise.all([deleteGallerySubmissionImage(supabase, submission.private_image_path), deleteGalleryPublicImage(supabase, submission.public_image_path)]);
  if (!privateDelete.ok || !publicDelete.ok) redirectToAdminWithError("gallery-save-failed");
  const { error } = await supabase.from("gallery_submissions").delete().eq("id", submissionId);
  if (error) redirectToAdminWithError("gallery-save-failed");
  redirectToGalleryReview("gallery-deleted");
}

export async function addAttendanceRecord(formData: FormData) {
  const validation = validateAttendanceSubmission(formData);

  if (!validation.ok) {
    redirectToAdminWithError("attendance-invalid");
  }

  const { supabase } = await getAuthorizedAdminClient();
  let attendeeName = validation.data.attendee_name;

  if (validation.data.member_id && !attendeeName) {
    const { data: member } = await supabase
      .from<{ full_name: string }>("members")
      .select("full_name")
      .eq("id", validation.data.member_id)
      .single();

    attendeeName = member?.full_name ?? null;
  }

  if (!attendeeName) {
    redirectToAdminWithError("attendance-invalid");
  }

  const { error } = await supabase.from("attendance_records").insert({
    ...validation.data,
    attendee_name: attendeeName
  });

  if (error) {
    redirectToAdminWithError("attendance-save-failed");
  }

  redirectToAdminWithStatus("attendance-added");
}
