-- Metas financeiras: campos para projeção de juros compostos e simulador de aporte.
-- monthly_contribution: aporte mensal planejado para a meta (R$).
-- annual_rate: taxa de rendimento esperada ao ano, em fração (0.10 = 10% a.a.).
-- linked_to_portfolio: quando true, o progresso da meta acompanha o patrimônio
--   investido total em vez do valor manual current_amount.
ALTER TABLE public.financial_goals
  ADD COLUMN IF NOT EXISTS monthly_contribution NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS annual_rate NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS linked_to_portfolio BOOLEAN NOT NULL DEFAULT false;
