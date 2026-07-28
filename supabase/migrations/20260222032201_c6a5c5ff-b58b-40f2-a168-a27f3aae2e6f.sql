
-- Aba 2: Movimentação Diária
CREATE TABLE public.crypto_daily_moves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT now(),
  time TEXT,
  coin TEXT NOT NULL,
  short_qty NUMERIC,
  short_entry_price NUMERIC,
  short_current_price NUMERIC,
  short_pnl_usd NUMERIC,
  short_pnl_pct NUMERIC,
  short_leverage NUMERIC,
  short_initial_margin NUMERIC,
  short_maintenance_margin NUMERIC,
  short_status TEXT,
  long_qty NUMERIC,
  long_entry_price NUMERIC,
  long_current_price NUMERIC,
  long_pnl_usd NUMERIC,
  long_pnl_pct NUMERIC,
  long_leverage NUMERIC,
  long_initial_margin NUMERIC,
  long_maintenance_margin NUMERIC,
  long_status TEXT,
  total_pnl_coin_usdt NUMERIC,
  total_value_coin_usdt NUMERIC,
  usd_brl_rate NUMERIC,
  methodology TEXT,
  exchange TEXT NOT NULL DEFAULT 'Bybit',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crypto_daily_moves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own crypto_daily_moves" ON public.crypto_daily_moves
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_crypto_daily_moves_updated_at
  BEFORE UPDATE ON public.crypto_daily_moves
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Aba 3: Metodologia
CREATE TABLE public.crypto_strategies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  coin TEXT NOT NULL,
  strategy_name TEXT NOT NULL,
  access_code TEXT,
  created_date DATE,
  position_type TEXT,
  long_1st_order_size NUMERIC,
  short_1st_order_size NUMERIC,
  leverage NUMERIC,
  long_order_layers INTEGER,
  short_order_layers INTEGER,
  take_profit_setting TEXT,
  long_tp_ratio NUMERIC,
  short_tp_ratio NUMERIC,
  long_trailing_tp_ratio NUMERIC,
  short_trailing_tp_ratio NUMERIC,
  long_next_order_ratios NUMERIC[] DEFAULT '{}',
  short_next_order_ratios NUMERIC[] DEFAULT '{}',
  long_next_order_trailing TEXT,
  short_next_order_trailing TEXT,
  stop_loss_per_coin TEXT,
  long_double_1st_order BOOLEAN DEFAULT false,
  short_double_1st_order BOOLEAN DEFAULT false,
  exchange TEXT NOT NULL DEFAULT 'Bybit',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crypto_strategies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own crypto_strategies" ON public.crypto_strategies
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_crypto_strategies_updated_at
  BEFORE UPDATE ON public.crypto_strategies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Aba 4: Valor Adicionado
CREATE TABLE public.crypto_deposits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT now(),
  added_brl NUMERIC DEFAULT 0,
  added_usd NUMERIC DEFAULT 0,
  added_ia NUMERIC DEFAULT 0,
  exchange TEXT NOT NULL DEFAULT 'Bybit',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crypto_deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own crypto_deposits" ON public.crypto_deposits
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_crypto_deposits_updated_at
  BEFORE UPDATE ON public.crypto_deposits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
