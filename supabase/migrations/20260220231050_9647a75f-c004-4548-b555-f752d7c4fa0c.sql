
CREATE TABLE public.trip_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL,
  destination TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.trip_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trip owners and members can view recommendations"
  ON public.trip_recommendations
  FOR SELECT
  USING (public.has_trip_access(trip_id));

CREATE POLICY "Trip owners and members can insert recommendations"
  ON public.trip_recommendations
  FOR INSERT
  WITH CHECK (public.has_trip_access(trip_id));

CREATE POLICY "Trip owners and members can update recommendations"
  ON public.trip_recommendations
  FOR UPDATE
  USING (public.has_trip_access(trip_id));

CREATE UNIQUE INDEX trip_recommendations_trip_id_idx ON public.trip_recommendations(trip_id);

CREATE TRIGGER update_trip_recommendations_updated_at
  BEFORE UPDATE ON public.trip_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
