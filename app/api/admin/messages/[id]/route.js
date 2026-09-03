import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin-client';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/admin-auth';

export const runtime = 'nodejs';

async function requireAdmin(request) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const { valid } = await verifyAdminSessionToken(token);
  return valid;
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing message ID' }, { status: 400 });
    }
    if (!(await requireAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, adminNotes } = await request.json();

    let updates;
    if (action === 'markRead') {
      updates = { status: 'read', read_at: new Date().toISOString() };
    } else if (action === 'markReplied') {
      updates = { status: 'replied', replied_at: new Date().toISOString(), admin_notes: adminNotes || null };
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('messages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating message:', error);
      return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
    }

    return NextResponse.json({ message: data });
  } catch (err) {
    console.error('Error in PATCH /api/admin/messages/[id]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing message ID' }, { status: 400 });
    }
    if (!(await requireAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('messages').delete().eq('id', id);
    if (error) {
      console.error('Error deleting message:', error);
      return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error in DELETE /api/admin/messages/[id]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
