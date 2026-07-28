
ALTER TABLE public.trip_flights ADD COLUMN IF NOT EXISTS paid boolean DEFAULT false;
ALTER TABLE public.trip_accommodations ADD COLUMN IF NOT EXISTS paid boolean DEFAULT false;
ALTER TABLE public.trip_transport ADD COLUMN IF NOT EXISTS paid boolean DEFAULT false;
ALTER TABLE public.trip_events ADD COLUMN IF NOT EXISTS paid boolean DEFAULT false;
ALTER TABLE public.trip_meals ADD COLUMN IF NOT EXISTS paid boolean DEFAULT false;
