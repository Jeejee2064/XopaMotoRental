// lib/supabase/bookings.js — client-side helpers around the two public RPCs
// and the public `motorcycles` read. Xopa only has one model/location for
// now (RX250 / Panama City) but these keep the (model, location) signature
// from Overland so adding a second model or location later is a data change,
// not a rewrite.
import { supabase } from './client';

export async function checkBikesAvailableByModel(startDate, endDate, model, location = null) {
  try {
    if (!startDate || !endDate || !model) return 0;
    const fmt = (d) => (d instanceof Date ? d.toISOString().split('T')[0] : d);
    const { data, error } = await supabase.rpc('check_bikes_available_by_model', {
      p_start_date: fmt(startDate),
      p_end_date: fmt(endDate),
      p_model: model,
      p_location: location
    });
    if (error) {
      console.error('checkBikesAvailableByModel error:', error);
      return 0;
    }
    return data || 0;
  } catch (err) {
    console.error('checkBikesAvailableByModel exception:', err);
    return 0;
  }
}

/**
 * Returns { '2026-03-01': 2, '2026-03-02': 1, … } — booked-bike count per day.
 */
export async function checkBikesAvailabilityRangeByModel(model, location = null) {
  try {
    if (!model) return {};
    const { data, error } = await supabase.rpc('check_bikes_availability_range_by_model', {
      p_model: model,
      p_location: location
    });
    if (error) {
      console.error('checkBikesAvailabilityRangeByModel error:', error);
      return {};
    }
    const map = {};
    (data || []).forEach(({ date_key, booked_count }) => {
      map[date_key] = booked_count;
    });
    return map;
  } catch (err) {
    console.error('checkBikesAvailabilityRangeByModel exception:', err);
    return {};
  }
}

export async function getFleetSize(model, location) {
  try {
    if (!model || !location) return 0;
    const { count, error } = await supabase
      .from('motorcycles')
      .select('id', { count: 'exact', head: true })
      .eq('model', model)
      .eq('location', location)
      .eq('is_available', true);
    if (error) {
      console.error('getFleetSize error:', error);
      return 0;
    }
    return count || 0;
  } catch (err) {
    console.error('getFleetSize exception:', err);
    return 0;
  }
}

// ── Admin-only helpers below ─────────────────────────────────────────────
// `motorcycles` has an anon SELECT policy so getAllMotorcycles works
// straight from the browser like the public helpers above, but the
// calendar/bookings reads join in customer PII (bookings, riders) that the
// anon key has no table access to — those go through the session-gated
// /api/admin/* routes instead (mirrors Overland's post-RLS-hardening split).

export async function getAllMotorcycles() {
  const { data, error } = await supabase
    .from('motorcycles')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching motorcycles:', error);
    throw error;
  }

  return data;
}

// Powers the admin calendar (components/MotorcycleCalendar.js). Goes through
// /api/admin/motorcycle-calendar (service-role, session-authenticated) since
// it merges in booking/rider contact details.
export async function getMotorcycleCalendarWithPhone(startDate = null, endDate = null) {
  const params = new URLSearchParams();
  if (startDate) params.set('start_date', startDate);
  if (endDate) params.set('end_date', endDate);

  const res = await fetch(`/api/admin/motorcycle-calendar?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) {
    console.error('Error fetching motorcycle calendar:', data.error);
    throw new Error(data.error || 'Failed to fetch motorcycle calendar');
  }
  return data.calendar || [];
}

// Admin bookings list. Goes through /api/admin/bookings (service-role,
// session-authenticated) instead of querying `bookings` directly with the
// anon key.
export async function getAllBookings() {
  const res = await fetch('/api/admin/bookings');
  const data = await res.json();
  if (!res.ok) {
    console.error('Error fetching bookings:', data.error);
    throw new Error(data.error || 'Failed to fetch bookings');
  }
  return data.bookings || [];
}
