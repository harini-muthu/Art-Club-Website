import { AdminEntryForms } from "@/components/admin-entry-forms";
import { MembershipsTable } from "@/components/memberships-table";
import { GuestsTable } from "@/components/guests-table";
import { archiveGuest, archiveGuestsForSemester, deleteMember, updateGuest, updateMemberWithMembership } from "@/app/admin/actions";
import { getMemberAttendanceCount, getMembershipStatus } from "@/lib/admin-data";
import { getGuestAttendanceCount } from "@/lib/guest-data";
import { getMembershipsData, latestMembershipForMember } from "@/lib/admin-dashboard";

export default async function MembershipsPage() {
  const { members, memberships, attendanceRecords, guests } = await getMembershipsData();

  return (
    <>
      <AdminEntryForms members={members} meetings={[]} sections={["member"]} />
      <section className="admin-panel">
        <MembershipsTable
          deleteMember={deleteMember}
          updateMember={updateMemberWithMembership}
          members={members.map((member) => {
            const membership = latestMembershipForMember(member.id, memberships);
            const attendanceCount = getMemberAttendanceCount(member.id, attendanceRecords);
            return {
              id: member.id,
              fullName: member.full_name ?? "",
              email: member.email ?? "",
              membershipId: membership?.id ?? "",
              membershipType: membership?.membership_type ?? "semester",
              startsOn: membership?.starts_on ?? "",
              expiresOn: membership?.expires_on ?? "",
              paidAmount: membership?.paid_amount ?? "",
              notes: member.notes ?? "",
              membershipStatus: membership ? getMembershipStatus(membership.expires_on) : "no membership",
              attendanceCount
            };
          })}
        />
      </section>
      <section className="admin-panel"><GuestsTable archiveGuest={archiveGuest} guests={guests.map((guest) => ({ id: guest.id, fullName: guest.full_name ?? "", notes: guest.notes ?? "", attendanceCount: getGuestAttendanceCount(guest.id, attendanceRecords) }))} resetGuests={archiveGuestsForSemester} updateGuest={updateGuest} /></section>
    </>
  );
}
