
CREATE TABLE public.trip_checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  category TEXT NOT NULL DEFAULT 'outros',
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  packed BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.trip_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view checklist items for their trips"
  ON public.trip_checklist_items FOR SELECT
  USING (
    user_id = auth.uid()
    OR trip_id IN (SELECT id FROM public.trips WHERE user_id = auth.uid())
    OR trip_id IN (SELECT trip_id FROM public.trip_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert checklist items"
  ON public.trip_checklist_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update checklist items"
  ON public.trip_checklist_items FOR UPDATE
  USING (
    user_id = auth.uid()
    OR trip_id IN (SELECT id FROM public.trips WHERE user_id = auth.uid())
    OR trip_id IN (SELECT trip_id FROM public.trip_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete checklist items"
  ON public.trip_checklist_items FOR DELETE
  USING (
    user_id = auth.uid()
    OR trip_id IN (SELECT id FROM public.trips WHERE user_id = auth.uid())
  );

CREATE TRIGGER update_trip_checklist_items_updated_at
  BEFORE UPDATE ON public.trip_checklist_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
