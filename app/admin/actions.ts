"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  validateAttendanceSubmission,
  validateMeetingSubmission,
  validateMemberSubmission
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

  const { data: officerProfile } = await supabase
    .from("officer_profiles")
    .select("full_name, role")
    .eq("auth_user_id", user.id)
    .single();

  if (!officerProfile) {
    redirect(adminLoginRedirectUrl("missing-profile"));
  }

  return {
    supabase,
    officerProfile: officerProfile as OfficerProfile
  };
}

function redirectToAdminWithStatus(status: string): never {
  revalidatePath("/admin");
  redirect(`/admin?status=${status}`);
}

function redirectToAdminWithError(error: string): never {
  redirect(`/admin?error=${error}`);
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

export async function addMeetingActivity(formData: FormData) {
  const validation = validateMeetingSubmission(formData);

  if (!validation.ok) {
    redirectToAdminWithError("activity-invalid");
  }

  const { supabase } = await getAuthorizedAdminClient();
  const { error } = await supabase.from("meetings").insert(validation.data);

  if (error) {
    redirectToAdminWithError("activity-save-failed");
  }

  redirectToAdminWithStatus("activity-added");
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
