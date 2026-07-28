
ALTER TABLE public.trip_destinations ADD COLUMN contact text DEFAULT NULL;
ALTER TABLE public.trip_destinations ADD COLUMN email text DEFAULT NULL;

ALTER TABLE public.trip_flights ADD COLUMN contact text DEFAULT NULL;
ALTER TABLE public.trip_flights ADD COLUMN email text DEFAULT NULL;

ALTER TABLE public.trip_transport ADD COLUMN contact text DEFAULT NULL;
ALTER TABLE public.trip_transport ADD COLUMN email text DEFAULT NULL;

ALTER TABLE public.trip_events ADD COLUMN contact text DEFAULT NULL;
ALTER TABLE public.trip_events ADD COLUMN email text DEFAULT NULL;

ALTER TABLE public.trip_documents ADD COLUMN contact text DEFAULT NULL;
ALTER TABLE public.trip_documents ADD COLUMN email text DEFAULT NULL;
