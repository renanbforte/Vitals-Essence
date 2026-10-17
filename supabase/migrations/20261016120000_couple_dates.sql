-- Lista de encontros do casal (bucket list de dates): ideias -> planejados -> vividos.
create table public.couple_dates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null default 'romantico',
  status text not null default 'idea' check (status in ('idea','planned','done')),
  location text,
  how_to text,
  notes text,
  items jsonb not null default '[]'::jsonb,
  schedule jsonb not null default '[]'::jsonb,
  cost_estimate numeric,
  planned_date date,
  done_date date,
  rating int check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.couple_dates to authenticated;
grant all on public.couple_dates to service_role;

create index idx_couple_dates_user on public.couple_dates(user_id, status, created_at desc);

alter table public.couple_dates enable row level security;

create policy "Users manage own couple dates" on public.couple_dates
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger update_couple_dates_updated_at
  before update on public.couple_dates
  for each row execute function public.update_updated_at_column();
