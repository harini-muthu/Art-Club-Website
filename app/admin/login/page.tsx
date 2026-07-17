import { AdminLoginForm } from "@/app/admin/login/login-form";

export const metadata = {
  title: "Admin Login | Studio Collective"
};

type AdminLoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminLoginPage({
  searchParams
}: AdminLoginPageProps) {
  const params = await searchParams;
  const redirectReason = firstSearchParam(params?.reason) ?? null;

  return (
    <section className="admin-shell admin-login-page">
      <div className="admin-login-panel">
        <p className="eyebrow">Officer access</p>
        <h1>Admin login</h1>
        <p>
          Sign in with a Supabase officer account to manage members, activities,
          and attendance.
        </p>
        <AdminLoginForm redirectReason={redirectReason} />
      </div>
    </section>
  );
}
