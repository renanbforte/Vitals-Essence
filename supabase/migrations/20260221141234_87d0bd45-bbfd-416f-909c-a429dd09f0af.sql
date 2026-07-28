-- Allow users to read astral profiles of their accepted friends
CREATE POLICY "Users can view friends astral profiles"
ON public.astral_profiles
FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.friendships
    WHERE status = 'accepted'
    AND (
      (user_id = auth.uid() AND friend_id = astral_profiles.user_id)
      OR (friend_id = auth.uid() AND user_id = astral_profiles.user_id)
    )
  )
);

-- Also allow reading planet_placements of friends
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'planet_placements' AND policyname = 'Users can view friends planet placements'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view friends planet placements"
    ON public.planet_placements
    FOR SELECT
    USING (
      auth.uid() = user_id
      OR EXISTS (
        SELECT 1 FROM public.friendships
        WHERE status = ''accepted''
        AND (
          (user_id = auth.uid() AND friend_id = planet_placements.user_id)
          OR (friend_id = auth.uid() AND user_id = planet_placements.user_id)
        )
      )
    )';
  END IF;
END $$;

-- Drop the old ALL policy and replace with specific ones to avoid conflict
DROP POLICY IF EXISTS "Users manage own astral profile" ON public.astral_profiles;

CREATE POLICY "Users manage own astral profile"
ON public.astral_profiles
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);