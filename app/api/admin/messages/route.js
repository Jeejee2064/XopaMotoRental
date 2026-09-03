import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin-client';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/admin-auth';

export const runtime = 'nodejs';

// List contact-form messages for the admin dashboard.
export async function GET(request) {
  try {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const { valid } = await verifyAdminSessionToken(token);
    if (!valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // optional: e.g. 'unread'

    const supabase = getSupabaseAdmin();
    let query = supabase.from('messages').select('*').order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    return NextResponse.json({ messages: data || [] });
  } catch (err) {
    console.error('Error in GET /api/admin/messages:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
