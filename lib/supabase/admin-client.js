// Server-only client using the service role key — bypasses RLS. Never import
// this from a 'use client' component; only from route handlers.
import { createClient } from '@supabase/supabase-js';

export function getSupabaseAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}
