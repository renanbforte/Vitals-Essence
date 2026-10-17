// ============================================================================
// useRestaurants  —  MAPA DE RESTAURANTES
// ----------------------------------------------------------------------------
// Cuida da lista de restaurantes que o usuário quer conhecer ou já foi:
// criar, editar, marcar como "já fui", excluir. Ao salvar, tenta descobrir as
// coordenadas (lat/lng) a partir do link do Google Maps ou do endereço, para
// o lugar aparecer no mapa.
// ============================================================================
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { resolveLocation } from '@/lib/geocode';

export type RestaurantStatus = 'want' | 'visited';

// Um restaurante no mapa.
export interface Restaurant {
  id: string;
  name: string;
  category: string;
  status: RestaurantStatus;
  address: string | null;
  instagram: string | null;
  maps_url: string | null;
  price: number | null;
  notes: string | null;
  rating: number | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
  updated_at: string;
}

// Dados que o formulário envia (só o nome é obrigatório).
export interface RestaurantInput {
  name: string;
  category?: string;
  status?: RestaurantStatus;
  address?: string | null;
  instagram?: string | null;
  maps_url?: string | null;
  price?: number | null;
  notes?: string | null;
  rating?: number | null;
}

export function useRestaurants() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  // Busca todos os restaurantes do usuário, dos mais recentes aos mais antigos.
  const fetchRestaurants = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Erro ao buscar restaurantes:', error);
    } else {
      setRestaurants((data || []) as Restaurant[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchRestaurants(); }, [fetchRestaurants]);

  // Cria um restaurante. Antes de salvar, tenta achar a posição no mapa a partir
  // do link do Google Maps ou do endereço digitado.
  const addRestaurant = async (input: RestaurantInput) => {
    if (!user) return;
    const point = await resolveLocation(input.address, input.maps_url);
    const { error } = await supabase.from('restaurants').insert({
      user_id: user.id,
      name: input.name,
      category: input.category || 'japones',
      status: input.status || 'want',
      address: input.address || null,
      instagram: input.instagram || null,
      maps_url: input.maps_url || null,
      price: input.price ?? null,
      notes: input.notes || null,
      rating: input.rating ?? null,
      lat: point?.lat ?? null,
      lng: point?.lng ?? null,
    });
    if (error) {
      toast({ title: 'Erro ao adicionar restaurante', description: error.message, variant: 'destructive' });
    } else {
      toast({
        title: 'Restaurante adicionado 🍽️',
        description: point ? 'Já aparece no mapa.' : 'Não achei a localização — confira o endereço ou o link do Maps.',
      });
      fetchRestaurants();
    }
  };

  // Atualiza um restaurante. Se o endereço ou o link do Maps mudou, recalcula a posição.
  const updateRestaurant = async (id: string, updates: Partial<RestaurantInput>, recalcLocation = false) => {
    if (!user) return;
    const payload: Record<string, unknown> = { ...updates };
    if (recalcLocation) {
      const point = await resolveLocation(updates.address, updates.maps_url);
      payload.lat = point?.lat ?? null;
      payload.lng = point?.lng ?? null;
    }
    const { error } = await supabase
      .from('restaurants')
      .update(payload)
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    } else {
      fetchRestaurants();
    }
  };

  // Alterna entre "quero ir" e "já fui".
  const toggleVisited = async (r: Restaurant) => {
    await updateRestaurant(r.id, { status: r.status === 'visited' ? 'want' : 'visited' });
    toast({ title: r.status === 'visited' ? 'Voltou para "Quero ir"' : 'Marcado como visitado ✅' });
  };

  // Exclui um restaurante.
  const deleteRestaurant = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('restaurants').delete().eq('id', id).eq('user_id', user.id);
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Restaurante removido' });
      fetchRestaurants();
    }
  };

  return { restaurants, loading, addRestaurant, updateRestaurant, toggleVisited, deleteRestaurant, refetch: fetchRestaurants };
}
