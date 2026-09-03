-- XOPA Moto Rental — database schema
--
-- Mirrors the shape of Overland Motorcycles' Supabase schema (same owners,
-- same booking/payment architecture), simplified for Xopa's current scope:
-- one location (Panama City) and one model (SPI RX250) to start, but the
-- tables are generic enough to grow into more models/locations without a
-- migration. Overland's own repo has no schema.sql — this file is that
-- missing piece, kept here so the schema is reproducible and versioned.
--
-- Run once against a fresh Supabase project:
--   psql "$DATABASE_URL" -f supabase/schema.sql
--
-- IMPORTANT: running this via psql (or any direct connection) instead of the
-- Supabase SQL Editor does NOT automatically refresh PostgREST's schema
-- cache — new/changed functions can be invisible to the REST API (RPC calls
-- from the app fail) until you tell it to reload:
--   psql "$DATABASE_URL" -c "NOTIFY pgrst, 'reload schema';"
-- Run that after applying this file (and after any future psql-applied
-- migration) or restart the project's API from the dashboard instead.

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- motorcycles — the physical fleet
-- ============================================================
create table if not exists public.motorcycles (
  id uuid primary key default gen_random_uuid(),
  name text not null,                 -- e.g. "RX250 #1", unit label for admin/calendar
  brand text not null default 'SPI',
  model text not null default 'RX250',
  location text not null default 'Panama City',
  is_available boolean not null default true,
  km integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- bookings — one row per customer reservation
-- ============================================================
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),

  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  country text,

  start_date date not null,
  end_date date not null,
  bike_quantity integer not null default 1,
  motorcycle_model text not null default 'RX250',
  pickup_location text not null default 'Panama City',

  total_price numeric(10, 2),
  down_payment numeric(10, 2),
  deposit numeric(10, 2),

  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'failed', 'fully paid', 'cancelled')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed')),
  paid boolean not null default false,
  webhook_received boolean not null default false,
  pending_verification boolean not null default false,

  -- PagueloFacil integration (mirrors Overland's shape; not wired for Xopa
  -- yet — no PAGUELOFACIL_CCLW merchant key provisioned for this brand).
  paguelofacil_token text,
  paguelofacil_cclw text,
  paguelofacil_transaction_id text,
  auth_status text,
  auth_count integer not null default 0,
  auth_transaction_id text,
  auth_paid_at timestamptz,
  auth_link_sent_at timestamptz,
  balance_status text,
  balance_transaction_id text,
  balance_paid_at timestamptz,
  balance_link_sent_at timestamptz,
  payment_mail_sent_at timestamptz,

  special_requests text,
  important_note text,
  hear_about_us text,
  assignment_shortage boolean not null default false,

  created_at timestamptz not null default now()
);

create index if not exists bookings_date_range_idx on public.bookings (start_date, end_date);
create index if not exists bookings_status_idx on public.bookings (status);

-- ============================================================
-- booking_riders — extra riders on a multi-bike booking
-- ============================================================
create table if not exists public.booking_riders (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  rider_index integer not null default 0,
  first_name text,
  last_name text,
  email text,
  phone text
);

create index if not exists booking_riders_booking_id_idx on public.booking_riders (booking_id);

-- ============================================================
-- booking_motorcycles — which physical bike(s) got assigned
-- ============================================================
create table if not exists public.booking_motorcycles (
  booking_id uuid not null references public.bookings(id) on delete cascade,
  motorcycle_id uuid not null references public.motorcycles(id) on delete cascade,
  primary key (booking_id, motorcycle_id)
);

create index if not exists booking_motorcycles_motorcycle_id_idx on public.booking_motorcycles (motorcycle_id);

-- ============================================================
-- messages — contact form submissions
-- ============================================================
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  message text not null,
  status text not null default 'unread'
    check (status in ('unread', 'read', 'replied')),
  read_at timestamptz,
  replied_at timestamptz,
  admin_notes text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- promo_codes
-- ============================================================
create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  active boolean not null default true,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- motorcycle_calendar — read-only view for the admin calendar
-- ============================================================
create or replace view public.motorcycle_calendar as
select
  m.id as motorcycle_id,
  m.name as motorcycle_name,
  m.model,
  m.location,
  bm.booking_id,
  b.start_date,
  b.end_date,
  b.status,
  b.first_name,
  b.last_name,
  b.phone,
  b.email
from public.motorcycles m
join public.booking_motorcycles bm on bm.motorcycle_id = m.id
join public.bookings b on b.id = bm.booking_id;

-- ============================================================
-- RPC: check_bikes_available_by_model
-- Count of a given model, at a given location, with zero overlapping
-- active bookings across [p_start_date, p_end_date].
-- ============================================================
create or replace function public.check_bikes_available_by_model(
  p_start_date date,
  p_end_date date,
  p_model text,
  p_location text
) returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.motorcycles m
  where m.model = p_model
    and m.location = p_location
    and m.is_available = true
    and not exists (
      select 1
      from public.booking_motorcycles bm
      join public.bookings b on b.id = bm.booking_id
      where bm.motorcycle_id = m.id
        and b.status in ('pending', 'confirmed', 'fully paid')
        and b.start_date <= p_end_date
        and b.end_date >= p_start_date
    );
$$;

-- ============================================================
-- RPC: check_bikes_availability_range_by_model
-- Per-day booked-count for a model/location, for the next 90 days —
-- powers the front-end availability calendar.
-- ============================================================
create or replace function public.check_bikes_availability_range_by_model(
  p_model text,
  p_location text
) returns table (date_key date, booked_count integer)
language sql
stable
security definer
set search_path = public
as $$
  with days as (
    select generate_series(current_date, current_date + interval '90 days', interval '1 day')::date as date_key
  ),
  fleet_size as (
    select count(*)::integer as total
    from public.motorcycles
    where model = p_model and location = p_location and is_available = true
  )
  select
    d.date_key,
    (
      select count(distinct bm.motorcycle_id)::integer
      from public.booking_motorcycles bm
      join public.bookings b on b.id = bm.booking_id
      join public.motorcycles m on m.id = bm.motorcycle_id
      where m.model = p_model
        and m.location = p_location
        and b.status in ('pending', 'confirmed', 'fully paid')
        and b.start_date <= d.date_key
        and b.end_date >= d.date_key
    ) as booked_count
  from days d;
$$;

-- ============================================================
-- Row Level Security — locked down by default.
-- All reads/writes to bookings/riders/messages/promo_codes happen through
-- server-side API routes using the service_role key (which bypasses RLS),
-- same as Overland. No anon policies are granted on those tables, so the
-- public anon key can't read customer PII directly from the browser.
--
-- `motorcycles` is the one exception: it's non-sensitive fleet data (name,
-- model, location, availability) and the public fleet/availability UI reads
-- it directly with the anon key, so it gets a public SELECT policy. The two
-- RPC functions above are `security definer` so they can still count across
-- `bookings`/`booking_motorcycles` (RLS-locked) without exposing any row.
-- ============================================================
alter table public.motorcycles enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_riders enable row level security;
alter table public.booking_motorcycles enable row level security;
alter table public.messages enable row level security;
alter table public.promo_codes enable row level security;

drop policy if exists "motorcycles are publicly readable" on public.motorcycles;
create policy "motorcycles are publicly readable"
  on public.motorcycles for select
  using (true);

grant execute on function public.check_bikes_available_by_model(date, date, text, text) to anon, authenticated;
grant execute on function public.check_bikes_availability_range_by_model(text, text) to anon, authenticated;
