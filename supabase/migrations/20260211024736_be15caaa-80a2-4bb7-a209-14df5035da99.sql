
-- 1. SHOPPING PLACES (Lugares/Lojas)
CREATE TABLE public.shopping_places (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  place_type TEXT DEFAULT 'mercado',
  address TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shopping_places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own shopping places" ON public.shopping_places FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. SHOPPING PRODUCTS (Catálogo do Usuário)
CREATE TABLE public.shopping_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name_caps TEXT NOT NULL,
  segment TEXT NOT NULL DEFAULT 'MERCEARIA',
  default_unit TEXT NOT NULL DEFAULT 'UN',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shopping_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own shopping products" ON public.shopping_products FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Allow friends to view products for shared lists
CREATE POLICY "Friends can view shopping products" ON public.shopping_products FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM friendships
    WHERE friendships.status = 'accepted'
    AND ((friendships.user_id = auth.uid() AND friendships.friend_id = shopping_products.user_id)
      OR (friendships.friend_id = auth.uid() AND friendships.user_id = shopping_products.user_id))
  ));

-- 3. PRICE HISTORY (Histórico de Preços)
CREATE TABLE public.shopping_price_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.shopping_products(id) ON DELETE CASCADE,
  place_id UUID NOT NULL REFERENCES public.shopping_places(id) ON DELETE CASCADE,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  brand TEXT,
  price_type TEXT NOT NULL DEFAULT 'UNITARIO',
  unit_price NUMERIC NOT NULL DEFAULT 0,
  observation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shopping_price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own price history" ON public.shopping_price_history FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. SHOPPING TEMPLATES (Listas Padrão)
CREATE TABLE public.shopping_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shopping_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own shopping templates" ON public.shopping_templates FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. TEMPLATE ITEMS (Itens do Template)
CREATE TABLE public.shopping_template_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.shopping_templates(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.shopping_products(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  suggested_quantity NUMERIC DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shopping_template_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own template items" ON public.shopping_template_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.shopping_templates t WHERE t.id = template_id AND t.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.shopping_templates t WHERE t.id = template_id AND t.user_id = auth.uid()
  ));

-- 6. SHOPPING SESSIONS (Sessão de Compra)
CREATE TABLE public.shopping_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  place_id UUID REFERENCES public.shopping_places(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'EM_ANDAMENTO',
  shared_with UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shopping_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own shopping sessions" ON public.shopping_sessions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Friends with whom session is shared can view/update
CREATE POLICY "Shared users can view sessions" ON public.shopping_sessions FOR SELECT
  USING (auth.uid() = ANY(shared_with));

CREATE POLICY "Shared users can update sessions" ON public.shopping_sessions FOR UPDATE
  USING (auth.uid() = ANY(shared_with));

-- 7. SESSION ITEMS (Itens da Sessão)
CREATE TABLE public.shopping_session_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.shopping_sessions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.shopping_products(id) ON DELETE CASCADE,
  brand TEXT,
  price_type TEXT NOT NULL DEFAULT 'UNITARIO',
  price NUMERIC NOT NULL DEFAULT 0,
  quantity NUMERIC NOT NULL DEFAULT 1,
  in_cart BOOLEAN DEFAULT false,
  observation TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shopping_session_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own session items" ON public.shopping_session_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.shopping_sessions s WHERE s.id = session_id AND (s.user_id = auth.uid() OR auth.uid() = ANY(s.shared_with))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.shopping_sessions s WHERE s.id = session_id AND (s.user_id = auth.uid() OR auth.uid() = ANY(s.shared_with))
  ));

-- Enable realtime for sessions and items (for shared lists)
ALTER PUBLICATION supabase_realtime ADD TABLE public.shopping_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shopping_session_items;

-- Indexes
CREATE INDEX idx_shopping_products_user ON public.shopping_products(user_id);
CREATE INDEX idx_shopping_products_segment ON public.shopping_products(segment);
CREATE INDEX idx_price_history_product ON public.shopping_price_history(product_id);
CREATE INDEX idx_price_history_place ON public.shopping_price_history(place_id);
CREATE INDEX idx_session_items_session ON public.shopping_session_items(session_id);
CREATE INDEX idx_template_items_template ON public.shopping_template_items(template_id);

-- Triggers for updated_at
CREATE TRIGGER update_shopping_places_updated_at BEFORE UPDATE ON public.shopping_places FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shopping_products_updated_at BEFORE UPDATE ON public.shopping_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shopping_templates_updated_at BEFORE UPDATE ON public.shopping_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shopping_sessions_updated_at BEFORE UPDATE ON public.shopping_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shopping_session_items_updated_at BEFORE UPDATE ON public.shopping_session_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
