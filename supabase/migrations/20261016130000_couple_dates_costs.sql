-- Custos detalhados do encontro: locais (cada um com valor) e custos do caminho
-- (gasolina, pedágio, estacionamento...). Cada item: {id, kind:'place'|'travel', label, amount}.
alter table public.couple_dates
  add column if not exists costs jsonb not null default '[]'::jsonb;
