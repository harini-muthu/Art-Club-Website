"use client";

import { useState } from "react";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

type Guest = { id: string; fullName: string; notes: string; attendanceCount: number };
type Action = string | ((formData: FormData) => void | Promise<void>);

export function GuestsTable({ guests, updateGuest, archiveGuest, resetGuests }: { guests: Guest[]; updateGuest: Action; archiveGuest: Action; resetGuests: Action }) {
  const [search, setSearch] = useState("");
  const visible = guests.filter((guest) => `${guest.fullName} ${guest.notes}`.toLowerCase().includes(search.trim().toLowerCase()));
  return <>
    <div className="admin-panel-heading"><h2>Guests</h2><form className="admin-search-form" onSubmit={(event) => event.preventDefault()}><input aria-label="Search guests" onChange={(event) => setSearch(event.target.value)} placeholder="Search guests" type="search" value={search} /></form><form action={resetGuests}><ConfirmSubmitButton className="button danger" message="Archive all active guests for a new semester? Attendance history will remain.">Reset guest directory</ConfirmSubmitButton></form></div>
    {visible.length ? <div className="members-table-scroll"><table className="members-table" aria-label="Guests"><thead><tr><th>Guest</th><th>Attendance</th><th>Notes</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{visible.map((guest) => <tr key={guest.id}><td><form action={updateGuest}><input name="guestId" type="hidden" value={guest.id} /><input defaultValue={guest.fullName} name="fullName" required type="text" /><textarea defaultValue={guest.notes} name="notes" rows={2} /><button className="button secondary" type="submit">Save</button></form></td><td>{guest.attendanceCount}</td><td>{guest.notes}</td><td><form action={archiveGuest}><input name="guestId" type="hidden" value={guest.id} /><ConfirmSubmitButton className="button danger" message={`Archive ${guest.fullName}?`}>Archive</ConfirmSubmitButton></form></td></tr>)}</tbody></table></div> : <p className="admin-empty">No active guests.</p>}
  </>;
}
