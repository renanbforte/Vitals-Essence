-- Investimentos: real x simulação, data de início, aporte recorrente e moeda estrangeira.
-- is_simulated: true = planejamento/simulação; false = investimento real.
-- start_date: data em que o investimento real começou (base para agendar aportes).
-- recurring_tx_id: id do lançamento recorrente de aporte criado no fluxo ao tornar real.
-- currency / foreign_amount / exchange_rate: para investimento em moeda estrangeira
--   (moeda, valor na moeda e cotação usada na compra; current_value fica em BRL).
ALTER TABLE public.investments
  ADD COLUMN IF NOT EXISTS is_simulated BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS recurring_tx_id UUID,
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'BRL',
  ADD COLUMN IF NOT EXISTS foreign_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC;
