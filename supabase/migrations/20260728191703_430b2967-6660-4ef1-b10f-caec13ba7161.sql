CREATE TABLE public.life_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'pessoal',
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'nao_iniciada',
  priority TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.life_goals TO authenticated;
GRANT ALL ON public.life_goals TO service_role;

ALTER TABLE public.life_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own goals" ON public.life_goals
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_life_goals_updated_at
  BEFORE UPDATE ON public.life_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_life_goals_user ON public.life_goals(user_id, status, deadline);