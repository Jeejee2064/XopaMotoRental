// Additional helper functions for admin booking management.
//
// Go through /api/admin/bookings/[id]/motorcycles (service-role,
// session-authenticated) instead of querying Supabase directly with the anon
// key from the browser — that data includes customer PII.

/**
 * Get motorcycles assigned to a specific booking
 */
export async function getBookingMotorcycles(bookingId) {
  const res = await fetch(`/api/admin/bookings/${bookingId}/motorcycles?type=assigned`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch booking motorcycles');
  return data.assigned || [];
}

/**
 * Get available motorcycles for a date range, excluding the current booking's own bikes.
 */
export async function getAvailableMotorcyclesForEdit(startDate, endDate, currentBookingId) {
  const params = new URLSearchParams({ type: 'available', start_date: startDate, end_date: endDate });

  const res = await fetch(`/api/admin/bookings/${currentBookingId}/motorcycles?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch available motorcycles');
  return data.available || [];
}
