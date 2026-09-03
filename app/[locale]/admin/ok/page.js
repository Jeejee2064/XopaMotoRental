import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/admin-auth';
import { routing } from '@/routing';
import AdminDashboardClient from '@/components/admin/AdminDashboardClient';

export default async function AdminOkPage({ params }) {
  const { locale } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const { valid } = await verifyAdminSessionToken(token);

  if (!valid) {
    const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
    redirect(`${prefix}/admin`);
  }

  return <AdminDashboardClient />;
}
