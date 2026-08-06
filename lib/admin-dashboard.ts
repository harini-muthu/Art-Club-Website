import { redirect } from "next/navigation";
import {
  AdminAttendanceRecord,
  AdminGuest,
  AdminMeeting,
  AdminMember,
  AdminMembership,
  OfficerRecord,
  sortOfficersForDisplay
} from "@/lib/admin-data";
import { adminLoginRedirectUrl } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";

export type OfficerProfile = {
  id: string;
  name: string;
  role: string;
  email: string;
};

export function formatAdminDate(date?: string | null) {
  if (!date) return "No date";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}

export function formatAdminTime(time?: string | null) {
  if (!time) return "";
  const [hours = "0", minutes = "0"] = time.split(":");
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(2026, 0, 1, Number(hours), Number(minutes)));
}

export function latestMembershipForMember(memberId: string, memberships: AdminMembership[]) {
  return memberships.filter((membership) => membership.member_id === memberId).sort((a, b) => b.expires_on.localeCompare(a.expires_on))[0];
}

export async function getAuthorizedOfficerProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect(adminLoginRedirectUrl(user ? "missing-profile" : "missing-session"));
  }

  const { data: officerProfile } = await supabase
    .from("officers")
    .select("id, name, role, email")
    .eq("email", user.email.trim().toLowerCase())
    .single();

  if (!officerProfile) {
    redirect(adminLoginRedirectUrl("missing-profile"));
  }

  return officerProfile as OfficerProfile;
}

export async function getOverviewData() {
  const supabase = await createClient();
  const [membersResult, membershipsResult, meetingsResult, attendanceResult] = await Promise.all([
    supabase.from("members").select("id, full_name, email, notes").order("full_name", { ascending: true }),
    supabase.from("memberships").select("id, member_id, membership_type, starts_on, expires_on, paid_amount").order("expires_on", { ascending: false }),
    supabase.from("meetings").select("id, activity, meeting_date, starts_at, ends_at, location, image_url, image_alt, show_on_calendar, attendance_count").order("meeting_date", { ascending: false }),
    supabase.from("attendance_records").select("member_id, attendee_name, checked_in_at").order("checked_in_at", { ascending: false })
  ]);

  return {
    members: (membersResult.data ?? []) as AdminMember[],
    memberships: (membershipsResult.data ?? []) as AdminMembership[],
    meetings: (meetingsResult.data ?? []) as AdminMeeting[],
    attendanceRecords: (attendanceResult.data ?? []) as AdminAttendanceRecord[]
  };
}

export async function getMembershipsData() {
  const supabase = await createClient();
  const [membersResult, membershipsResult, attendanceResult, guestsResult] = await Promise.all([
    supabase.from("members").select("id, full_name, email, notes").order("full_name", { ascending: true }),
    supabase.from("memberships").select("id, member_id, membership_type, starts_on, expires_on, paid_amount").order("expires_on", { ascending: false }),
    supabase.from("attendance_records").select("member_id, guest_id, attendee_name, school_email, checked_in_at").order("checked_in_at", { ascending: false }),
    supabase.from("guests").select("id, full_name, school_email, archived_at").order("full_name", { ascending: true })
  ]);

  return {
    members: (membersResult.data ?? []) as AdminMember[],
    memberships: (membershipsResult.data ?? []) as AdminMembership[],
    attendanceRecords: (attendanceResult.data ?? []) as AdminAttendanceRecord[],
    guests: ((guestsResult.data ?? []) as AdminGuest[]).filter((guest) => !guest.archived_at)
  };
}

export async function getActivitiesData() {
  const supabase = await createClient();
  const { data } = await supabase.from("meetings").select("id, activity, meeting_date, starts_at, ends_at, location, image_url, image_alt, show_on_calendar, attendance_count").order("meeting_date", { ascending: false });
  return (data ?? []) as AdminMeeting[];
}

export async function getOfficersData() {
  const supabase = await createClient();
  const { data } = await supabase.from("officers").select("id, name, role, email, focus").order("name", { ascending: true });
  return sortOfficersForDisplay((data ?? []) as OfficerRecord[]);
}
