
-- Junction table: which participants share each expense
CREATE TABLE public.gathering_expense_splits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID NOT NULL REFERENCES public.gathering_expenses(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.gathering_participants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(expense_id, participant_id)
);

ALTER TABLE public.gathering_expense_splits ENABLE ROW LEVEL SECURITY;

-- RLS: users can see splits for events they participate in
CREATE POLICY "Users can view expense splits for their events"
ON public.gathering_expense_splits FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.gathering_expenses ge
    JOIN public.gathering_events ev ON ev.id = ge.event_id
    WHERE ge.id = gathering_expense_splits.expense_id
    AND ev.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.gathering_expenses ge
    JOIN public.gathering_participants gp ON gp.event_id = ge.event_id
    WHERE ge.id = gathering_expense_splits.expense_id
    AND gp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert expense splits for their events"
ON public.gathering_expense_splits FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.gathering_expenses ge
    JOIN public.gathering_events ev ON ev.id = ge.event_id
    WHERE ge.id = gathering_expense_splits.expense_id
    AND ev.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.gathering_expenses ge
    JOIN public.gathering_participants gp ON gp.event_id = ge.event_id
    WHERE ge.id = gathering_expense_splits.expense_id
    AND gp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete expense splits for their events"
ON public.gathering_expense_splits FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.gathering_expenses ge
    JOIN public.gathering_events ev ON ev.id = ge.event_id
    WHERE ge.id = gathering_expense_splits.expense_id
    AND ev.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.gathering_expenses ge
    JOIN public.gathering_participants gp ON gp.event_id = ge.event_id
    WHERE ge.id = gathering_expense_splits.expense_id
    AND gp.user_id = auth.uid()
  )
);
