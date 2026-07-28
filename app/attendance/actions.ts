"use server";

import { redirect } from "next/navigation";
import {
  normalizeAttendeeName,
  recordTodayAttendance
} from "@/lib/attendance";
import { createClient } from "@/lib/supabase/server";

function readField(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

export async function recordQrAttendance(formData: FormData) {
  const attendeeName = readField(formData, "attendeeName");
  const schoolEmail = readField(formData, "schoolEmail");
  const meetingId = readField(formData, "meetingId");
  const honeypot = readField(formData, "website");

  if (!normalizeAttendeeName(attendeeName) || !schoolEmail || !meetingId || honeypot) {
    redirect("/attendance?status=invalid");
  }

  const supabase = await createClient();
  const status = await recordTodayAttendance(supabase, {
    attendeeName,
    schoolEmail,
    meetingId,
    honeypot
  });

  redirect(`/attendance?status=${status}`);
}
