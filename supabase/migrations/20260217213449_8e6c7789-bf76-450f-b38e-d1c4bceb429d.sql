
-- Table for manual balance adjustments/transfers in gatherings
CREATE TABLE public.gathering_adjustments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.gathering_events(id) ON DELETE CASCADE,
  from_participant_id uuid NOT NULL REFERENCES public.gathering_participants(id) ON DELETE CASCADE,
  to_participant_id uuid NOT NULL REFERENCES public.gathering_participants(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.gathering_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view adjustments"
  ON public.gathering_adjustments FOR SELECT
  USING (is_gathering_member(event_id, auth.uid()));

CREATE POLICY "Members can add adjustments"
  ON public.gathering_adjustments FOR INSERT
  WITH CHECK (is_gathering_member(event_id, auth.uid()));

CREATE POLICY "Members can update adjustments"
  ON public.gathering_adjustments FOR UPDATE
  USING (is_gathering_member(event_id, auth.uid()));

CREATE POLICY "Members can delete adjustments"
  ON public.gathering_adjustments FOR DELETE
  USING (is_gathering_member(event_id, auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.gathering_adjustments;
