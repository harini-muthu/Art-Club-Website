"use client";

import { useRef, useState } from "react";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

type MemberAction = (formData: FormData) => void | Promise<void>;
type FormAction = string | MemberAction;

export type MembershipTableMember = {
  id: string;
  fullName: string;
  email: string;
  membershipId: string;
  membershipType: string;
  startsOn: string;
  expiresOn: string;
  paidAmount: number | string | null;
  notes: string;
  membershipStatus: string;
  attendanceCount: number;
};

type MembershipsTableProps = {
  deleteMember: FormAction;
  members: MembershipTableMember[];
  updateMember: FormAction;
};

function PencilIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m4 16.5-.8 4.3 4.3-.8L19 8.5 15.5 5 4 16.5Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /><path d="m13.5 7 3.5 3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" /></svg>;
}

function SaveIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 3h12l3 3v15H5V3Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" /><path d="M8 3v6h8V3M8 21v-7h8v7" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" /></svg>;
}

function TrashIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 7h16M10 11v6m4-6v6M9 7l1-3h4l1 3m-9 0 1 14h10l1-14" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>;
}

export function MembershipsTable({ deleteMember, members, updateMember }: MembershipsTableProps) {
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const updateForms = useRef(new Map<string, HTMLFormElement>());
  const normalizedSearch = memberSearch.trim().toLowerCase();
  const visibleMembers = normalizedSearch
    ? members.filter((member) =>
        member.fullName.toLowerCase().includes(normalizedSearch) ||
        member.email.toLowerCase().includes(normalizedSearch)
      )
    : members;

  return (
    <>
      <div className="admin-panel-heading">
        <h2>Members</h2>
        <form
          className="admin-search-form"
          onSubmit={(event) => event.preventDefault()}
        >
          <input
            aria-label="Search members"
            name="memberSearch"
            onChange={(event) => setMemberSearch(event.target.value)}
            placeholder="Search members"
            type="search"
            value={memberSearch}
          />
          <button className="button secondary" type="submit">Search</button>
          {memberSearch ? <button className="button secondary" onClick={() => setMemberSearch("")} type="button">Clear</button> : null}
        </form>
      </div>
      {visibleMembers.length ? <div className="members-table-scroll">
      <table className="members-table" aria-label="Members">
        <thead>
          <tr>
            <th scope="col">Member</th>
            <th scope="col">Email</th>
            <th scope="col">Membership</th>
            <th scope="col">Amount</th>
            <th scope="col">Status</th>
            <th scope="col">Attendance</th>
            <th scope="col">Notes</th>
            <th scope="col"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {visibleMembers.map((member) => {
            const isEditing = editingMemberId === member.id;
            const formId = `member-form-${member.id}`;

            return (
              <tr className={isEditing ? "is-editing" : undefined} key={member.id}>
                <td>
                  <label className="sr-only" htmlFor={`full-name-${member.id}`}>Full name for {member.fullName}</label>
                  <input defaultValue={member.fullName} disabled={!isEditing} form={formId} id={`full-name-${member.id}`} name="fullName" required type="text" />
                </td>
                <td>
                  <label className="sr-only" htmlFor={`email-${member.id}`}>Email for {member.fullName}</label>
                  <input defaultValue={member.email} disabled={!isEditing} form={formId} id={`email-${member.id}`} name="email" type="email" />
                </td>
                <td>
                  <label className="sr-only" htmlFor={`membership-type-${member.id}`}>Membership type for {member.fullName}</label>
                  <select defaultValue={member.membershipType || "semester"} disabled={!isEditing} form={formId} id={`membership-type-${member.id}`} name="membershipType" required>
                    <option value="semester">Semester</option>
                    <option value="year">Year</option>
                  </select>
                </td>
                <td>
                  <label className="sr-only" htmlFor={`paid-amount-${member.id}`}>Paid amount for {member.fullName}</label>
                  <input defaultValue={member.paidAmount ?? ""} disabled={!isEditing} form={formId} id={`paid-amount-${member.id}`} min="0" name="paidAmount" step="0.01" type="number" />
                </td>
                <td><strong>{member.membershipStatus}</strong><span>{member.expiresOn || "No membership"}</span></td>
                <td>{member.attendanceCount}</td>
                <td>
                  <label className="sr-only" htmlFor={`notes-${member.id}`}>Notes for {member.fullName}</label>
                  <textarea defaultValue={member.notes} disabled={!isEditing} form={formId} id={`notes-${member.id}`} name="notes" rows={2} />
                </td>
                <td className="members-table-actions">
                  <div className="members-table-actions-inner">
                  <form
                    action={updateMember}
                    id={formId}
                    ref={(form) => {
                      if (form) {
                        updateForms.current.set(member.id, form);
                      } else {
                        updateForms.current.delete(member.id);
                      }
                    }}
                  >
                    <input name="memberId" type="hidden" value={member.id} />
                    <input name="membershipId" type="hidden" value={member.membershipId} />
                    <input name="originalMembershipType" type="hidden" value={member.membershipType} />
                    <input name="startsOn" type="hidden" value={member.startsOn} />
                    <input name="expiresOn" type="hidden" value={member.expiresOn} />
                  </form>
                  <button
                    aria-label={isEditing ? `Save ${member.fullName}` : `Edit ${member.fullName}`}
                    className="icon-button"
                    onClick={() => {
                      if (isEditing) {
                        updateForms.current.get(member.id)?.requestSubmit();
                      } else {
                        setEditingMemberId(member.id);
                      }
                    }}
                    title={isEditing ? `Save ${member.fullName}` : `Edit ${member.fullName}`}
                    type="button"
                  >
                    {isEditing ? <SaveIcon /> : <PencilIcon />}
                  </button>
                  <form action={deleteMember}>
                    <input name="memberId" type="hidden" value={member.id} />
                    <ConfirmSubmitButton aria-label={`Delete ${member.fullName}`} className="icon-button danger" message={`Delete ${member.fullName}? This cannot be undone.`} title={`Delete ${member.fullName}`}><TrashIcon /></ConfirmSubmitButton>
                  </form>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div> : <p className="admin-empty">No members match that search.</p>}
    </>
  );
}
