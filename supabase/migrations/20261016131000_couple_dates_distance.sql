-- Distância aproximada (km) até o local, para ordenar a lista por "mais perto/longe".
alter table public.couple_dates
  add column if not exists distance_km numeric;
