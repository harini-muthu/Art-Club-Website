import Link from "next/link";
import { AdminEntryForms } from "@/components/admin-entry-forms";
import { MembershipsTable } from "@/components/memberships-table";
import { deleteMember, updateMemberWithMembership } from "@/app/admin/actions";
import { filterMembersBySearch, getMemberAttendanceCount, getMembershipStatus } from "@/lib/admin-data";
import { getMembershipsData, latestMembershipForMember } from "@/lib/admin-dashboard";

type MembershipsPageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MembershipsPage({ searchParams }: MembershipsPageProps) {
  const params = await searchParams;
  const memberSearch = firstSearchParam(params?.memberSearch) ?? "";
  const { members, memberships, attendanceRecords } = await getMembershipsData();
  const visibleMembers = filterMembersBySearch(members, memberSearch);

  return (
    <>
      <AdminEntryForms members={members} meetings={[]} sections={["member"]} />
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <h2>Members</h2>
          <form action="/admin/memberships" className="admin-search-form" method="get">
            <input aria-label="Search members" defaultValue={memberSearch} name="memberSearch" placeholder="Search members" type="search" />
            <button className="button secondary" type="submit">Search</button>
            {memberSearch ? <Link className="button secondary" href="/admin/memberships">Clear</Link> : null}
          </form>
        </div>
        {visibleMembers.length ? <MembershipsTable
          deleteMember={deleteMember}
          updateMember={updateMemberWithMembership}
          members={visibleMembers.map((member) => {
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
        /> : members.length ? <p className="admin-empty">No members match that search.</p> : <p className="admin-empty">No members yet.</p>}
      </section>
    </>
  );
}
