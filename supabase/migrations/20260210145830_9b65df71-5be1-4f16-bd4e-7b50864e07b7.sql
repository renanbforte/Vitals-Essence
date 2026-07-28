
-- Trade Sessions table
CREATE TABLE public.trade_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Pre-trade: Identification
  start_time TEXT,
  platform TEXT DEFAULT 'Profit',
  market TEXT,
  
  -- Pre-trade: Capital Management
  allocated_capital NUMERIC DEFAULT 0,
  max_daily_risk NUMERIC DEFAULT 0,
  risk_per_operation NUMERIC DEFAULT 0,
  
  -- Pre-trade: Day Plan
  expected_scenario TEXT,
  allowed_setups TEXT,
  allowed_hours TEXT,
  prohibited_hours TEXT,
  
  -- Pre-trade: Trader State (optional)
  emotional_state TEXT,
  sleep_quality TEXT,
  energy_level TEXT,
  
  -- Post-trade: Day Result
  financial_result NUMERIC,
  percentage_result NUMERIC,
  num_operations INTEGER,
  win_rate NUMERIC,
  biggest_gain NUMERIC,
  biggest_loss NUMERIC,
  
  -- Post-trade: Discipline
  respected_daily_risk BOOLEAN,
  respected_plan TEXT,
  broken_rules TEXT,
  
  -- Post-trade: Notes
  observations TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pre',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trade_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own trade sessions" ON public.trade_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_trade_sessions_user_date ON public.trade_sessions(user_id, date DESC);

CREATE TRIGGER update_trade_sessions_updated_at BEFORE UPDATE ON public.trade_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Crypto Snapshots table
CREATE TABLE public.crypto_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TEXT,
  
  -- Identification
  exchange TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'Spot',
  
  -- Configuration
  margin_mode TEXT,
  total_positions INTEGER DEFAULT 0,
  positions_value_usd NUMERIC DEFAULT 0,
  
  -- Capital
  equity_usd NUMERIC DEFAULT 0,
  wallet_balance_usd NUMERIC DEFAULT 0,
  available_balance_usd NUMERIC DEFAULT 0,
  margin_used_usd NUMERIC DEFAULT 0,
  
  -- Result
  unrealized_pnl_usd NUMERIC DEFAULT 0,
  total_pnl_usd NUMERIC DEFAULT 0,
  total_pnl_pct NUMERIC DEFAULT 0,
  
  -- Conversion
  usd_brl_rate NUMERIC DEFAULT 5.0,
  
  -- Flags
  include_in_patrimony BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crypto_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own crypto snapshots" ON public.crypto_snapshots FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_crypto_snapshots_user_date ON public.crypto_snapshots(user_id, date DESC);

CREATE TRIGGER update_crypto_snapshots_updated_at BEFORE UPDATE ON public.crypto_snapshots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
