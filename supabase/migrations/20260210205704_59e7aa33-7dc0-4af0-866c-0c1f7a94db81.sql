-- Create a SECURITY DEFINER function to check trip ownership without triggering RLS on trips
CREATE OR REPLACE FUNCTION public.is_trip_owner(p_trip_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trips WHERE id = p_trip_id AND user_id = auth.uid()
  );
$$;

-- Drop the recursive policy on trip_members
DROP POLICY IF EXISTS "Trip owner manages members" ON public.trip_members;

-- Recreate it using the SECURITY DEFINER function
CREATE POLICY "Trip owner manages members"
ON public.trip_members
FOR ALL
USING (public.is_trip_owner(trip_id))
WITH CHECK (public.is_trip_owner(trip_id));