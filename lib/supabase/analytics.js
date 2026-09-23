// Analytics fetch helper for the admin dashboard's Analytics tab. Goes
// through the server API route (service-role client) rather than the anon
// Supabase client — analytics_events has no anon SELECT policy (see
// supabase/schema.sql).

export async function getAnalyticsSummary(days = 30) {
  const res = await fetch(`/api/admin/analytics?days=${days}`);
  const data = await res.json();
  if (!res.ok) {
    console.error('Error fetching analytics:', data.error);
    throw new Error(data.error || 'Failed to fetch analytics');
  }
  return data;
}
