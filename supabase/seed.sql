-- Starting fleet — two physical bikes (model ids match siteConfig.fleet.models
-- in lib/site-config.js: 'RX250' and 'G310GS'). The booking flow reads the
-- per-model count via getFleetSize() and shows the quantity picker only for a
-- model with more than one bike. Add rows here (and re-run) when more bikes join.
-- Safe to re-run: skips rows that already exist by plate.
insert into public.motorcycles (name, plate, brand, model, location, is_available, km)
select v.name, v.plate, v.brand, v.model, 'Panama City', true, 0
from (values
  ('RX250 - MR0262',   'MR0262', 'SPI', 'RX250'),
  ('G310 GS - MJ5958', 'MJ5958', 'BMW', 'G310GS')
) as v(name, plate, brand, model)
where not exists (
  select 1 from public.motorcycles m where m.plate = v.plate
);
