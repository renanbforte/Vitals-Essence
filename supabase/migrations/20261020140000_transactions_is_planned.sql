-- Marca um lançamento como "planejado" (hipótese, não real). Os existentes
-- ficam como reais (false). Independente do campo "paid".
alter table public.financial_transactions
  add column if not exists is_planned boolean not null default false;

create index if not exists idx_financial_transactions_planned
  on public.financial_transactions(user_id, is_planned);
