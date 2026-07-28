
-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'pontual' CHECK (type IN ('recorrente', 'pontual')),
  life_area TEXT NOT NULL DEFAULT 'vida_pessoal' CHECK (life_area IN ('trabalho', 'vida_pessoal', 'saude', 'financeiro', 'casa', 'relacionamentos', 'lazer')),
  sub_area TEXT CHECK (sub_area IN ('saude_mental', 'saude_fisica', 'casa', 'relacionamentos', 'desenvolvimento', 'lazer', 'autocuidado')),
  category TEXT,
  start_date DATE,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  recurrence TEXT CHECK (recurrence IN ('diaria', 'semanal', 'mensal', 'personalizada')),
  recurrence_days INTEGER[], -- e.g. [1,3,5] for mon/wed/fri
  flexibility TEXT NOT NULL DEFAULT 'flexivel' CHECK (flexibility IN ('fixa', 'flexivel')),
  estimated_duration INTEGER, -- minutes
  energy_required TEXT NOT NULL DEFAULT 'media' CHECK (energy_required IN ('baixa', 'media', 'alta')),
  status TEXT NOT NULL DEFAULT 'a_fazer' CHECK (status IN ('a_fazer', 'em_andamento', 'feita', 'adiada')),
  can_skip BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  location TEXT,
  link TEXT,
  postpone_count INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  parent_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

-- Task feedback table
CREATE TABLE public.task_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  difficulty TEXT CHECK (difficulty IN ('facil', 'ok', 'pesada')),
  worth_it BOOLEAN,
  want_repeat BOOLEAN,
  actual_duration INTEGER, -- minutes
  completed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.task_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feedback" ON public.task_feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own feedback" ON public.task_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Daily energy log
CREATE TABLE public.daily_energy (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  energy_level TEXT NOT NULL CHECK (energy_level IN ('baixa', 'media', 'alta')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.daily_energy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own energy" ON public.daily_energy FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upsert own energy" ON public.daily_energy FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own energy" ON public.daily_energy FOR UPDATE USING (auth.uid() = user_id);

-- Update trigger
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
