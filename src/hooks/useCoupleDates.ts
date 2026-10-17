// ============================================================================
// useCoupleDates  —  BUCKET LIST DE ENCONTROS DO CASAL
// ----------------------------------------------------------------------------
// Cuida da lista de ideias de encontro a dois: criar, editar, mudar de etapa
// (ideia -> planejado -> vivido) e excluir. Cada encontro guarda o local, como
// fazer, o que levar (checklist), o cronograma e, quando vivido, a avaliação.
// ============================================================================
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Um item da lista "o que levar" (pode ser marcado como já separado).
export interface DateItem {
  id: string;
  text: string;
  packed: boolean;
}

// Uma etapa do cronograma do encontro (horário + o que fazer).
export interface DateScheduleStep {
  id: string;
  time: string;     // ex.: "20:00"
  activity: string; // ex.: "Jantar no restaurante"
}

// Um custo do encontro: um local (ex.: Restaurante) ou um custo do caminho
// (gasolina, pedágio, estacionamento). Juntos formam o custo total.
export interface DateCost {
  id: string;
  kind: 'place' | 'travel'; // 'place' = local do encontro; 'travel' = custo do caminho
  label: string;            // nome do local ou do custo
  amount: number;
}

// Soma de todos os custos (locais + caminho).
export function totalDateCost(costs: DateCost[]): number {
  return costs.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
}

// Um encontro do casal, da ideia à memória.
export interface CoupleDate {
  id: string;
  title: string;
  category: string;
  status: 'idea' | 'planned' | 'done';
  location: string | null;
  how_to: string | null;
  notes: string | null;
  items: DateItem[];
  schedule: DateScheduleStep[];
  costs: DateCost[];
  cost_estimate: number | null;
  distance_km: number | null;
  planned_date: string | null;
  done_date: string | null;
  rating: number | null;
  created_at: string;
  updated_at: string;
}

// Dados que os formulários enviam (tudo opcional menos o título).
export interface CoupleDateInput {
  title: string;
  category?: string;
  status?: 'idea' | 'planned' | 'done';
  location?: string | null;
  how_to?: string | null;
  notes?: string | null;
  items?: DateItem[];
  schedule?: DateScheduleStep[];
  costs?: DateCost[];
  cost_estimate?: number | null;
  distance_km?: number | null;
  planned_date?: string | null;
  done_date?: string | null;
  rating?: number | null;
}

export function useCoupleDates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dates, setDates] = useState<CoupleDate[]>([]);
  const [loading, setLoading] = useState(true);

  // Busca todos os encontros do casal, dos mais recentes aos mais antigos.
  const fetchDates = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('couple_dates')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Erro ao buscar encontros:', error);
    } else {
      setDates((data || []).map(d => ({
        ...d,
        items: Array.isArray(d.items) ? (d.items as unknown as DateItem[]) : [],
        schedule: Array.isArray(d.schedule) ? (d.schedule as unknown as DateScheduleStep[]) : [],
        costs: Array.isArray((d as { costs?: unknown }).costs) ? ((d as { costs: unknown }).costs as DateCost[]) : [],
      })) as CoupleDate[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchDates(); }, [fetchDates]);

  // Cria um novo encontro (começa como ideia, salvo se indicado diferente).
  const addDate = async (input: CoupleDateInput) => {
    if (!user) return;
    const { error } = await supabase.from('couple_dates').insert({
      user_id: user.id,
      title: input.title,
      category: input.category || 'romantico',
      status: input.status || 'idea',
      location: input.location || null,
      how_to: input.how_to || null,
      notes: input.notes || null,
      items: (input.items || []) as never,
      schedule: (input.schedule || []) as never,
      costs: (input.costs || []) as never,
      cost_estimate: input.cost_estimate ?? null,
      distance_km: input.distance_km ?? null,
      planned_date: input.planned_date || null,
    });
    if (error) {
      toast({ title: 'Erro ao criar encontro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Encontro adicionado 💕' });
      fetchDates();
    }
  };

  // Atualiza campos de um encontro.
  const updateDate = async (id: string, updates: Partial<CoupleDateInput>) => {
    if (!user) return;
    const payload: Record<string, unknown> = { ...updates };
    if (updates.items) payload.items = updates.items as never;
    if (updates.schedule) payload.schedule = updates.schedule as never;
    if (updates.costs) payload.costs = updates.costs as never;
    const { error } = await supabase
      .from('couple_dates')
      .update(payload)
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    } else {
      fetchDates();
    }
  };

  // Marca como "vivido" (risca da lista) com a data e uma avaliação opcional.
  const markAsDone = async (id: string, rating?: number) => {
    await updateDate(id, {
      status: 'done',
      done_date: new Date().toISOString().split('T')[0],
      rating: rating ?? null,
    });
    toast({ title: 'Encontro vivido! ❤️' });
  };

  // Exclui um encontro da lista.
  const deleteDate = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('couple_dates').delete().eq('id', id).eq('user_id', user.id);
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Encontro removido' });
      fetchDates();
    }
  };

  return { dates, loading, addDate, updateDate, markAsDone, deleteDate, refetch: fetchDates };
}
