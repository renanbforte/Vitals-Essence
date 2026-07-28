
-- Menstrual cycle settings per user
CREATE TABLE public.menstrual_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  average_cycle_length INTEGER NOT NULL DEFAULT 28,
  average_period_length INTEGER NOT NULL DEFAULT 5,
  contraceptive_type TEXT DEFAULT NULL,
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.menstrual_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own menstrual settings"
ON public.menstrual_settings FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_menstrual_settings_updated_at
BEFORE UPDATE ON public.menstrual_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Each menstrual cycle (period start to next period start)
CREATE TABLE public.menstrual_cycles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE DEFAULT NULL,
  cycle_length INTEGER DEFAULT NULL,
  is_atypical BOOLEAN NOT NULL DEFAULT false,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.menstrual_cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own menstrual cycles"
ON public.menstrual_cycles FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_menstrual_cycles_updated_at
BEFORE UPDATE ON public.menstrual_cycles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Daily logs within a cycle (flow, symptoms, mood, etc.)
CREATE TABLE public.menstrual_daily_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  cycle_id UUID REFERENCES public.menstrual_cycles(id) ON DELETE CASCADE,
  flow_intensity TEXT DEFAULT NULL CHECK (flow_intensity IN ('light', 'medium', 'heavy', 'very_heavy', 'spotting', 'none')),
  symptoms TEXT[] DEFAULT '{}',
  mood TEXT DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.menstrual_daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own menstrual daily logs"
ON public.menstrual_daily_logs FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_menstrual_daily_logs_updated_at
BEFORE UPDATE ON public.menstrual_daily_logs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
