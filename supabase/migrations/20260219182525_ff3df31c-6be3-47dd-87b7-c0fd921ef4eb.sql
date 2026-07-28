-- Create workout_routes table to store GPS route data
CREATE TABLE public.workout_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  workout_type TEXT NOT NULL, -- 'running' or 'cycling'
  distance_km NUMERIC NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  coordinates JSONB NOT NULL DEFAULT '[]'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own workout routes"
  ON public.workout_routes
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_workout_routes_updated_at
  BEFORE UPDATE ON public.workout_routes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
