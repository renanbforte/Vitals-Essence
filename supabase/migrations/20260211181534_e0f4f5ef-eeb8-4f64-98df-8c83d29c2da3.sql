
-- =============================================
-- MÓDULO: ENCONTROS & RATEIOS
-- =============================================

-- 1. Eventos (encontros)
CREATE TABLE public.gathering_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'outro', -- churrasco, jantar, festa, viagem, outro
  event_date DATE,
  location TEXT,
  description TEXT,
  split_mode TEXT NOT NULL DEFAULT 'equal', -- equal, fixed, hybrid
  fixed_amount_per_person NUMERIC,
  currency TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL DEFAULT 'open', -- open, closed, finalized
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gathering_events ENABLE ROW LEVEL SECURITY;

-- 2. Participantes
CREATE TABLE public.gathering_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.gathering_events(id) ON DELETE CASCADE,
  user_id UUID, -- null se externo
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- confirmed, pending, declined
  is_external BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gathering_participants ENABLE ROW LEVEL SECURITY;

-- 3. Compras / Despesas do evento
CREATE TABLE public.gathering_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.gathering_events(id) ON DELETE CASCADE,
  added_by_user_id UUID NOT NULL,
  expense_type TEXT NOT NULL DEFAULT 'product', -- receipt (nota inteira), product (item avulso)
  description TEXT NOT NULL,
  category TEXT DEFAULT 'geral', -- bebida, carne, mercado, etc.
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  location TEXT,
  paid_by_participant_id UUID REFERENCES public.gathering_participants(id) ON DELETE SET NULL,
  file_url TEXT, -- foto da nota
  notes TEXT,
  include_in_split BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gathering_expenses ENABLE ROW LEVEL SECURITY;

-- 4. Timeline / log de atividades
CREATE TABLE public.gathering_timeline (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.gathering_events(id) ON DELETE CASCADE,
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL, -- 'expense_added', 'participant_joined', 'receipt_attached', 'split_recalculated', 'event_closed'
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gathering_timeline ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Helper: check if user is creator or participant of an event
CREATE OR REPLACE FUNCTION public.is_gathering_member(p_event_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM gathering_events WHERE id = p_event_id AND user_id = p_user_id
    UNION ALL
    SELECT 1 FROM gathering_participants WHERE event_id = p_event_id AND user_id = p_user_id
  );
$$;

-- gathering_events policies
CREATE POLICY "Users can view own or participating events" ON public.gathering_events
  FOR SELECT USING (user_id = auth.uid() OR public.is_gathering_member(id, auth.uid()));

CREATE POLICY "Users can create events" ON public.gathering_events
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Creators can update their events" ON public.gathering_events
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Creators can delete their events" ON public.gathering_events
  FOR DELETE USING (user_id = auth.uid());

-- gathering_participants policies
CREATE POLICY "Members can view participants" ON public.gathering_participants
  FOR SELECT USING (public.is_gathering_member(event_id, auth.uid()));

CREATE POLICY "Members can add participants" ON public.gathering_participants
  FOR INSERT WITH CHECK (public.is_gathering_member(event_id, auth.uid()));

CREATE POLICY "Members can update participants" ON public.gathering_participants
  FOR UPDATE USING (public.is_gathering_member(event_id, auth.uid()));

CREATE POLICY "Creator can delete participants" ON public.gathering_participants
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM gathering_events WHERE id = event_id AND user_id = auth.uid())
  );

-- gathering_expenses policies
CREATE POLICY "Members can view expenses" ON public.gathering_expenses
  FOR SELECT USING (public.is_gathering_member(event_id, auth.uid()));

CREATE POLICY "Members can add expenses" ON public.gathering_expenses
  FOR INSERT WITH CHECK (public.is_gathering_member(event_id, auth.uid()));

CREATE POLICY "Members can update expenses" ON public.gathering_expenses
  FOR UPDATE USING (public.is_gathering_member(event_id, auth.uid()));

CREATE POLICY "Members can delete expenses" ON public.gathering_expenses
  FOR DELETE USING (public.is_gathering_member(event_id, auth.uid()));

-- gathering_timeline policies
CREATE POLICY "Members can view timeline" ON public.gathering_timeline
  FOR SELECT USING (public.is_gathering_member(event_id, auth.uid()));

CREATE POLICY "Members can add timeline entries" ON public.gathering_timeline
  FOR INSERT WITH CHECK (public.is_gathering_member(event_id, auth.uid()));

-- Enable realtime for collaborative updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.gathering_expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gathering_participants;

-- Triggers for updated_at
CREATE TRIGGER update_gathering_events_updated_at
  BEFORE UPDATE ON public.gathering_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gathering_participants_updated_at
  BEFORE UPDATE ON public.gathering_participants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gathering_expenses_updated_at
  BEFORE UPDATE ON public.gathering_expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
