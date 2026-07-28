
-- 1. Centros de Custo
CREATE TABLE public.cost_centers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own cost centers" ON public.cost_centers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cost centers" ON public.cost_centers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cost centers" ON public.cost_centers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cost centers" ON public.cost_centers FOR DELETE USING (auth.uid() = user_id);

-- 2. Lançamentos Financeiros (entradas e saídas, com recorrência)
CREATE TABLE public.financial_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  cost_center_id UUID REFERENCES public.cost_centers(id) ON DELETE SET NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_type TEXT CHECK (recurrence_type IN ('weekly', 'monthly', 'yearly', 'custom')),
  recurrence_interval INTEGER, -- for custom: every N days
  recurrence_end_date DATE,
  parent_transaction_id UUID REFERENCES public.financial_transactions(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON public.financial_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.financial_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.financial_transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON public.financial_transactions FOR DELETE USING (auth.uid() = user_id);

-- 3. Reserva de Segurança
CREATE TABLE public.financial_safety (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  reserve_amount NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.financial_safety ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own safety" ON public.financial_safety FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own safety" ON public.financial_safety FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own safety" ON public.financial_safety FOR UPDATE USING (auth.uid() = user_id);

-- 4. Categorias de Investimento
CREATE TABLE public.investment_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.investment_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own inv categories" ON public.investment_categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own inv categories" ON public.investment_categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own inv categories" ON public.investment_categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own inv categories" ON public.investment_categories FOR DELETE USING (auth.uid() = user_id);

-- 5. Investimentos
CREATE TABLE public.investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category_id UUID REFERENCES public.investment_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  current_value NUMERIC NOT NULL DEFAULT 0,
  tracking_mode TEXT NOT NULL DEFAULT 'cumulative' CHECK (tracking_mode IN ('cumulative', 'real_adjustment')),
  is_recurring_contribution BOOLEAN NOT NULL DEFAULT false,
  recurring_amount NUMERIC,
  recurrence_type TEXT CHECK (recurrence_type IN ('weekly', 'monthly', 'yearly')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own investments" ON public.investments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own investments" ON public.investments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own investments" ON public.investments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own investments" ON public.investments FOR DELETE USING (auth.uid() = user_id);

-- 6. Histórico de Investimentos (snapshots)
CREATE TABLE public.investment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  investment_id UUID NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
  value NUMERIC NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL DEFAULT 'snapshot' CHECK (type IN ('snapshot', 'contribution', 'withdrawal')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.investment_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own inv history" ON public.investment_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own inv history" ON public.investment_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own inv history" ON public.investment_history FOR DELETE USING (auth.uid() = user_id);

-- 7. Metas Financeiras
CREATE TABLE public.financial_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC NOT NULL DEFAULT 0,
  deadline DATE,
  investment_id UUID REFERENCES public.investments(id) ON DELETE SET NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own goals" ON public.financial_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON public.financial_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.financial_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.financial_goals FOR DELETE USING (auth.uid() = user_id);

-- Triggers para updated_at
CREATE TRIGGER update_cost_centers_updated_at BEFORE UPDATE ON public.cost_centers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_financial_transactions_updated_at BEFORE UPDATE ON public.financial_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_financial_safety_updated_at BEFORE UPDATE ON public.financial_safety FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON public.investments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_financial_goals_updated_at BEFORE UPDATE ON public.financial_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes para performance
CREATE INDEX idx_financial_transactions_user_date ON public.financial_transactions(user_id, date);
CREATE INDEX idx_financial_transactions_recurring ON public.financial_transactions(user_id, is_recurring);
CREATE INDEX idx_investments_user ON public.investments(user_id);
CREATE INDEX idx_investment_history_user_date ON public.investment_history(user_id, date);
CREATE INDEX idx_financial_goals_user ON public.financial_goals(user_id);
