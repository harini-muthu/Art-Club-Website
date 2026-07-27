import Link from "next/link";
import { AdminEntryForms } from "@/components/admin-entry-forms";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { deleteMember, updateMemberWithMembership } from "@/app/admin/actions";
import { filterMembersBySearch, getMemberAttendanceCount, getMembershipStatus } from "@/lib/admin-data";
import { formatAdminDate, getMembershipsData, latestMembershipForMember } from "@/lib/admin-dashboard";

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
        {visibleMembers.length ? <div className="admin-list">
          {visibleMembers.map((member) => {
            const membership = latestMembershipForMember(member.id, memberships);
            const attendanceCount = getMemberAttendanceCount(member.id, attendanceRecords);
            return <article className="admin-row editable" key={member.id}>
              <div className="admin-row-summary">
                <div><h3>{member.full_name}</h3><p>{member.email || "No email listed"}</p></div>
                <div><strong>{membership ? getMembershipStatus(membership.expires_on) : "no membership"}</strong><p>{membership ? `${membership.membership_type} through ${formatAdminDate(membership.expires_on)}` : "Add a membership term later"}</p></div>
                <div><strong>{attendanceCount}</strong><p>meetings attended</p></div>
              </div>
              <div className="admin-row-actions">
                <details>
                  <summary className="button secondary">Edit</summary>
                  <form action={updateMemberWithMembership} className="admin-entry-form inline">
                    <input name="memberId" type="hidden" value={member.id} />
                    <input name="membershipId" type="hidden" value={membership?.id ?? ""} />
                    <input name="originalMembershipType" type="hidden" value={membership?.membership_type ?? ""} />
                    <input name="startsOn" type="hidden" value={membership?.starts_on ?? ""} />
                    <input name="expiresOn" type="hidden" value={membership?.expires_on ?? ""} />
                    <label>Full name<input defaultValue={member.full_name ?? ""} name="fullName" required type="text" /></label>
                    <label>Email<input defaultValue={member.email ?? ""} name="email" type="email" /></label>
                    <div className="admin-form-grid">
                      <label>Paid for<select defaultValue={membership?.membership_type ?? "semester"} name="membershipType" required><option value="semester">Semester</option><option value="year">Year</option></select></label>
                      <label>Amount<input defaultValue={membership?.paid_amount ?? ""} min="0" name="paidAmount" step="0.01" type="number" /></label>
                    </div>
                    <label>Notes<textarea defaultValue={member.notes ?? ""} name="notes" rows={3} /></label>
                    <button className="button primary" type="submit">Save member</button>
                  </form>
                </details>
                <form action={deleteMember}>
                  <input name="memberId" type="hidden" value={member.id} />
                  <ConfirmSubmitButton className="button danger" message={`Delete ${member.full_name ?? "this member"}? This cannot be undone.`}>Delete</ConfirmSubmitButton>
                </form>
              </div>
            </article>;
          })}
        </div> : members.length ? <p className="admin-empty">No members match that search.</p> : <p className="admin-empty">No members yet.</p>}
      </section>
    </>
  );
}
