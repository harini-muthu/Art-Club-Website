"use client";

import { useRef, useState } from "react";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

type Guest = { id: string; fullName: string; schoolEmail: string; attendanceCount: number };
type GuestAction = string | ((formData: FormData) => void | Promise<void>);

type GuestsTableProps = {
  guests: Guest[];
  updateGuest: GuestAction;
  archiveGuest: GuestAction;
  resetGuests: GuestAction;
};

function PencilIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m4 16.5-.8 4.3 4.3-.8L19 8.5 15.5 5 4 16.5Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /><path d="m13.5 7 3.5 3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>;
}

function SaveIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 3h12l3 3v15H5V3Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" /><path d="M8 3v6h8V3M8 21v-7h8v7" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" /></svg>;
}

function ArchiveIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 7h16M10 11v6m4-6v6M9 7l1-3h4l1 14h10l1-14" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>;
}

export function GuestsTable({ guests, updateGuest, archiveGuest, resetGuests }: GuestsTableProps) {
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
  const [guestSearch, setGuestSearch] = useState("");
  const updateForms = useRef(new Map<string, HTMLFormElement>());
  const normalizedSearch = guestSearch.trim().toLowerCase();
  const visibleGuests = normalizedSearch
    ? guests.filter((guest) => guest.fullName.toLowerCase().includes(normalizedSearch))
    : guests;

  return <>
    <div className="admin-panel-heading">
      <h2>Guests</h2>
      <form className="admin-search-form" onSubmit={(event) => event.preventDefault()}>
        <input aria-label="Search guests" onChange={(event) => setGuestSearch(event.target.value)} placeholder="Search guests" type="search" value={guestSearch} />
        <button className="button secondary" type="submit">Search</button>
        {guestSearch ? <button className="button secondary" onClick={() => setGuestSearch("")} type="button">Clear</button> : null}
      </form>
      <form action={resetGuests}>
        <ConfirmSubmitButton className="button danger" message="Archive all active guests for a new semester? Attendance history will remain.">Reset guest directory</ConfirmSubmitButton>
      </form>
    </div>
    {visibleGuests.length ? <div className="members-table-scroll">
      <table aria-label="Guests" className="members-table">
        <thead><tr><th scope="col">Guest</th><th scope="col">School Email</th><th scope="col">Attendance</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
        <tbody>{visibleGuests.map((guest) => {
          const isEditing = editingGuestId === guest.id;
          const formId = `guest-form-${guest.id}`;
          return <tr className={isEditing ? "is-editing" : undefined} key={guest.id}>
            <td>
              <label className="sr-only" htmlFor={`guest-name-${guest.id}`}>Full name for {guest.fullName}</label>
              <input defaultValue={guest.fullName} disabled={!isEditing} form={formId} id={`guest-name-${guest.id}`} name="fullName" required type="text" />
            </td>
            <td>
              <label className="sr-only" htmlFor={`guest-email-${guest.id}`}>School email for {guest.fullName}</label>
              <input defaultValue={guest.schoolEmail} disabled={!isEditing} form={formId} id={`guest-email-${guest.id}`} name="schoolEmail" required type="text" />
            </td>
            <td>{guest.attendanceCount}</td>
            <td className="members-table-actions"><div className="members-table-actions-inner">
              <form action={updateGuest} id={formId} ref={(form) => {
                if (form) updateForms.current.set(guest.id, form);
                else updateForms.current.delete(guest.id);
              }}>
                <input name="guestId" type="hidden" value={guest.id} />
              </form>
              <button aria-label={isEditing ? `Save ${guest.fullName}` : `Edit ${guest.fullName}`} className="icon-button" onClick={() => {
                if (isEditing) updateForms.current.get(guest.id)?.requestSubmit();
                else setEditingGuestId(guest.id);
              }} title={isEditing ? `Save ${guest.fullName}` : `Edit ${guest.fullName}`} type="button">
                {isEditing ? <SaveIcon /> : <PencilIcon />}
              </button>
              <form action={archiveGuest}>
                <input name="guestId" type="hidden" value={guest.id} />
                <ConfirmSubmitButton aria-label={`Archive ${guest.fullName}`} className="icon-button danger" message={`Archive ${guest.fullName}?`} title={`Archive ${guest.fullName}`}><ArchiveIcon /></ConfirmSubmitButton>
              </form>
            </div></td>
          </tr>;
        })}</tbody>
      </table>
    </div> : <p className="admin-empty">{guests.length ? "No guests match that search." : "No active guests."}</p>}
  </>;
}
