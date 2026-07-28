
-- Itens da lista pessoal
CREATE TABLE public.life_checklist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  recurrence TEXT NOT NULL DEFAULT 'none', -- 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.life_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own checklist items"
  ON public.life_checklist_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Completions por data (para recorrentes: 1 por dia; para 'none': qualquer)
CREATE TABLE public.life_checklist_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.life_checklist_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  completed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(item_id, completed_date)
);

ALTER TABLE public.life_checklist_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own checklist completions"
  ON public.life_checklist_completions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger updated_at
CREATE TRIGGER update_life_checklist_items_updated_at
  BEFORE UPDATE ON public.life_checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
