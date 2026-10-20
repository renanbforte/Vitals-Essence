-- Guarda a posição e o total da parcela em cada lançamento, para o rótulo
-- (ex.: "2/12") não quebrar quando uma parcela é apagada.
alter table public.financial_transactions
  add column if not exists installment_index int,
  add column if not exists installment_total int;

-- Preenche os já existentes com a numeração atual de cada série.
with ranked as (
  select
    id,
    row_number() over (partition by coalesce(parent_transaction_id, id) order by date, created_at) as idx,
    count(*) over (partition by coalesce(parent_transaction_id, id)) as tot
  from public.financial_transactions
  where is_recurring = true or parent_transaction_id is not null
)
update public.financial_transactions t
set installment_index = r.idx, installment_total = r.tot
from ranked r
where r.id = t.id and t.installment_index is null;
