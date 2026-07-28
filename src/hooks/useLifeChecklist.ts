import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, getDay, getDate, getMonth } from 'date-fns';

export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

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

export interface ChecklistCompletion {
  id: string;
  item_id: string;
  user_id: string;
  completed_date: string; // YYYY-MM-DD
}

/** Returns true if the item should appear today based on its recurrence rule */
function appearsToday(item: ChecklistItem, today: string): boolean {
  if (!item.active) return false;
  if (item.start_date > today) return false; // future item, don't show yet

  if (item.recurrence === 'none') return true; // shown until completed
  if (item.recurrence === 'daily') return true;

  const start = new Date(item.start_date + 'T12:00:00');
  const now = new Date(today + 'T12:00:00');

  if (item.recurrence === 'weekly') {
    return getDay(start) === getDay(now);
  }
  if (item.recurrence === 'monthly') {
    return getDate(start) === getDate(now);
  }
  if (item.recurrence === 'yearly') {
    return getMonth(start) === getMonth(now) && getDate(start) === getDate(now);
  }
  return false;
}

export function useLifeChecklist() {
  const { user } = useAuth();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [completions, setCompletions] = useState<ChecklistCompletion[]>([]);
  const [loading, setLoading] = useState(true);

  const today = format(new Date(), 'yyyy-MM-dd');

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

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /** Items that appear today, split into pending and done */
  const { todayItems, pendingItems, doneItems } = useMemo(() => {
    const todayItems = items.filter(item => appearsToday(item, today));

    const isCompletedToday = (item: ChecklistItem) => {
      if (item.recurrence === 'none') {
        // Done if ANY completion exists
        return completions.some(c => c.item_id === item.id);
      }
      // Done if completed today
      return completions.some(c => c.item_id === item.id && c.completed_date === today);
    };

    const pendingItems = todayItems.filter(i => !isCompletedToday(i));
    const doneItems = todayItems.filter(i => isCompletedToday(i));

    return { todayItems, pendingItems, doneItems };
  }, [items, completions, today]);

  const isCompletedToday = useCallback((itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return false;
    if (item.recurrence === 'none') {
      return completions.some(c => c.item_id === itemId);
    }
    return completions.some(c => c.item_id === itemId && c.completed_date === today);
  }, [items, completions, today]);

  const toggleComplete = useCallback(async (itemId: string) => {
    if (!user) return;
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const checkDate = item.recurrence === 'none' ? null : today;

    // Find existing completion
    const existing = item.recurrence === 'none'
      ? completions.find(c => c.item_id === itemId)
      : completions.find(c => c.item_id === itemId && c.completed_date === today);

    if (existing) {
      // Un-tick: remove completion
      await supabase
        .from('life_checklist_completions')
        .delete()
        .eq('id', existing.id);
      setCompletions(prev => prev.filter(c => c.id !== existing.id));
    } else {
      // Tick: add completion
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

  const addItem = useCallback(async (title: string, recurrence: Recurrence) => {
    if (!user || !title.trim()) return null;
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

  const deleteItem = useCallback(async (itemId: string) => {
    await supabase
      .from('life_checklist_items')
      .update({ active: false })
      .eq('id', itemId);
    setItems(prev => prev.filter(i => i.id !== itemId));
    setCompletions(prev => prev.filter(c => c.item_id !== itemId));
  }, []);

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
