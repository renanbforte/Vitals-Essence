// ============================================================================
// useLifeChecklist.ts  —  CHECKLIST DA VIDA (TAREFAS RECORRENTES)
// ----------------------------------------------------------------------------
// Hook de uma lista de tarefas que podem se repetir (diaria, semanal, mensal,
// anual ou unica). Decide o que aparece HOJE, separa pendentes/feitas e permite
// marcar, adicionar e remover itens, salvando tudo no Supabase.
// ============================================================================

// Ferramentas do React, o cliente do banco Supabase, quem esta logado e utilidades de data.
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, getDay, getDate, getMonth } from 'date-fns';

// Os tipos de repeticao possiveis de uma tarefa.
export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

// Formato de uma tarefa da lista, como salva no banco.
export interface ChecklistItem {
  id: string;
  user_id: string;
  title: string;
  recurrence: Recurrence;
  start_date: string; // YYYY-MM-DD
  active: boolean;
  created_at: string;
  updated_at: string;
}

// Formato de um registro de "tarefa concluida" numa determinada data.
export interface ChecklistCompletion {
  id: string;
  item_id: string;
  user_id: string;
  completed_date: string; // YYYY-MM-DD
}

// Decide se uma tarefa deve aparecer HOJE, conforme sua regra de repeticao.
/** Returns true if the item should appear today based on its recurrence rule */
function appearsToday(item: ChecklistItem, today: string): boolean {
  if (!item.active) return false; // tarefa removida/desativada nao aparece
  if (item.start_date > today) return false; // future item, don't show yet

  if (item.recurrence === 'none') return true; // shown until completed
  if (item.recurrence === 'daily') return true; // aparece todo dia

  // Compara a data de inicio com hoje (meio-dia para evitar problemas de fuso horario).
  const start = new Date(item.start_date + 'T12:00:00');
  const now = new Date(today + 'T12:00:00');

  // Semanal: aparece se hoje cai no mesmo dia da semana em que comecou.
  if (item.recurrence === 'weekly') {
    return getDay(start) === getDay(now);
  }
  // Mensal: aparece se hoje e o mesmo dia do mes em que comecou.
  if (item.recurrence === 'monthly') {
    return getDate(start) === getDate(now);
  }
  // Anual: aparece se hoje e o mesmo dia e mes em que comecou.
  if (item.recurrence === 'yearly') {
    return getMonth(start) === getMonth(now) && getDate(start) === getDate(now);
  }
  return false;
}

// Hook principal do checklist: entrega os itens de hoje e as acoes para as telas.
export function useLifeChecklist() {
  const { user } = useAuth();
  // Estados: as tarefas, os registros de conclusao e o indicador de "carregando".
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [completions, setCompletions] = useState<ChecklistCompletion[]>([]);
  const [loading, setLoading] = useState(true);

  // Data de hoje no formato ANO-MES-DIA, usada em todas as comparacoes.
  const today = format(new Date(), 'yyyy-MM-dd');

  // Busca no banco, ao mesmo tempo, as tarefas ativas e todos os registros de conclusao.
  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [itemsRes, completionsRes] = await Promise.all([
      supabase
        .from('life_checklist_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true)
        .order('created_at', { ascending: true }),
      supabase
        .from('life_checklist_completions')
        .select('*')
        .eq('user_id', user.id),
    ]);

    if (!itemsRes.error && itemsRes.data) {
      setItems(itemsRes.data as ChecklistItem[]);
    }
    if (!completionsRes.error && completionsRes.data) {
      setCompletions(completionsRes.data as ChecklistCompletion[]);
    }
    setLoading(false);
  }, [user]);

  // Ao abrir a tela (ou trocar de usuario), carrega tudo.
  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Calcula as listas exibidas: o que aparece hoje, separado em pendentes e feitas.
  /** Items that appear today, split into pending and done */
  const { todayItems, pendingItems, doneItems } = useMemo(() => {
    const todayItems = items.filter(item => appearsToday(item, today));

    // Verifica se uma tarefa ja esta concluida (regra depende do tipo de repeticao).
    const isCompletedToday = (item: ChecklistItem) => {
      if (item.recurrence === 'none') {
        // Tarefa unica: feita se existir QUALQUER registro de conclusao.
        return completions.some(c => c.item_id === item.id);
      }
      // Tarefa recorrente: feita apenas se foi concluida hoje.
      return completions.some(c => c.item_id === item.id && c.completed_date === today);
    };

    const pendingItems = todayItems.filter(i => !isCompletedToday(i));
    const doneItems = todayItems.filter(i => isCompletedToday(i));

    return { todayItems, pendingItems, doneItems };
  }, [items, completions, today]);

  // Mesma verificacao de "esta concluida?", mas exposta para as telas consultarem por id.
  const isCompletedToday = useCallback((itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return false;
    if (item.recurrence === 'none') {
      return completions.some(c => c.item_id === itemId);
    }
    return completions.some(c => c.item_id === itemId && c.completed_date === today);
  }, [items, completions, today]);

  // Marca ou desmarca uma tarefa (liga/desliga a conclusao) e salva no banco.
  const toggleComplete = useCallback(async (itemId: string) => {
    if (!user) return;
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const checkDate = item.recurrence === 'none' ? null : today;

    // Procura se ja existe um registro de conclusao para desmarcar.
    const existing = item.recurrence === 'none'
      ? completions.find(c => c.item_id === itemId)
      : completions.find(c => c.item_id === itemId && c.completed_date === today);

    if (existing) {
      // Ja estava feita: desmarca removendo o registro do banco e da tela.
      await supabase
        .from('life_checklist_completions')
        .delete()
        .eq('id', existing.id);
      setCompletions(prev => prev.filter(c => c.id !== existing.id));
    } else {
      // Ainda nao estava feita: cria o registro de conclusao e adiciona na tela.
      const { data, error } = await supabase
        .from('life_checklist_completions')
        .insert({
          item_id: itemId,
          user_id: user.id,
          completed_date: checkDate ?? today,
        })
        .select()
        .single();
      if (!error && data) {
        setCompletions(prev => [...prev, data as ChecklistCompletion]);
      }
    }
  }, [user, items, completions, today]);

  // Adiciona uma nova tarefa a lista (comecando a valer a partir de hoje).
  const addItem = useCallback(async (title: string, recurrence: Recurrence) => {
    if (!user || !title.trim()) return null; // ignora titulo vazio
    const { data, error } = await supabase
      .from('life_checklist_items')
      .insert({
        user_id: user.id,
        title: title.trim(),
        recurrence,
        start_date: today,
        active: true,
      })
      .select()
      .single();
    if (!error && data) {
      setItems(prev => [...prev, data as ChecklistItem]);
      return data as ChecklistItem;
    }
    return null;
  }, [user, today]);

  // "Exclui" uma tarefa: na verdade so a desativa (active = false), preservando o historico.
  const deleteItem = useCallback(async (itemId: string) => {
    await supabase
      .from('life_checklist_items')
      .update({ active: false })
      .eq('id', itemId);
    // Remove da tela na hora, tanto a tarefa quanto seus registros de conclusao.
    setItems(prev => prev.filter(i => i.id !== itemId));
    setCompletions(prev => prev.filter(c => c.item_id !== itemId));
  }, []);

  // Entrega para as telas os itens de hoje (pendentes/feitos) e todas as acoes.
  return {
    loading,
    items,
    todayItems,
    pendingItems,
    doneItems,
    isCompletedToday,
    toggleComplete,
    addItem,
    deleteItem,
    refetch: fetchAll,
  };
}
