-- Mapa de restaurantes: lugares que o usuário quer conhecer ou já foi.
-- Cada restaurante guarda endereço, Instagram, link do Google Maps, preço médio
-- e as coordenadas (lat/lng) para aparecer no mapa.
create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null default 'japones',
  status text not null default 'want' check (status in ('want','visited')),
  address text,
  instagram text,
  maps_url text,
  price numeric,
  notes text,
  rating int check (rating between 1 and 5),
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.restaurants to authenticated;
grant all on public.restaurants to service_role;

create index idx_restaurants_user on public.restaurants(user_id, status, created_at desc);

alter table public.restaurants enable row level security;

create policy "Users manage own restaurants" on public.restaurants
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger update_restaurants_updated_at
  before update on public.restaurants
  for each row execute function public.update_updated_at_column();
