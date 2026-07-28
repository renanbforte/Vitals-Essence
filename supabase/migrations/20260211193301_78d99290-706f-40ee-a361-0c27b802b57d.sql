
-- Liberation module: Challenges (personal goals to reduce/quit habits)
CREATE TABLE public.liberation_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  intention_level TEXT NOT NULL DEFAULT 'reduce', -- reduce, pause, quit, understanding
  status TEXT NOT NULL DEFAULT 'active', -- active, paused, completed
  icon TEXT DEFAULT '🌱',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.liberation_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own challenges" ON public.liberation_challenges
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Triggers associated with each challenge
CREATE TABLE public.liberation_triggers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.liberation_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  trigger_type TEXT NOT NULL, -- emotion, time, place, person, situation
  trigger_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.liberation_triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own triggers" ON public.liberation_triggers
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Craving episodes (the heart of the system)
CREATE TABLE public.liberation_cravings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.liberation_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  trigger_emotions TEXT[] DEFAULT '{}',
  intensity TEXT DEFAULT 'medium', -- light, medium, strong
  outcome TEXT NOT NULL, -- resisted, substituted, registered, ceded
  substitution_used TEXT,
  craving_duration_seconds INTEGER,
  outcome_helpful BOOLEAN,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.liberation_cravings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cravings" ON public.liberation_cravings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Preferred substitutions per challenge
CREATE TABLE public.liberation_substitutions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.liberation_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  label TEXT NOT NULL,
  icon TEXT DEFAULT '💧',
  times_used INTEGER DEFAULT 0,
  times_effective INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.liberation_substitutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own substitutions" ON public.liberation_substitutions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Update timestamp triggers
CREATE TRIGGER update_liberation_challenges_updated_at
  BEFORE UPDATE ON public.liberation_challenges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
