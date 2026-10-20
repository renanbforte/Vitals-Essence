-- Liga um investimento ao lançamento de "saída" (aporte inicial) criado no fluxo,
-- para que apagar o investimento remova também esse lançamento.
alter table public.investments
  add column if not exists entry_tx_id uuid;
