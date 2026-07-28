// ============================================================================
// useHydrationSchedule.ts  —  CRONOGRAMA DE HIDRATAÇÃO (LEMBRETES DE ÁGUA)
// ----------------------------------------------------------------------------
// Hook que gerencia os horários e quantidades de água que o usuário planeja
// beber ao longo do dia. Busca o cronograma no Supabase, cria um padrão para
// quem é novo e permite adicionar, editar e remover horários.
// ============================================================================

// Ferramentas do React, o cliente do banco (Supabase) e o login atual.
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Formato de cada item do cronograma: horário, quantidade em ml, um rótulo
// (ex.: "Almoço") e a ordem em que aparece na lista.
export interface HydrationEntry {
  id: string;
  user_id: string;
  schedule_time: string;
  amount_ml: number;
  label: string;
  order_index: number;
}

// Cronograma padrão dado a usuários novos: 8 momentos de hidratação ao longo do
// dia, do acordar até a noite.
const DEFAULT_SCHEDULE: Omit<HydrationEntry, 'id' | 'user_id'>[] = [
  { schedule_time: '07:00', amount_ml: 250, label: 'Ao acordar', order_index: 0 },
  { schedule_time: '09:00', amount_ml: 250, label: 'Manhã 1', order_index: 1 },
  { schedule_time: '11:00', amount_ml: 500, label: 'Manhã 2', order_index: 2 },
  { schedule_time: '13:00', amount_ml: 250, label: 'Almoço', order_index: 3 },
  { schedule_time: '15:00', amount_ml: 500, label: 'Tarde 1', order_index: 4 },
  { schedule_time: '17:00', amount_ml: 500, label: 'Tarde 2', order_index: 5 },
  { schedule_time: '19:00', amount_ml: 250, label: 'Noite 1', order_index: 6 },
  { schedule_time: '21:00', amount_ml: 500, label: 'Noite 2', order_index: 7 },
];

export function useHydrationSchedule() {
  // Usuário logado.
  const { user } = useAuth();
  // Lista de horários de hidratação e indicador de carregamento.
  const [schedule, setSchedule] = useState<HydrationEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Busca o cronograma do usuário no banco, já ordenado pela sequência definida.
  const fetchSchedule = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('user_hydration_schedule')
      .select('*')
      .eq('user_id', user.id)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching hydration schedule:', error);
    } else if (data && data.length > 0) {
      // Já existe cronograma salvo: usa ele.
      setSchedule(data as HydrationEntry[]);
    } else {
      // Usuário novo (sem horários): cria o cronograma padrão automaticamente.
      // Create default schedule for new users
      await createDefaultSchedule();
    }

    setLoading(false);
  }, [user]);

  // Cria e salva o cronograma padrão para o usuário atual.
  const createDefaultSchedule = async () => {
    if (!user) return;

    // Carimba cada item padrão com o ID do usuário antes de salvar.
    const entries = DEFAULT_SCHEDULE.map(entry => ({
      ...entry,
      user_id: user.id,
    }));

    const { data, error } = await supabase
      .from('user_hydration_schedule')
      .insert(entries)
      .select();

    if (error) {
      console.error('Error creating default schedule:', error);
    } else if (data) {
      setSchedule(data as HydrationEntry[]);
    }
  };

  // Edita um horário existente no banco e atualiza a lista na tela.
  const updateEntry = async (id: string, updates: Partial<HydrationEntry>) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_hydration_schedule')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating entry:', error);
    } else {
      // Atualiza só o item alterado na lista local, sem recarregar tudo.
      setSchedule(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    }
  };

  // Adiciona um novo horário de hidratação.
  const addEntry = async (entry: Omit<HydrationEntry, 'id' | 'user_id'>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_hydration_schedule')
      .insert({ ...entry, user_id: user.id })
      .select()
      .single();

    if (error) {
      console.error('Error adding entry:', error);
    } else if (data) {
      // Insere o novo item na lista e reordena pela sequência definida.
      setSchedule(prev => [...prev, data as HydrationEntry].sort((a, b) => a.order_index - b.order_index));
    }
  };

  // Remove um horário do cronograma.
  const deleteEntry = async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_hydration_schedule')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting entry:', error);
    } else {
      // Tira o item da lista local.
      setSchedule(prev => prev.filter(e => e.id !== id));
    }
  };

  // Ao usar o hook, carrega o cronograma (e recarrega se a busca mudar).
  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  // Soma total de ml planejados para o dia (usado para mostrar a meta diária).
  const totalScheduledMl = schedule.reduce((sum, e) => sum + e.amount_ml, 0);

  // Entrega os dados e as ações para a tela.
  return {
    schedule,
    loading,
    totalScheduledMl,
    updateEntry,
    addEntry,
    deleteEntry,
    refetch: fetchSchedule,
  };
}
