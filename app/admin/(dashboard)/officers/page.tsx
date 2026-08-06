import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { addOfficer, deleteOfficer, updateOfficer } from "@/app/admin/actions";
import {
  getAuthorizedOfficerProfile,
  getOfficersData
} from "@/lib/admin-dashboard";
import { isPresidentRole } from "@/lib/admin-auth";

export default async function OfficersPage() {
  const [officers, currentOfficer] = await Promise.all([
    getOfficersData(),
    getAuthorizedOfficerProfile()
  ]);
  const isPresident = isPresidentRole(currentOfficer.role);

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading"><h2>Officers</h2><p>Officer emails grant admin access and are not shown publicly.</p></div>
      {isPresident ? <form className="admin-entry-form inline" action={addOfficer}>
          <label>Name<input name="officerName" required type="text" /></label>
          <label>Title<input name="officerRole" required type="text" /></label>
          <label>Email<input name="officerEmail" required type="email" /></label>
          <label>Focus<textarea name="officerFocus" rows={3} /></label>
          <button className="button primary" type="submit">Add officer</button>
        </form> : null}
      {officers.length ? <div className="admin-list">
        {officers.map((officer) => {
          const canEdit = isPresident || officer.id === currentOfficer.id;

          return <article className="admin-row compact editable" key={officer.id}>
            <div className="admin-row-summary compact"><div><h3>{officer.name}</h3><p>{officer.role}</p></div><div><strong>{officer.email}</strong><p>{officer.focus || "No focus listed"}</p></div></div>
            {canEdit ? <div className="admin-row-actions">
              <details>
                <summary className="button secondary">Edit</summary>
                <form action={updateOfficer} className="admin-entry-form inline">
                  <input name="officerId" type="hidden" value={officer.id} />
                  <label>Name<input defaultValue={officer.name} name="officerName" required type="text" /></label>
                  {isPresident ? <label>Title<input defaultValue={officer.role} name="officerRole" required type="text" /></label> : <><input name="officerRole" type="hidden" value={officer.role} /><p>Title: {officer.role}</p></>}
                  <label>Email<input defaultValue={officer.email ?? ""} name="officerEmail" required type="email" /></label>
                  <label>Focus<textarea defaultValue={officer.focus ?? ""} name="officerFocus" rows={3} /></label>
                  <button className="button primary" type="submit">Save officer</button>
                </form>
              </details>
              {isPresident ? <form action={deleteOfficer}>
                <input name="officerId" type="hidden" value={officer.id} />
                <ConfirmSubmitButton className="button danger" message={`Delete ${officer.name ?? "this officer"}? They will lose admin access.`}>Delete</ConfirmSubmitButton>
              </form> : null}
            </div> : null}
          </article>;
        })}
      </div> : <p className="admin-empty">No officers yet.</p>}
    </section>
  );
}
