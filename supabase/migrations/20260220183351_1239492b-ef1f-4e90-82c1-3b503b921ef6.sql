
-- Professional Profiles
CREATE TABLE public.professional_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  job_role TEXT,
  current_income NUMERIC DEFAULT 0,
  target_income NUMERIC DEFAULT 0,
  next_goal TEXT,
  career_track TEXT DEFAULT 'corporativo',
  level INTEGER DEFAULT 1,
  level_xp INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.professional_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own professional profile" ON public.professional_profiles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Income History
CREATE TABLE public.professional_income_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  month DATE NOT NULL,
  income NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, month)
);
ALTER TABLE public.professional_income_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own income history" ON public.professional_income_history FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Daily Professional Records (Score)
CREATE TABLE public.professional_daily_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  focus_hours NUMERIC DEFAULT 0,
  strategic_tasks_done INTEGER DEFAULT 0,
  study_done BOOLEAN DEFAULT false,
  important_deliveries INTEGER DEFAULT 0,
  relevant_meetings INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, record_date)
);
ALTER TABLE public.professional_daily_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own daily records" ON public.professional_daily_records FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Skills Bank
CREATE TABLE public.professional_skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  skill_name TEXT NOT NULL,
  category TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 1,
  last_reviewed_at DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.professional_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own skills" ON public.professional_skills FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Learning Logs
CREATE TABLE public.professional_learning_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.professional_learning_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own learning logs" ON public.professional_learning_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Opportunities Radar
CREATE TABLE public.professional_opportunities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  opportunity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL,
  description TEXT,
  result TEXT DEFAULT 'pendente',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.professional_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own opportunities" ON public.professional_opportunities FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Study Plans
CREATE TABLE public.study_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  plan_type TEXT DEFAULT 'curso',
  deadline DATE,
  weekly_hours_goal NUMERIC DEFAULT 5,
  status TEXT DEFAULT 'active',
  total_hours_done NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own study plans" ON public.study_plans FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Study Plan Sessions
CREATE TABLE public.study_plan_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.study_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  planned_date DATE NOT NULL,
  topic TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  activity_type TEXT DEFAULT 'aula',
  completed BOOLEAN DEFAULT false,
  actual_duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.study_plan_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own study sessions" ON public.study_plan_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Weekly Missions
CREATE TABLE public.weekly_missions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  mission_type TEXT NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.weekly_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own weekly missions" ON public.weekly_missions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Updated at triggers
CREATE TRIGGER update_professional_profiles_updated_at BEFORE UPDATE ON public.professional_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_professional_daily_records_updated_at BEFORE UPDATE ON public.professional_daily_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_professional_skills_updated_at BEFORE UPDATE ON public.professional_skills FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_study_plans_updated_at BEFORE UPDATE ON public.study_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_study_plan_sessions_updated_at BEFORE UPDATE ON public.study_plan_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_professional_opportunities_updated_at BEFORE UPDATE ON public.professional_opportunities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
