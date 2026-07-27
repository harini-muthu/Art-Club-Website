import { headers } from "next/headers";
import { AttendanceQrPanel } from "@/components/attendance-qr-panel";
import { AdminEntryForms } from "@/components/admin-entry-forms";
import { buildAdminDashboardStats } from "@/lib/admin-data";
import { getOverviewData } from "@/lib/admin-dashboard";
import { getAttendanceQrOrigin, getLocalLanAddress } from "@/lib/request-origin";

export const metadata = { title: "Admin | Studio Collective" };

async function getRequestOrigin() {
  const requestHeaders = await headers();
  return getAttendanceQrOrigin({
    forwardedHost: requestHeaders.get("x-forwarded-host"),
    forwardedProto: requestHeaders.get("x-forwarded-proto"),
    host: requestHeaders.get("host"),
    lanAddress: getLocalLanAddress()
  });
}

export default async function AdminOverviewPage() {
  const { members, memberships, meetings, attendanceRecords } = await getOverviewData();
  const stats = buildAdminDashboardStats({ members, memberships, meetings, attendanceRecords });
  const requestOrigin = await getRequestOrigin();

  return (
    <>
      <div className="admin-stats" aria-label="Admin summary">
        <article><span>{stats.totalMembers}</span><p>Total members</p></article>
        <article><span>{stats.activeMembers}</span><p>Active memberships</p></article>
        <article><span>{stats.calendarActivities}</span><p>Calendar activities</p></article>
        <article><span>{stats.attendanceRecords}</span><p>Attendance check-ins</p></article>
      </div>
      <AdminEntryForms members={members} meetings={meetings} sections={["attendance"]} />
      <AttendanceQrPanel origin={requestOrigin} />
    </>
  );
}
