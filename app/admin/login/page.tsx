import { AdminLoginForm } from "@/app/admin/login/login-form";

export const metadata = {
  title: "Admin Login | Studio Collective"
};

export default function AdminLoginPage() {
  return (
    <section className="admin-shell admin-login-page">
      <div className="admin-login-panel">
        <p className="eyebrow">Officer access</p>
        <h1>Admin login</h1>
        <p>
          Sign in with a Supabase officer account to manage members, activities,
          and attendance.
        </p>
        <AdminLoginForm />
      </div>
    </section>
  );
}
