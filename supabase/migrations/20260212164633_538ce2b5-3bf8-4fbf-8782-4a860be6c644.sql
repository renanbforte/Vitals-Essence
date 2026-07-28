
-- Templates for reusable checklists
CREATE TABLE public.trip_checklist_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.trip_checklist_template_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.trip_checklist_templates(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'outros',
  item_name TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  order_index INT DEFAULT 0
);

ALTER TABLE public.trip_checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_checklist_template_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own templates" ON public.trip_checklist_templates FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own template items" ON public.trip_checklist_template_items FOR ALL USING (EXISTS (SELECT 1 FROM public.trip_checklist_templates t WHERE t.id = template_id AND t.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.trip_checklist_templates t WHERE t.id = template_id AND t.user_id = auth.uid()));
