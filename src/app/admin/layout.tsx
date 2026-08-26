import { requireAdmin } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Guards every /admin route, including client-component pages like /admin/new
  await requireAdmin();
  return <>{children}</>;
}
