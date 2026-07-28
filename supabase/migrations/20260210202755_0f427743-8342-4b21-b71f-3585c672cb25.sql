
-- Main trips table
CREATE TABLE public.trips (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  main_destination text,
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'planning',
  budget numeric DEFAULT 0,
  currency text DEFAULT 'BRL',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- Trip members (sharing)
CREATE TABLE public.trip_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'viewer',
  status text NOT NULL DEFAULT 'pending',
  invited_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(trip_id, user_id)
);

ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;

-- Trip destinations
CREATE TABLE public.trip_destinations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  location text NOT NULL,
  start_date date,
  end_date date,
  notes text,
  link text,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.trip_destinations ENABLE ROW LEVEL SECURITY;

-- Trip flights
CREATE TABLE public.trip_flights (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  airline text,
  flight_code text,
  origin text,
  destination text,
  departure_date timestamp with time zone,
  arrival_date timestamp with time zone,
  terminal text,
  gate text,
  baggage text,
  booking_code text,
  cost numeric DEFAULT 0,
  currency text DEFAULT 'BRL',
  link text,
  status text DEFAULT 'planned',
  notes text,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.trip_flights ENABLE ROW LEVEL SECURITY;

-- Trip accommodations
CREATE TABLE public.trip_accommodations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL,
  address text,
  map_link text,
  checkin_date timestamp with time zone,
  checkout_date timestamp with time zone,
  policy text,
  booking_code text,
  contact text,
  cost numeric DEFAULT 0,
  currency text DEFAULT 'BRL',
  link text,
  notes text,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.trip_accommodations ENABLE ROW LEVEL SECURITY;

-- Trip local transport
CREATE TABLE public.trip_transport (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  transport_type text NOT NULL DEFAULT 'car',
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  pickup_location text,
  dropoff_location text,
  booking_code text,
  cost numeric DEFAULT 0,
  currency text DEFAULT 'BRL',
  link text,
  notes text,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.trip_transport ENABLE ROW LEVEL SECURITY;

-- Trip events / agenda
CREATE TABLE public.trip_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  event_date timestamp with time zone,
  location text,
  location_link text,
  booking_code text,
  cost numeric DEFAULT 0,
  currency text DEFAULT 'BRL',
  priority text DEFAULT 'medium',
  link text,
  notes text,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.trip_events ENABLE ROW LEVEL SECURITY;

-- Trip documents
CREATE TABLE public.trip_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  doc_type text NOT NULL DEFAULT 'other',
  title text NOT NULL,
  required_for text,
  status text DEFAULT 'pending',
  expiry_date date,
  file_url text,
  link text,
  notes text,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.trip_documents ENABLE ROW LEVEL SECURITY;

-- Trip expenses (central cost control)
CREATE TABLE public.trip_expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  item text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  amount numeric NOT NULL DEFAULT 0,
  currency text DEFAULT 'BRL',
  paid boolean DEFAULT false,
  expense_date date,
  link text,
  file_url text,
  related_type text,
  related_id uuid,
  notes text,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.trip_expenses ENABLE ROW LEVEL SECURITY;

-- Trip attachments (generic file storage for any item)
CREATE TABLE public.trip_attachments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  parent_type text NOT NULL,
  parent_id uuid NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  tags text[],
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.trip_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trips (owner OR member)
CREATE POLICY "Owner can do all on trips" ON public.trips FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can view trips" ON public.trips FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.trip_members WHERE trip_members.trip_id = trips.id AND trip_members.user_id = auth.uid() AND trip_members.status = 'accepted'));

CREATE POLICY "Members can update trips" ON public.trips FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.trip_members WHERE trip_members.trip_id = trips.id AND trip_members.user_id = auth.uid() AND trip_members.status = 'accepted' AND trip_members.role = 'editor'));

-- RLS for trip_members
CREATE POLICY "Trip owner manages members" ON public.trip_members FOR ALL
  USING (EXISTS (SELECT 1 FROM public.trips WHERE trips.id = trip_members.trip_id AND trips.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.trips WHERE trips.id = trip_members.trip_id AND trips.user_id = auth.uid()));

CREATE POLICY "Members can view members" ON public.trip_members FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Members can update own status" ON public.trip_members FOR UPDATE
  USING (auth.uid() = user_id);

-- Helper function for checking trip access
CREATE OR REPLACE FUNCTION public.has_trip_access(p_trip_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trips WHERE id = p_trip_id AND user_id = auth.uid()
    UNION ALL
    SELECT 1 FROM public.trip_members WHERE trip_id = p_trip_id AND user_id = auth.uid() AND status = 'accepted'
  );
$$;

-- Macro for sub-table RLS (owner or accepted member)
-- Destinations
CREATE POLICY "Trip access for destinations" ON public.trip_destinations FOR ALL
  USING (public.has_trip_access(trip_id)) WITH CHECK (public.has_trip_access(trip_id));

-- Flights
CREATE POLICY "Trip access for flights" ON public.trip_flights FOR ALL
  USING (public.has_trip_access(trip_id)) WITH CHECK (public.has_trip_access(trip_id));

-- Accommodations
CREATE POLICY "Trip access for accommodations" ON public.trip_accommodations FOR ALL
  USING (public.has_trip_access(trip_id)) WITH CHECK (public.has_trip_access(trip_id));

-- Transport
CREATE POLICY "Trip access for transport" ON public.trip_transport FOR ALL
  USING (public.has_trip_access(trip_id)) WITH CHECK (public.has_trip_access(trip_id));

-- Events
CREATE POLICY "Trip access for events" ON public.trip_events FOR ALL
  USING (public.has_trip_access(trip_id)) WITH CHECK (public.has_trip_access(trip_id));

-- Documents
CREATE POLICY "Trip access for documents" ON public.trip_documents FOR ALL
  USING (public.has_trip_access(trip_id)) WITH CHECK (public.has_trip_access(trip_id));

-- Expenses
CREATE POLICY "Trip access for expenses" ON public.trip_expenses FOR ALL
  USING (public.has_trip_access(trip_id)) WITH CHECK (public.has_trip_access(trip_id));

-- Attachments
CREATE POLICY "Trip access for attachments" ON public.trip_attachments FOR ALL
  USING (public.has_trip_access(trip_id)) WITH CHECK (public.has_trip_access(trip_id));

-- Triggers for updated_at
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trip_members_updated_at BEFORE UPDATE ON public.trip_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trip_destinations_updated_at BEFORE UPDATE ON public.trip_destinations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trip_flights_updated_at BEFORE UPDATE ON public.trip_flights FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trip_accommodations_updated_at BEFORE UPDATE ON public.trip_accommodations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trip_transport_updated_at BEFORE UPDATE ON public.trip_transport FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trip_events_updated_at BEFORE UPDATE ON public.trip_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trip_documents_updated_at BEFORE UPDATE ON public.trip_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trip_expenses_updated_at BEFORE UPDATE ON public.trip_expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for trip files
INSERT INTO storage.buckets (id, name, public) VALUES ('trip-files', 'trip-files', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Trip file access" ON storage.objects FOR ALL
  USING (bucket_id = 'trip-files' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'trip-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable realtime for trip collaboration
ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_destinations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_flights;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_accommodations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_transport;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_documents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_expenses;
