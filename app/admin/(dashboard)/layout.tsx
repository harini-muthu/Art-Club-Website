import { signOutAdmin } from "@/app/admin/actions";
import { AdminDashboardNotice } from "@/components/admin-dashboard-notice";
import { AdminNavigation } from "@/components/admin-navigation";
import { getAuthorizedOfficerProfile } from "@/lib/admin-dashboard";

export default async function AdminDashboardLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const officerProfile = await getAuthorizedOfficerProfile();

  return (
    <section className="admin-shell">
      <div className="admin-toolbar">
        <div>
          <p className="eyebrow">Officer dashboard</p>
          <h1>Club admin</h1>
          <p>
            Signed in as {officerProfile.name} ({officerProfile.role}).
          </p>
        </div>
        <form action={signOutAdmin}>
          <button className="button secondary" type="submit">
            Sign out
          </button>
        </form>
      </div>
      <AdminNavigation />
      <AdminDashboardNotice />
      {children}
    </section>
  );
}
