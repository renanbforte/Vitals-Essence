-- Add policy to allow friends to view each other's weight history
CREATE POLICY "Friends can view weight history"
  ON public.weight_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.friendships
      WHERE status = 'accepted'
      AND ((user_id = auth.uid() AND friend_id = weight_history.user_id)
           OR (friend_id = auth.uid() AND user_id = weight_history.user_id))
    )
  );