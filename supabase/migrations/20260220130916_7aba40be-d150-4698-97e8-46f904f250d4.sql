
-- Table for contraceptive method configuration per user
CREATE TABLE public.contraceptive_methods (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  method_type text NOT NULL, -- 'pill', 'iud_hormonal', 'iud_copper', 'implant', 'injection', 'ring', 'patch', 'condom', 'other'
  name text NOT NULL, -- e.g. "Yasmin", "DIU Kyleena"
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date NULL, -- null = indefinite (implant, IUD, etc.)
  renewal_reminder_days integer NOT NULL DEFAULT 7, -- days before end_date to remind
  pill_time text NULL, -- HH:MM preferred time to take pill
  pill_cycle_days integer NOT NULL DEFAULT 21, -- days of active pills
  pill_break_days integer NOT NULL DEFAULT 7, -- days of break/placebo
  injection_interval_days integer NULL, -- e.g. 90 for quarterly
  active boolean NOT NULL DEFAULT true,
  notes text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.contraceptive_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own contraceptive methods"
  ON public.contraceptive_methods FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Table for daily check-ins (did I take it today and at what time)
CREATE TABLE public.contraceptive_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  method_id uuid NOT NULL REFERENCES public.contraceptive_methods(id) ON DELETE CASCADE,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  taken boolean NOT NULL DEFAULT false,
  taken_at time NULL, -- actual time taken
  skipped boolean NOT NULL DEFAULT false,
  skip_reason text NULL,
  notes text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (method_id, log_date)
);

ALTER TABLE public.contraceptive_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own contraceptive logs"
  ON public.contraceptive_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_contraceptive_methods_updated_at
  BEFORE UPDATE ON public.contraceptive_methods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contraceptive_logs_updated_at
  BEFORE UPDATE ON public.contraceptive_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
