-- Run once in the Supabase SQL editor on the existing database.
alter table public.motorcycles add column if not exists plate text;

-- Existing bike ("RX250 #1") → real name + plate.
update public.motorcycles
set name = 'RX250 - MR0262', plate = 'MR0262'
where model = 'RX250' and (plate is null) and name = 'RX250 #1';

-- New bike: BMW G 310 GS.
insert into public.motorcycles (name, plate, brand, model, location, is_available, km)
select 'G310 GS - MJ5958', 'MJ5958', 'BMW', 'G310GS', 'Panama City', true, 0
where not exists (select 1 from public.motorcycles where plate = 'MJ5958');
