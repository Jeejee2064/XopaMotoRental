import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin-client';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/admin-auth';

export const runtime = 'nodejs';

// Single location for now, so `location` isn't editable here (unlike
// Overland's version) — just availability and odometer.
const ALLOWED_FIELDS = ['is_available', 'km'];

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing motorcycle ID' }, { status: 400 });
    }

    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const { valid } = await verifyAdminSessionToken(token);
    if (!valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const updates = {};
    for (const field of ALLOWED_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(body, field)) updates[field] = body[field];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('motorcycles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating motorcycle:', error);
      return NextResponse.json({ error: 'Failed to update motorcycle' }, { status: 500 });
    }

    return NextResponse.json({ motorcycle: data });
  } catch (err) {
    console.error('Error in PATCH /api/admin/motorcycles/[id]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
