// ============================================================================
// usePlaces  —  LUGARES NO MAPA (quero ir / já fui)
// ----------------------------------------------------------------------------
// Cuida de uma lista de lugares que o usuário quer conhecer ou já foi, mostrada
// num mapa. É genérico: o mesmo mecanismo serve para restaurantes (módulo
// Encontros) e para pontos de viagem (módulo Viagens). O "scope" separa um do
// outro. Ao salvar, tenta descobrir as coordenadas (lat/lng) a partir do link
// do Google Maps ou do endereço, para o lugar aparecer no mapa.
// ============================================================================
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { resolveLocation } from '@/lib/geocode';

export type PlaceStatus = 'want' | 'visited';

// Um lugar no mapa.
export interface Place {
  id: string;
  scope: string;
  name: string;
  category: string;
  status: PlaceStatus;
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
export interface PlaceInput {
  name: string;
  category?: string;
  status?: PlaceStatus;
  address?: string | null;
  instagram?: string | null;
  maps_url?: string | null;
  price?: number | null;
  notes?: string | null;
  rating?: number | null;
}

// scope: 'restaurant' (Encontros) ou 'travel' (Viagens). defaultCategory é a
// categoria inicial de um lugar novo nesse contexto.
export function usePlaces(scope: string, defaultCategory: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  // Busca os lugares do usuário neste escopo, dos mais recentes aos mais antigos.
  const fetchPlaces = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('user_id', user.id)
      .eq('scope', scope)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Erro ao buscar lugares:', error);
    } else {
      setPlaces((data || []) as Place[]);
    }
    setLoading(false);
  }, [user, scope]);

  useEffect(() => { fetchPlaces(); }, [fetchPlaces]);

  // Cria um lugar. Antes de salvar, tenta achar a posição no mapa a partir do
  // link do Google Maps ou do endereço digitado.
  const addPlace = async (input: PlaceInput) => {
    if (!user) return;
    const point = await resolveLocation(input.address, input.maps_url);
    const { error } = await supabase.from('restaurants').insert({
      user_id: user.id,
      scope,
      name: input.name,
      category: input.category || defaultCategory,
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
      toast({ title: 'Erro ao adicionar', description: error.message, variant: 'destructive' });
    } else {
      toast({
        title: 'Lugar adicionado 📍',
        description: point ? 'Já aparece no mapa.' : 'Não achei a localização — confira o endereço ou o link do Maps.',
      });
      fetchPlaces();
    }
  };

  // Atualiza um lugar. Se o endereço ou o link do Maps mudou, recalcula a posição.
  const updatePlace = async (id: string, updates: Partial<PlaceInput>, recalcLocation = false) => {
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
      fetchPlaces();
    }
  };

  // Alterna entre "quero ir" e "já fui".
  const toggleVisited = async (p: Place) => {
    await updatePlace(p.id, { status: p.status === 'visited' ? 'want' : 'visited' });
    toast({ title: p.status === 'visited' ? 'Voltou para "Quero ir"' : 'Marcado como visitado ✅' });
  };

  // Exclui um lugar.
  const deletePlace = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('restaurants').delete().eq('id', id).eq('user_id', user.id);
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Lugar removido' });
      fetchPlaces();
    }
  };

  return { places, loading, addPlace, updatePlace, toggleVisited, deletePlace, refetch: fetchPlaces };
}
