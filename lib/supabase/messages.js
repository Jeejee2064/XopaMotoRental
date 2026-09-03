// Contact-form message helpers, for the admin dashboard's Messages tab.
//
// Go through server API routes rather than the anon Supabase client —
// `messages` holds contact-form submitters' name/email/phone and has no
// anon SELECT policy (see supabase/schema.sql).
//
// Note: the public contact page (app/[locale]/contact) is currently a plain
// mailto link, not a form — nothing writes to `messages` yet. This tab and
// its API route are ready for whenever that form ships.

// Get all messages (for admin dashboard)
export async function getAllMessages() {
  const res = await fetch('/api/admin/messages');
  const data = await res.json();
  if (!res.ok) {
    console.error('Error fetching messages:', data.error);
    throw new Error(data.error || 'Failed to fetch messages');
  }
  return data.messages || [];
}
