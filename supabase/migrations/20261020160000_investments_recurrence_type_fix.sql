-- O formulário envia 'weeks'/'months'/'years' (mesmo padrão do fluxo), mas a
-- constraint só aceitava 'weekly'/'monthly'/'yearly'. Passa a aceitar os dois
-- (e nulo), corrigindo o erro ao criar investimento com aporte recorrente.
alter table public.investments
  drop constraint if exists investments_recurrence_type_check;

alter table public.investments
  add constraint investments_recurrence_type_check
  check (recurrence_type is null or recurrence_type = any (array[
    'weeks','months','years',
    'weekly','monthly','yearly'
  ]));
