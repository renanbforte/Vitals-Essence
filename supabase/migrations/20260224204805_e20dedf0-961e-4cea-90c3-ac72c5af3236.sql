
-- Tabela para armazenar os módulos escolhidos no plano Trio
CREATE TABLE public.trio_selections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  module_1 TEXT NOT NULL,
  module_2 TEXT NOT NULL,
  module_3 TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Apenas 1 seleção por usuário
CREATE UNIQUE INDEX idx_trio_selections_user ON public.trio_selections(user_id);

-- Enable RLS
ALTER TABLE public.trio_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trio" ON public.trio_selections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trio" ON public.trio_selections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trio" ON public.trio_selections FOR UPDATE USING (auth.uid() = user_id);

-- Trigger updated_at
CREATE TRIGGER update_trio_selections_updated_at
  BEFORE UPDATE ON public.trio_selections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
