
CREATE TABLE public.intimacy_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  log_time TIME WITHOUT TIME ZONE,
  duration_minutes INTEGER,
  activity_type TEXT[] DEFAULT '{}',
  partner_label TEXT,
  location TEXT,
  desire_before INTEGER CHECK (desire_before BETWEEN 1 AND 10),
  satisfaction INTEGER CHECK (satisfaction BETWEEN 1 AND 10),
  pleasure INTEGER CHECK (pleasure BETWEEN 1 AND 10),
  orgasm TEXT,
  energy_level TEXT,
  mood TEXT,
  contraception_used TEXT,
  protection_used BOOLEAN DEFAULT false,
  discomfort TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.intimacy_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own intimacy logs"
  ON public.intimacy_logs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_intimacy_logs_updated_at
  BEFORE UPDATE ON public.intimacy_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
