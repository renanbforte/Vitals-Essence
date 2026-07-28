
-- Life check-ins (emotional thermometer + daily questions)
CREATE TABLE public.life_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  emotional_state TEXT NOT NULL DEFAULT 'bem', -- 'ótimo','bem','neutro','cansado','sobrecarregado'
  talked_to_someone BOOLEAN DEFAULT FALSE,
  home_organized BOOLEAN DEFAULT FALSE,
  had_me_time BOOLEAN DEFAULT FALSE,
  overloaded_mode BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, checkin_date)
);
ALTER TABLE public.life_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own checkins" ON public.life_checkins FOR ALL USING (auth.uid() = user_id);

-- House routines
CREATE TABLE public.house_routines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'limpeza', -- 'limpeza','roupas','manutencao','pagamentos','outro'
  frequency TEXT NOT NULL DEFAULT 'semanal', -- 'diaria','semanal','quinzenal','mensal'
  last_done_at DATE,
  shared_with TEXT, -- name of person who shares
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.house_routines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own routines" ON public.house_routines FOR ALL USING (auth.uid() = user_id);

-- Important relationships
CREATE TABLE public.life_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  relation TEXT, -- 'família','amigo','parceiro','colega','outro'
  likes TEXT, -- things they like
  important_dates JSONB DEFAULT '[]',
  last_quality_time DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.life_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own relationships" ON public.life_relationships FOR ALL USING (auth.uid() = user_id);

-- Life experiences (bucket list + memories)
CREATE TABLE public.life_experiences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'quero_viver', -- 'quero_viver','memoria'
  description TEXT,
  photo_url TEXT,
  experience_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.life_experiences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own experiences" ON public.life_experiences FOR ALL USING (auth.uid() = user_id);

-- Brain dumps / worries
CREATE TABLE public.life_brain_dumps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  resolution TEXT DEFAULT 'pendente', -- 'pendente','resolver','deixar_ir','nao_importa'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.life_brain_dumps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own brain dumps" ON public.life_brain_dumps FOR ALL USING (auth.uid() = user_id);

-- Light daily diary
CREATE TABLE public.life_diary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  diary_date DATE NOT NULL DEFAULT CURRENT_DATE,
  best_moment TEXT,
  bothered_by TEXT,
  gratitude TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, diary_date)
);
ALTER TABLE public.life_diary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own diary" ON public.life_diary FOR ALL USING (auth.uid() = user_id);

-- Weekly ritual
CREATE TABLE public.life_weekly_rituals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  want_to_live TEXT,
  more_present_with TEXT,
  avoid_repeating TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);
ALTER TABLE public.life_weekly_rituals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own rituals" ON public.life_weekly_rituals FOR ALL USING (auth.uid() = user_id);

-- Balance radar (frequency logs)
CREATE TABLE public.life_balance_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  area TEXT NOT NULL, -- 'casa','familia','amigos','lazer','autocuidado','tempo_sozinho'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.life_balance_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own balance logs" ON public.life_balance_logs FOR ALL USING (auth.uid() = user_id);
