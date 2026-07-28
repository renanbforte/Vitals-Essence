
-- Add cost_mode and quantity to trip_flights
ALTER TABLE public.trip_flights ADD COLUMN cost_mode text NOT NULL DEFAULT 'total';
ALTER TABLE public.trip_flights ADD COLUMN quantity integer NOT NULL DEFAULT 1;

-- Add cost_mode and quantity to trip_accommodations
ALTER TABLE public.trip_accommodations ADD COLUMN cost_mode text NOT NULL DEFAULT 'total';
ALTER TABLE public.trip_accommodations ADD COLUMN quantity integer NOT NULL DEFAULT 1;

-- Add cost_mode and quantity to trip_transport
ALTER TABLE public.trip_transport ADD COLUMN cost_mode text NOT NULL DEFAULT 'total';
ALTER TABLE public.trip_transport ADD COLUMN quantity integer NOT NULL DEFAULT 1;

-- Add cost_mode and quantity to trip_events
ALTER TABLE public.trip_events ADD COLUMN cost_mode text NOT NULL DEFAULT 'total';
ALTER TABLE public.trip_events ADD COLUMN quantity integer NOT NULL DEFAULT 1;

-- Add cost_mode and quantity to trip_expenses
ALTER TABLE public.trip_expenses ADD COLUMN cost_mode text NOT NULL DEFAULT 'total';
ALTER TABLE public.trip_expenses ADD COLUMN quantity integer NOT NULL DEFAULT 1;
