-- ============================================================================
-- Trava contra duplicação de recorrências.
-- ----------------------------------------------------------------------------
-- As ocorrências "filhas" de uma recorrência apontam para o pai em
-- parent_transaction_id. Nunca pode existir mais de uma filha do mesmo pai na
-- mesma data. Este índice único garante isso no banco: se o app (qualquer
-- versão, inclusive uma antiga em cache/instalada) tentar inserir uma
-- ocorrência repetida — por concorrência entre telas, por exemplo — o banco
-- rejeita em vez de duplicar.
--
-- É PARCIAL (só quando parent_transaction_id não é nulo): os "pais" e os
-- lançamentos avulsos (parent nulo) não são afetados.
-- ============================================================================
create unique index if not exists ux_ft_parent_date
  on public.financial_transactions (user_id, parent_transaction_id, date)
  where parent_transaction_id is not null;
