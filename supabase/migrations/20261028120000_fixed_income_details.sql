-- ============================================================================
-- Renda fixa detalhada + taxas de mercado (CDI/IPCA)
-- ----------------------------------------------------------------------------
-- Dá ao investimento os campos que fazem diferença em renda fixa (instituição,
-- classe, indexador, liquidez, vencimento, garantia FGC, tipo de IR) para o app
-- entender o ativo e calcular a taxa líquida correta. E cria uma tabela com as
-- taxas de mercado (CDI e IPCA) por usuário, usada para converter "100% do CDI"
-- e "IPCA + x%" em taxa real.
-- ============================================================================

-- Campos de renda fixa no investimento (todos opcionais; não quebram o que já existe).
alter table public.investments
  add column if not exists institution   text,                       -- banco/corretora
  add column if not exists asset_class    text,                       -- ex.: Renda Fixa Pós-Fixada
  add column if not exists indexer        text    not null default 'none', -- cdi_percent | cdi_plus | ipca_plus | prefixado | selic | poupanca | none
  add column if not exists indexer_value  numeric not null default 0, -- o "x": 100 (% do CDI), 6 (IPCA+6), 12 (pré 12% a.a.)
  add column if not exists liquidity      text,                       -- ex.: Diária, No vencimento, D+1
  add column if not exists maturity_date  date,                       -- vencimento (usado na faixa de IR)
  add column if not exists fgc            boolean not null default false, -- coberto pelo FGC
  add column if not exists ir_type        text    not null default 'renda_fixa'; -- renda_fixa | isento | acoes_fii | custom

-- Taxas de mercado por usuário (uma linha por pessoa). Buscadas online e/ou
-- ajustadas manualmente. Valores em % ao ano.
create table if not exists public.user_market_rates (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  cdi_annual  numeric not null default 10.65, -- CDI % a.a.
  ipca_annual numeric not null default 4.5,   -- IPCA (12 meses) % a.a.
  updated_at  timestamptz not null default now()
);

alter table public.user_market_rates enable row level security;

-- Cada pessoa só enxerga e mexe na própria linha.
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'user_market_rates' and policyname = 'own_market_rates_select') then
    create policy own_market_rates_select on public.user_market_rates for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'user_market_rates' and policyname = 'own_market_rates_insert') then
    create policy own_market_rates_insert on public.user_market_rates for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'user_market_rates' and policyname = 'own_market_rates_update') then
    create policy own_market_rates_update on public.user_market_rates for update using (auth.uid() = user_id);
  end if;
end $$;
