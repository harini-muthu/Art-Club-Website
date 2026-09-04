import { AdminDashboardShell } from "@/components/admin-dashboard-shell";

export default async function AdminDashboardLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return <AdminDashboardShell>{children}</AdminDashboardShell>;
}
