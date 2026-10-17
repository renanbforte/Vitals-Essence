-- Marca qual encontro do casal é o "Próximo" (fixado no topo da lista).
alter table public.couple_dates
  add column if not exists is_next boolean not null default false;

-- No máximo um "próximo" por usuário.
create unique index if not exists uq_couple_dates_one_next
  on public.couple_dates(user_id) where is_next;
