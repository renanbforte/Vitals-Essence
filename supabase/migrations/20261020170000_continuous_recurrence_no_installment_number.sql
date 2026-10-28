-- ============================================================================
-- Recorrência CONTÍNUA não tem número de parcela
-- ----------------------------------------------------------------------------
-- Uma recorrência contínua (mensal, sem prazo) não deve mostrar "X/60": ela não
-- tem um total fixo de parcelas. Um backfill antigo gravou installment_total=60
-- nessas séries, fazendo a UI exibir frações. Aqui limpamos a numeração das
-- séries contínuas, deixando o número só para as parceladas (installments).
-- ============================================================================
update public.financial_transactions
set installment_index = null,
    installment_total = null
where recurrence_mode = 'continuous';
