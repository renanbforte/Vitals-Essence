-- Allow users to find other profiles by friend_code for adding friends
CREATE POLICY "Users can find profiles by friend_code"
ON public.profiles FOR SELECT
USING (friend_code IS NOT NULL);