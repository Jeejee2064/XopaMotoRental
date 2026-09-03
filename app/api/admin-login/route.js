import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, createAdminSessionToken, safeCompare } from '@/lib/admin-auth';

export async function POST(request) {
  const { password } = await request.json();

  const ok = Boolean(password) && Boolean(process.env.PSWD_ADMIN) && safeCompare(password, process.env.PSWD_ADMIN);
  if (!ok) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const { token, maxAge } = await createAdminSessionToken('admin');

  const res = NextResponse.json({ success: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  });

  return res;
}
