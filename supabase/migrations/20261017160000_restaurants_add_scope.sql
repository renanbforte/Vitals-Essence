-- Escopo do lugar no mapa: 'restaurant' (módulo Encontros) ou 'travel' (Viagens).
-- Permite reaproveitar a mesma tabela/mapa nos dois módulos, separando as listas.
alter table public.restaurants
  add column if not exists scope text not null default 'restaurant';

-- Índice ajustado para filtrar por escopo também.
drop index if exists idx_restaurants_user;
create index if not exists idx_restaurants_user_scope
  on public.restaurants(user_id, scope, status, created_at desc);
