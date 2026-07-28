import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Types
export interface ShoppingPlace {
  id: string;
  user_id: string;
  name: string;
  place_type: string | null;
  address: string | null;
  active: boolean;
}

export interface ShoppingProduct {
  id: string;
  user_id: string;
  name_caps: string;
  segment: string;
  default_unit: string;
  active: boolean;
}

export interface PriceHistory {
  id: string;
  product_id: string;
  place_id: string;
  purchase_date: string;
  brand: string | null;
  price_type: string;
  unit_price: number;
  observation: string | null;
}

export interface ShoppingTemplate {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface TemplateItem {
  id: string;
  template_id: string;
  product_id: string;
  order_index: number;
  suggested_quantity: number;
}

export interface ShoppingSession {
  id: string;
  user_id: string;
  title: string;
  place_id: string | null;
  status: string;
  shared_with: string[];
  created_at: string;
}

export interface SessionItem {
  id: string;
  session_id: string;
  product_id: string;
  brand: string | null;
  price_type: string;
  price: number;
  quantity: number;
  in_cart: boolean;
  observation: string | null;
  order_index: number;
}

export const SEGMENTS = [
  'MERCEARIA',
  'PADARIA E LATICÍNIOS',
  'PROTEÍNAS E FRIOS',
  'HORTIFRUTI',
  'BEBIDAS',
  'LIMPEZA CASA',
  'LAVANDERIA',
  'HIGIENE PESSOAL',
] as const;

const DEFAULT_PRODUCTS: { name: string; segment: string }[] = [
  // MERCEARIA
  { name: 'ARROZ', segment: 'MERCEARIA' },
  { name: 'FEIJÃO', segment: 'MERCEARIA' },
  { name: 'MACARRÃO (ESPAGUETE)', segment: 'MERCEARIA' },
  { name: 'MACARRÃO (PARAFUSO)', segment: 'MERCEARIA' },
  { name: 'MOLHO DE TOMATE', segment: 'MERCEARIA' },
  { name: 'ÓLEO', segment: 'MERCEARIA' },
  { name: 'AZEITE', segment: 'MERCEARIA' },
  { name: 'SAL', segment: 'MERCEARIA' },
  { name: 'AÇÚCAR', segment: 'MERCEARIA' },
  { name: 'FARINHA DE TRIGO', segment: 'MERCEARIA' },
  { name: 'CAFÉ', segment: 'MERCEARIA' },
  { name: 'CHÁ', segment: 'MERCEARIA' },
  // PADARIA E LATICÍNIOS
  { name: 'LEITE', segment: 'PADARIA E LATICÍNIOS' },
  { name: 'PÃO DE FORMA', segment: 'PADARIA E LATICÍNIOS' },
  { name: 'PÃO FRANCÊS', segment: 'PADARIA E LATICÍNIOS' },
  { name: 'MANTEIGA', segment: 'PADARIA E LATICÍNIOS' },
  { name: 'MARGARINA', segment: 'PADARIA E LATICÍNIOS' },
  // PROTEÍNAS E FRIOS
  { name: 'OVOS', segment: 'PROTEÍNAS E FRIOS' },
  { name: 'PEITO DE FRANGO', segment: 'PROTEÍNAS E FRIOS' },
  { name: 'CARNE MOÍDA', segment: 'PROTEÍNAS E FRIOS' },
  { name: 'BIFE', segment: 'PROTEÍNAS E FRIOS' },
  { name: 'SARDINHA', segment: 'PROTEÍNAS E FRIOS' },
  { name: 'ATUM ENLATADO', segment: 'PROTEÍNAS E FRIOS' },
  { name: 'PRESUNTO', segment: 'PROTEÍNAS E FRIOS' },
  { name: 'QUEIJO', segment: 'PROTEÍNAS E FRIOS' },
  { name: 'HAMBÚRGUER CONGELADO', segment: 'PROTEÍNAS E FRIOS' },
  { name: 'NUGGETS', segment: 'PROTEÍNAS E FRIOS' },
  // HORTIFRUTI
  { name: 'ALFACE', segment: 'HORTIFRUTI' },
  { name: 'TOMATE', segment: 'HORTIFRUTI' },
  { name: 'CEBOLA', segment: 'HORTIFRUTI' },
  { name: 'BATATA', segment: 'HORTIFRUTI' },
  { name: 'CENOURA', segment: 'HORTIFRUTI' },
  { name: 'ALHO', segment: 'HORTIFRUTI' },
  { name: 'BANANA', segment: 'HORTIFRUTI' },
  { name: 'MAÇÃ', segment: 'HORTIFRUTI' },
  { name: 'LARANJA', segment: 'HORTIFRUTI' },
  { name: 'MEXERICA', segment: 'HORTIFRUTI' },
  { name: 'MAMÃO', segment: 'HORTIFRUTI' },
  { name: 'MORANGO', segment: 'HORTIFRUTI' },
  { name: 'LIMÃO', segment: 'HORTIFRUTI' },
  // BEBIDAS
  { name: 'SUCO', segment: 'BEBIDAS' },
  { name: 'REFRIGERANTE', segment: 'BEBIDAS' },
  { name: 'ÁGUA COM GÁS', segment: 'BEBIDAS' },
  // LIMPEZA CASA
  { name: 'PAPEL TOALHA', segment: 'LIMPEZA CASA' },
  { name: 'GUARDANAPO', segment: 'LIMPEZA CASA' },
  { name: 'DETERGENTE', segment: 'LIMPEZA CASA' },
  { name: 'ESPONJA MULTIUSO', segment: 'LIMPEZA CASA' },
  { name: 'DESINFETANTE', segment: 'LIMPEZA CASA' },
  { name: 'PANOS DE CHÃO', segment: 'LIMPEZA CASA' },
  { name: 'SACOS DE LIXO', segment: 'LIMPEZA CASA' },
  { name: 'ÁGUA SANITÁRIA', segment: 'LIMPEZA CASA' },
  { name: 'ESCOVA SANITÁRIA', segment: 'LIMPEZA CASA' },
  { name: 'LIMPADOR DE VASO SANITÁRIO', segment: 'LIMPEZA CASA' },
  { name: 'DESINFETANTE PERFUMADO', segment: 'LIMPEZA CASA' },
  // LAVANDERIA
  { name: 'SABÃO EM PÓ', segment: 'LAVANDERIA' },
  { name: 'SABÃO LÍQUIDO', segment: 'LAVANDERIA' },
  { name: 'AMACIANTE', segment: 'LAVANDERIA' },
  // HIGIENE PESSOAL
  { name: 'PAPEL HIGIÊNICO', segment: 'HIGIENE PESSOAL' },
  { name: 'SHAMPOO', segment: 'HIGIENE PESSOAL' },
  { name: 'CONDICIONADOR', segment: 'HIGIENE PESSOAL' },
  { name: 'SABONETE', segment: 'HIGIENE PESSOAL' },
  { name: 'PASTA DE DENTE', segment: 'HIGIENE PESSOAL' },
  { name: 'ESCOVA DE DENTES', segment: 'HIGIENE PESSOAL' },
  { name: 'DESODORANTE', segment: 'HIGIENE PESSOAL' },
  { name: 'FIO DENTAL', segment: 'HIGIENE PESSOAL' },
  { name: 'LÂMINA DE BARBEAR', segment: 'HIGIENE PESSOAL' },
];

export function useShoppingPlaces() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['shopping-places', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shopping_places')
        .select('*')
        .eq('user_id', user!.id)
        .eq('active', true)
        .order('name');
      if (error) throw error;
      return data as ShoppingPlace[];
    },
    enabled: !!user,
  });

  const create = useMutation({
    mutationFn: async (place: { name: string; place_type?: string; address?: string }) => {
      const { data, error } = await supabase
        .from('shopping_places')
        .insert({ ...place, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shopping-places'] });
      toast({ title: 'Lugar adicionado!' });
    },
  });

  const update = useMutation({
    mutationFn: async (place: { id: string; name?: string; place_type?: string; address?: string }) => {
      const { id, ...rest } = place;
      const { error } = await supabase.from('shopping_places').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shopping-places'] });
      toast({ title: 'Lugar atualizado!' });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shopping_places').update({ active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shopping-places'] }),
  });

  return { places: query.data || [], isLoading: query.isLoading, create, update, remove };
}

export function useShoppingProducts() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['shopping-products', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shopping_products')
        .select('*')
        .eq('user_id', user!.id)
        .eq('active', true)
        .order('segment')
        .order('name_caps');
      if (error) throw error;
      return data as ShoppingProduct[];
    },
    enabled: !!user,
  });

  const create = useMutation({
    mutationFn: async (product: { name_caps: string; segment: string; default_unit?: string }) => {
      const { data, error } = await supabase
        .from('shopping_products')
        .insert({ ...product, name_caps: product.name_caps.toUpperCase(), user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shopping-products'] });
    },
  });

  const seedDefaults = useMutation({
    mutationFn: async () => {
      const rows = DEFAULT_PRODUCTS.map(p => ({
        user_id: user!.id,
        name_caps: p.name,
        segment: p.segment,
        default_unit: 'UN' as const,
      }));
      const { data: insertedProducts, error } = await supabase
        .from('shopping_products')
        .insert(rows)
        .select();
      if (error) throw error;

      // Create default template with all products
      const { data: template, error: tErr } = await supabase
        .from('shopping_templates')
        .insert({ name: 'LISTA BASE – MERCADO', user_id: user!.id })
        .select()
        .single();
      if (tErr) throw tErr;

      if (insertedProducts && template) {
        const templateItems = insertedProducts.map((p: any, idx: number) => ({
          template_id: template.id,
          product_id: p.id,
          order_index: idx,
          suggested_quantity: 1,
        }));
        const { error: tiErr } = await supabase.from('shopping_template_items').insert(templateItems);
        if (tiErr) throw tiErr;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shopping-products'] });
      qc.invalidateQueries({ queryKey: ['shopping-templates'] });
      qc.invalidateQueries({ queryKey: ['template-items'] });
      toast({ title: 'Produtos e template padrão criados!' });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shopping_products').update({ active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shopping-products'] }),
  });

  return { products: query.data || [], isLoading: query.isLoading, create, seedDefaults, remove };
}

export function usePriceHistory(productId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['price-history', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shopping_price_history')
        .select('*')
        .eq('product_id', productId!)
        .eq('user_id', user!.id)
        .order('purchase_date', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as PriceHistory[];
    },
    enabled: !!user && !!productId,
  });
}

export function useBestPrices(productIds: string[], placeId?: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['best-prices', productIds, placeId],
    queryFn: async () => {
      if (productIds.length === 0) return {};

      const { data, error } = await supabase
        .from('shopping_price_history')
        .select('*')
        .eq('user_id', user!.id)
        .in('product_id', productIds)
        .order('unit_price', { ascending: true });
      if (error) throw error;

      const result: Record<string, { bestEver?: PriceHistory; bestAtPlace?: PriceHistory; lastAtPlace?: PriceHistory }> = {};

      for (const row of (data || []) as PriceHistory[]) {
        if (!result[row.product_id]) result[row.product_id] = {};
        const entry = result[row.product_id];

        // Best ever
        if (!entry.bestEver || row.unit_price < entry.bestEver.unit_price) {
          entry.bestEver = row;
        }

        // Best/last at specific place
        if (placeId && row.place_id === placeId) {
          if (!entry.bestAtPlace || row.unit_price < entry.bestAtPlace.unit_price) {
            entry.bestAtPlace = row;
          }
          if (!entry.lastAtPlace || row.purchase_date > entry.lastAtPlace.purchase_date) {
            entry.lastAtPlace = row;
          }
        }
      }

      return result;
    },
    enabled: !!user && productIds.length > 0,
  });
}

export function useShoppingTemplates() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['shopping-templates', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shopping_templates')
        .select('*')
        .eq('user_id', user!.id)
        .order('name');
      if (error) throw error;
      return data as ShoppingTemplate[];
    },
    enabled: !!user,
  });

  const create = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('shopping_templates')
        .insert({ name, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shopping-templates'] });
      toast({ title: 'Template criado!' });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shopping_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shopping-templates'] }),
  });

  return { templates: query.data || [], isLoading: query.isLoading, create, remove };
}

export function useTemplateItems(templateId?: string) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['template-items', templateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shopping_template_items')
        .select('*')
        .eq('template_id', templateId!)
        .order('order_index');
      if (error) throw error;
      return data as TemplateItem[];
    },
    enabled: !!templateId,
  });

  const addItem = useMutation({
    mutationFn: async (item: { template_id: string; product_id: string; order_index?: number; suggested_quantity?: number }) => {
      const { error } = await supabase.from('shopping_template_items').insert(item);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['template-items'] }),
  });

  const removeItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shopping_template_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['template-items'] }),
  });

  return { items: query.data || [], isLoading: query.isLoading, addItem, removeItem };
}

export function useShoppingSessions() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['shopping-sessions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shopping_sessions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ShoppingSession[];
    },
    enabled: !!user,
  });

  const create = useMutation({
    mutationFn: async (input: { title: string; place_id?: string; templateId?: string }) => {
      const { data: session, error } = await supabase
        .from('shopping_sessions')
        .insert({ title: input.title, place_id: input.place_id || null, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;

      // If from template, copy items
      if (input.templateId) {
        const { data: templateItems } = await supabase
          .from('shopping_template_items')
          .select('*')
          .eq('template_id', input.templateId)
          .order('order_index');

        if (templateItems && templateItems.length > 0) {
          const sessionItems = templateItems.map((ti: any) => ({
            session_id: session.id,
            product_id: ti.product_id,
            quantity: ti.suggested_quantity || 1,
            order_index: ti.order_index || 0,
          }));
          await supabase.from('shopping_session_items').insert(sessionItems);
        }
      }

      return session;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shopping-sessions'] });
      toast({ title: 'Sessão de compra criada!' });
    },
  });

  const updateSession = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; place_id?: string | null; status?: string; shared_with?: string[]; title?: string }) => {
      const { error } = await supabase.from('shopping_sessions').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shopping-sessions'] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shopping_sessions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shopping-sessions'] }),
  });

  const finalize = useMutation({
    mutationFn: async (sessionId: string) => {
      // Get session with place
      const { data: session } = await supabase
        .from('shopping_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      if (!session || !session.place_id) throw new Error('Selecione um lugar antes de finalizar');

      // Get items in cart
      const { data: items } = await supabase
        .from('shopping_session_items')
        .select('*')
        .eq('session_id', sessionId)
        .eq('in_cart', true);

      if (items && items.length > 0) {
        const historyRows = items.map((item: any) => ({
          user_id: user!.id,
          product_id: item.product_id,
          place_id: session.place_id,
          purchase_date: new Date().toISOString().split('T')[0],
          brand: item.brand,
          price_type: item.price_type,
          unit_price: item.price,
        }));
        await supabase.from('shopping_price_history').insert(historyRows);
      }

      // Update status
      await supabase.from('shopping_sessions').update({ status: 'FINALIZADA' }).eq('id', sessionId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shopping-sessions'] });
      qc.invalidateQueries({ queryKey: ['best-prices'] });
      toast({ title: 'Compra finalizada! Histórico salvo.' });
    },
  });

  return { sessions: query.data || [], isLoading: query.isLoading, create, updateSession, remove, finalize };
}

export function useSessionItems(sessionId?: string) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['session-items', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shopping_session_items')
        .select('*')
        .eq('session_id', sessionId!)
        .order('order_index');
      if (error) throw error;
      return data as SessionItem[];
    },
    enabled: !!sessionId,
  });

  const addItem = useMutation({
    mutationFn: async (item: Partial<SessionItem> & { session_id: string; product_id: string }) => {
      const { error } = await supabase.from('shopping_session_items').insert(item);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['session-items'] }),
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<SessionItem>) => {
      const { error } = await supabase.from('shopping_session_items').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['session-items'] }),
  });

  const removeItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shopping_session_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['session-items'] }),
  });

  return { items: query.data || [], isLoading: query.isLoading, addItem, updateItem, removeItem };
}
