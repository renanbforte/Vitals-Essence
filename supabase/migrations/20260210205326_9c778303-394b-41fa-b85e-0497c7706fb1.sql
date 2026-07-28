-- Fix has_trip_access to use SECURITY DEFINER to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.has_trip_access(p_trip_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trips WHERE id = p_trip_id AND user_id = auth.uid()
    UNION ALL
    SELECT 1 FROM public.trip_members WHERE trip_id = p_trip_id AND user_id = auth.uid() AND status = 'accepted'
  );
$$;