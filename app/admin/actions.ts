"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  deleteEventImage,
  uploadEventImage
} from "@/lib/event-image-storage";
import {
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
import { adminLoginRedirectUrl } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";

export async function signOutAdmin() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

type OfficerProfile = {
  full_name: string;
  role: string;
};

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
    .select("name, role, email")
    .eq("email", userEmail)
    .single();

  if (!officer) {
    redirect(adminLoginRedirectUrl("missing-profile"));
  }

  return {
    supabase,
    officerProfile: {
      full_name: officer.name,
      role: officer.role
    } as OfficerProfile
  };
}

function redirectToAdminWithStatus(status: string): never {
  revalidatePath("/admin");
  redirect(`/admin?status=${status}`);
}

function redirectToAdminWithError(error: string): never {
  redirect(`/admin?error=${error}`);
}

function redirectToAdminWithOfficerStatus(status: string): never {
  revalidatePath("/admin");
  revalidatePath("/about");
  redirect(`/admin?status=${status}`);
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

export async function addOfficer(formData: FormData) {
  const validation = validateOfficerSubmission(formData);

  if (!validation.ok) {
    redirectToAdminWithError("officer-invalid");
  }

  const { supabase } = await getAuthorizedAdminClient();
  const { error } = await supabase.from("officers").insert(validation.data);

  if (error) {
    redirectToAdminWithError("officer-save-failed");
  }

  redirectToAdminWithOfficerStatus("officer-added");
}

export async function updateOfficer(formData: FormData) {
  const validation = validateOfficerUpdateSubmission(formData);

  if (!validation.ok) {
    redirectToAdminWithError("officer-invalid");
  }

  const { officer_id: officerId, ...officerRow } = validation.data;
  const { supabase } = await getAuthorizedAdminClient();
  const { error } = await supabase
    .from("officers")
    .update(officerRow)
    .eq("id", officerId);

  if (error) {
    redirectToAdminWithError("officer-save-failed");
  }

  redirectToAdminWithOfficerStatus("officer-updated");
}

export async function deleteOfficer(formData: FormData) {
  const officerId = formData.get("officerId");

  if (typeof officerId !== "string" || !officerId.trim()) {
    redirectToAdminWithError("officer-invalid");
  }

  const { supabase } = await getAuthorizedAdminClient();
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
    redirectToAdminWithError("officer-save-failed");
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

  redirectToAdminWithStatus("activity-deleted");
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
