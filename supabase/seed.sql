-- Starting fleet — one physical bike today. The booking flow (see
-- app/[locale]/booking/page.js) reads this count via getFleetSize() and
-- skips the "how many bikes" step whenever it's 1, so this is real data,
-- not a placeholder — add rows here (and re-run) the day a second bike
-- joins the fleet.
-- Safe to re-run: skips rows that already exist by name.
insert into public.motorcycles (name, brand, model, location, is_available, km)
select v.name, 'SPI', 'RX250', 'Panama City', true, 0
from (values
  ('RX250 #1')
) as v(name)
where not exists (
  select 1 from public.motorcycles m where m.name = v.name
);
