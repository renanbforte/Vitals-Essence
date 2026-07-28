
-- Add paid_by columns to all trip item tables
ALTER TABLE public.trip_flights 
  ADD COLUMN IF NOT EXISTS paid_by_user_id UUID,
  ADD COLUMN IF NOT EXISTS paid_by_external_id UUID REFERENCES public.trip_split_participants(id) ON DELETE SET NULL;

ALTER TABLE public.trip_accommodations 
  ADD COLUMN IF NOT EXISTS paid_by_user_id UUID,
  ADD COLUMN IF NOT EXISTS paid_by_external_id UUID REFERENCES public.trip_split_participants(id) ON DELETE SET NULL;

ALTER TABLE public.trip_transport 
  ADD COLUMN IF NOT EXISTS paid_by_user_id UUID,
  ADD COLUMN IF NOT EXISTS paid_by_external_id UUID REFERENCES public.trip_split_participants(id) ON DELETE SET NULL;

ALTER TABLE public.trip_events 
  ADD COLUMN IF NOT EXISTS paid_by_user_id UUID,
  ADD COLUMN IF NOT EXISTS paid_by_external_id UUID REFERENCES public.trip_split_participants(id) ON DELETE SET NULL;

ALTER TABLE public.trip_meals 
  ADD COLUMN IF NOT EXISTS paid_by_user_id UUID,
  ADD COLUMN IF NOT EXISTS paid_by_external_id UUID REFERENCES public.trip_split_participants(id) ON DELETE SET NULL;
