// ============================================================================
// useShoppingData.ts  —  MÓDULO DE COMPRAS (MERCADO E HISTÓRICO DE PREÇOS)
// ----------------------------------------------------------------------------
// Reúne vários hooks do módulo de compras: lugares (mercados), produtos, histórico
// de preços, modelos de lista (templates) e sessões de compra em andamento. Usa o
// React Query para buscar/gravar no Supabase e manter a tela sempre atualizada.
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// --- Formatos (tipos) dos dados usados no módulo de compras ---
// Lugar de compra (ex.: um mercado ou feira).
export interface ShoppingPlace {
  id: string;
  user_id: string;
  name: string;
  place_type: string | null;
  address: string | null;
  active: boolean;
}

// Produto (nome em MAIÚSCULAS, segmento/categoria e unidade padrão).
export interface ShoppingProduct {
  id: string;
  user_id: string;
  name_caps: string;
  segment: string;
  default_unit: string;
  active: boolean;
}

// Registro histórico de um preço pago por um produto, em um lugar e data.
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

// Modelo de lista de compras reutilizável (ex.: "Lista base do mercado").
export interface ShoppingTemplate {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

// Item que compõe um modelo de lista, com ordem e quantidade sugerida.
export interface TemplateItem {
  id: string;
  template_id: string;
  product_id: string;
  order_index: number;
  suggested_quantity: number;
}

// Sessão de compra: uma "ida ao mercado" em andamento, com status e
// possibilidade de compartilhamento com outras pessoas.
export interface ShoppingSession {
  id: string;
  user_id: string;
  title: string;
  place_id: string | null;
  status: string;
  shared_with: string[];
  created_at: string;
}

// Item dentro de uma sessão de compra (com preço, quantidade e se já está no carrinho).
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

// Categorias (segmentos) fixas usadas para organizar os produtos na lista.
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

// Lista pronta de produtos comuns, já separados por categoria. Serve para
// preencher automaticamente a lista base do usuário na primeira vez (ver seedDefaults).
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

// Hook dos LUGARES de compra (mercados). Lista os lugares ativos e permite
// criar, atualizar e "remover" (na verdade, apenas marca como inativo).
export function useShoppingPlaces() {
  const { user } = useAuth();
  const qc = useQueryClient(); // controla o cache do React Query
  const { toast } = useToast();

  // Busca os lugares ativos do usuário, em ordem alfabética.
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
    enabled: !!user, // só busca se houver usuário logado
  });

  // Cria um novo lugar; ao terminar, atualiza a lista e avisa na tela.
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

  // Atualiza os dados de um lugar existente.
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

  // "Remove" o lugar apenas marcando-o como inativo (não apaga do banco, preservando o histórico).
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shopping_places').update({ active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shopping-places'] }),
  });

  return { places: query.data || [], isLoading: query.isLoading, create, update, remove };
}

// Hook dos PRODUTOS. Lista os produtos ativos, cria novos, remove (inativa) e
// tem o "seedDefaults" que preenche a lista base com produtos comuns.
export function useShoppingProducts() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  // Busca os produtos ativos, ordenados por categoria e depois por nome.
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

  // Cria um produto novo, garantindo que o nome fique em MAIÚSCULAS.
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

  // Preenche a lista inicial: insere todos os produtos padrão e cria um template
  // "LISTA BASE – MERCADO" já com todos esses produtos como itens.
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

      // Cria o template padrão que agrupará todos os produtos recém-inseridos.
      const { data: template, error: tErr } = await supabase
        .from('shopping_templates')
        .insert({ name: 'LISTA BASE – MERCADO', user_id: user!.id })
        .select()
        .single();
      if (tErr) throw tErr;

      // Liga cada produto criado ao template, na ordem em que foram inseridos.
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

  // "Remove" um produto marcando-o como inativo (preserva o histórico de preços).
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shopping_products').update({ active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shopping-products'] }),
  });

  return { products: query.data || [], isLoading: query.isLoading, create, seedDefaults, remove };
}

// Hook do HISTÓRICO DE PREÇOS de um produto: retorna as últimas 50 compras,
// da mais recente para a mais antiga.
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

// Hook dos MELHORES PREÇOS: para uma lista de produtos, calcula o menor preço já
// pago (bestEver) e, se um lugar for informado, o melhor e o mais recente preço
// naquele lugar (bestAtPlace/lastAtPlace). Ajuda a saber onde compensa comprar.
export function useBestPrices(productIds: string[], placeId?: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['best-prices', productIds, placeId],
    queryFn: async () => {
      if (productIds.length === 0) return {};

      // Traz todo o histórico desses produtos, do preço mais barato ao mais caro.
      const { data, error } = await supabase
        .from('shopping_price_history')
        .select('*')
        .eq('user_id', user!.id)
        .in('product_id', productIds)
        .order('unit_price', { ascending: true });
      if (error) throw error;

      // Percorre o histórico montando, por produto, os "melhores preços" de interesse.
      const result: Record<string, { bestEver?: PriceHistory; bestAtPlace?: PriceHistory; lastAtPlace?: PriceHistory }> = {};

      for (const row of (data || []) as PriceHistory[]) {
        if (!result[row.product_id]) result[row.product_id] = {};
        const entry = result[row.product_id];

        // Menor preço já pago em qualquer lugar.
        if (!entry.bestEver || row.unit_price < entry.bestEver.unit_price) {
          entry.bestEver = row;
        }

        // Considerando apenas o lugar escolhido: guarda o mais barato e o mais recente.
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

// Hook dos MODELOS DE LISTA (templates). Lista, cria e apaga modelos que servem
// de base para montar novas sessões de compra rapidamente.
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

// Hook dos ITENS de um modelo de lista: lista os itens do template e permite
// adicionar ou remover produtos daquele modelo.
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

// Hook das SESSÕES DE COMPRA (as "idas ao mercado"). Lista, cria (podendo partir
// de um template), atualiza, apaga e finaliza a compra salvando os preços no histórico.
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

  // Cria uma nova sessão de compra. Se veio de um template, copia os itens do modelo.
  const create = useMutation({
    mutationFn: async (input: { title: string; place_id?: string; templateId?: string }) => {
      const { data: session, error } = await supabase
        .from('shopping_sessions')
        .insert({ title: input.title, place_id: input.place_id || null, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;

      // Se a sessão foi criada a partir de um modelo, copia os itens dele para a sessão.
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

  // Atualiza dados da sessão (título, lugar, status, compartilhamento).
  const updateSession = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; place_id?: string | null; status?: string; shared_with?: string[]; title?: string }) => {
      const { error } = await supabase.from('shopping_sessions').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shopping-sessions'] }),
  });

  // Apaga a sessão de compra definitivamente.
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shopping_sessions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shopping-sessions'] }),
  });

  // Finaliza a compra: exige um lugar selecionado, registra no histórico de preços
  // tudo que estava no carrinho e marca a sessão como "FINALIZADA".
  const finalize = useMutation({
    mutationFn: async (sessionId: string) => {
      // Busca a sessão; sem um lugar definido, não é possível salvar o histórico de preços.
      const { data: session } = await supabase
        .from('shopping_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      if (!session || !session.place_id) throw new Error('Selecione um lugar antes de finalizar');

      // Pega apenas os itens que foram colocados no carrinho.
      const { data: items } = await supabase
        .from('shopping_session_items')
        .select('*')
        .eq('session_id', sessionId)
        .eq('in_cart', true);

      // Para cada item comprado, cria uma linha no histórico de preços (com a data de hoje).
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

      // Marca a sessão como concluída.
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

// Hook dos ITENS de uma sessão de compra: lista os itens do carrinho/lista e
// permite adicionar, atualizar (preço, quantidade, marcar no carrinho) e remover.
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
