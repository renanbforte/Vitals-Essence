import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface GatheringEvent {
  id: string;
  user_id: string;
  title: string;
  event_type: string;
  event_date: string | null;
  location: string | null;
  description: string | null;
  split_mode: string;
  fixed_amount_per_person: number | null;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string;
  total_spent?: number;
  participant_count?: number;
}

export interface GatheringParticipant {
  id: string;
  event_id: string;
  user_id: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  status: string;
  is_external: boolean;
  created_at: string;
}

export interface GatheringExpense {
  id: string;
  event_id: string;
  added_by_user_id: string;
  expense_type: string;
  description: string;
  category: string | null;
  quantity: number;
  unit_price: number;
  total_amount: number;
  location: string | null;
  paid_by_participant_id: string | null;
  file_url: string | null;
  notes: string | null;
  include_in_split: boolean;
  parent_expense_id: string | null;
  is_group: boolean;
  created_at: string;
}

export interface GatheringTimelineEntry {
  id: string;
  event_id: string;
  actor_name: string;
  action: string;
  details: string | null;
  created_at: string;
}

export interface GatheringAdjustment {
  id: string;
  event_id: string;
  from_participant_id: string;
  to_participant_id: string;
  amount: number;
  description: string | null;
  created_at: string;
}

export function useGatheringEvents() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['gathering-events', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gathering_events')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Enrich with totals
      const ids = (data || []).map((e: any) => e.id);
      if (ids.length === 0) return [];

      const [expRes, partRes] = await Promise.all([
        supabase.from('gathering_expenses').select('event_id, total_amount').in('event_id', ids),
        supabase.from('gathering_participants').select('event_id').in('event_id', ids),
      ]);

      const costMap: Record<string, number> = {};
      for (const row of (expRes.data || []) as any[]) {
        costMap[row.event_id] = (costMap[row.event_id] || 0) + Number(row.total_amount || 0);
      }
      const countMap: Record<string, number> = {};
      for (const row of (partRes.data || []) as any[]) {
        countMap[row.event_id] = (countMap[row.event_id] || 0) + 1;
      }

      return (data as any[]).map((e) => ({
        ...e,
        total_spent: costMap[e.id] || 0,
        participant_count: countMap[e.id] || 0,
      })) as GatheringEvent[];
    },
    enabled: !!user,
  });

  const createEvent = useMutation({
    mutationFn: async (event: Partial<GatheringEvent>) => {
      const { data, error } = await supabase
        .from('gathering_events')
        .insert({ ...event, user_id: user!.id } as any)
        .select()
        .single();
      if (error) throw error;

      // Auto-add creator as participant
      const profile = await supabase.from('profiles').select('name').eq('user_id', user!.id).single();
      await supabase.from('gathering_participants').insert({
        event_id: data.id,
        user_id: user!.id,
        name: profile.data?.name || 'Eu',
        status: 'confirmed',
        is_external: false,
      } as any);

      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gathering-events'] }),
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<GatheringEvent> & { id: string }) => {
      const { error } = await supabase.from('gathering_events').update(updates as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gathering-events'] }),
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('gathering_events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gathering-events'] }),
  });

  return { ...query, createEvent, updateEvent, deleteEvent };
}

export interface GatheringExpenseSplit {
  id: string;
  expense_id: string;
  participant_id: string;
  created_at: string;
}

export function useGatheringDetail(eventId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const eventQuery = useQuery({
    queryKey: ['gathering-event', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gathering_events')
        .select('*')
        .eq('id', eventId!)
        .single();
      if (error) throw error;
      return data as unknown as GatheringEvent;
    },
    enabled: !!eventId && !!user,
  });

  const participantsQuery = useQuery({
    queryKey: ['gathering-participants', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gathering_participants')
        .select('*')
        .eq('event_id', eventId!)
        .order('created_at');
      if (error) throw error;
      return data as unknown as GatheringParticipant[];
    },
    enabled: !!eventId && !!user,
  });

  const expensesQuery = useQuery({
    queryKey: ['gathering-expenses', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gathering_expenses')
        .select('*')
        .eq('event_id', eventId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as GatheringExpense[];
    },
    enabled: !!eventId && !!user,
  });

  const splitsQuery = useQuery({
    queryKey: ['gathering-expense-splits', eventId],
    queryFn: async () => {
      // Get all expense ids for this event
      const expenseIds = (expensesQuery.data || []).map(e => e.id);
      if (expenseIds.length === 0) return [] as GatheringExpenseSplit[];
      const { data, error } = await supabase
        .from('gathering_expense_splits')
        .select('*')
        .in('expense_id', expenseIds);
      if (error) throw error;
      return data as unknown as GatheringExpenseSplit[];
    },
    enabled: !!eventId && !!user && !!expensesQuery.data,
  });

  const timelineQuery = useQuery({
    queryKey: ['gathering-timeline', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gathering_timeline')
        .select('*')
        .eq('event_id', eventId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as GatheringTimelineEntry[];
    },
    enabled: !!eventId && !!user,
  });

  const adjustmentsQuery = useQuery({
    queryKey: ['gathering-adjustments', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gathering_adjustments')
        .select('*')
        .eq('event_id', eventId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as GatheringAdjustment[];
    },
    enabled: !!eventId && !!user,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['gathering-event', eventId] });
    queryClient.invalidateQueries({ queryKey: ['gathering-participants', eventId] });
    queryClient.invalidateQueries({ queryKey: ['gathering-expenses', eventId] });
    queryClient.invalidateQueries({ queryKey: ['gathering-expense-splits', eventId] });
    queryClient.invalidateQueries({ queryKey: ['gathering-timeline', eventId] });
    queryClient.invalidateQueries({ queryKey: ['gathering-adjustments', eventId] });
    queryClient.invalidateQueries({ queryKey: ['gathering-events'] });
  };

  const addParticipant = useMutation({
    mutationFn: async (p: Partial<GatheringParticipant>) => {
      const { error } = await supabase.from('gathering_participants').insert({ ...p, event_id: eventId } as any);
      if (error) throw error;
    },
    onSuccess: invalidateAll,
  });

  const removeParticipant = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('gathering_participants').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidateAll,
  });

  const addExpense = useMutation({
    mutationFn: async (e: Partial<GatheringExpense> & { splitParticipantIds?: string[] }) => {
      const { splitParticipantIds, ...expenseData } = e;
      const { data, error } = await supabase.from('gathering_expenses').insert({
        ...expenseData,
        event_id: eventId,
        added_by_user_id: user!.id,
      } as any).select().single();
      if (error) throw error;

      // If specific participants selected (not all), save splits
      if (splitParticipantIds && splitParticipantIds.length > 0) {
        const splits = splitParticipantIds.map(pid => ({
          expense_id: data.id,
          participant_id: pid,
        }));
        const { error: splitError } = await supabase.from('gathering_expense_splits').insert(splits as any);
        if (splitError) throw splitError;
      }
    },
    onSuccess: invalidateAll,
  });

  const updateExpenseSplits = useMutation({
    mutationFn: async ({ expenseId, participantIds }: { expenseId: string; participantIds: string[] | null }) => {
      // Delete existing splits
      await supabase.from('gathering_expense_splits').delete().eq('expense_id', expenseId);
      // If null or empty, means "all" — no rows needed
      if (participantIds && participantIds.length > 0) {
        const splits = participantIds.map(pid => ({
          expense_id: expenseId,
          participant_id: pid,
        }));
        const { error } = await supabase.from('gathering_expense_splits').insert(splits as any);
        if (error) throw error;
      }
    },
    onSuccess: invalidateAll,
  });

  const updateExpense = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<GatheringExpense> & { id: string }) => {
      const { error } = await supabase.from('gathering_expenses').update(updates as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidateAll,
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('gathering_expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidateAll,
  });

  const addAdjustment = useMutation({
    mutationFn: async (adj: { from_participant_id: string; to_participant_id: string; amount: number; description?: string }) => {
      const { error } = await supabase.from('gathering_adjustments').insert({
        event_id: eventId,
        ...adj,
      } as any);
      if (error) throw error;
    },
    onSuccess: invalidateAll,
  });

  const deleteAdjustment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('gathering_adjustments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidateAll,
  });

  // Build a map: expenseId -> participant ids that share it (empty array = all)
  const expenseSplitMap: Record<string, string[]> = {};
  for (const s of (splitsQuery.data || [])) {
    if (!expenseSplitMap[s.expense_id]) expenseSplitMap[s.expense_id] = [];
    expenseSplitMap[s.expense_id].push(s.participant_id);
  }

  return {
    event: eventQuery.data,
    participants: participantsQuery.data || [],
    expenses: expensesQuery.data || [],
    timeline: timelineQuery.data || [],
    adjustments: adjustmentsQuery.data || [],
    expenseSplitMap,
    isLoading: eventQuery.isLoading,
    addParticipant,
    removeParticipant,
    addExpense,
    updateExpense,
    updateExpenseSplits,
    deleteExpense,
    addAdjustment,
    deleteAdjustment,
    invalidateAll,
  };
}

// Split calculation
export function calculateSplit(
  expenses: GatheringExpense[],
  participants: GatheringParticipant[],
  splitMode: string,
  fixedAmount?: number | null,
  expenseSplitMap?: Record<string, string[]>,
  adjustments?: GatheringAdjustment[],
) {
  // Only count top-level expenses (not children of groups) to avoid double-counting
  const topLevel = expenses.filter((e) => !e.parent_expense_id);
  const splittable = topLevel.filter((e) => e.include_in_split);
  const totalSpent = splittable.reduce((s, e) => s + Number(e.total_amount), 0);
  const numPeople = participants.length || 1;

  // How much each person paid
  const paidMap: Record<string, number> = {};
  for (const p of participants) paidMap[p.id] = 0;
  for (const e of splittable) {
    if (e.paid_by_participant_id && paidMap[e.paid_by_participant_id] !== undefined) {
      paidMap[e.paid_by_participant_id] += Number(e.total_amount);
    }
  }

  // How much each person owes (per-expense granularity)
  const owesMap: Record<string, number> = {};
  for (const p of participants) owesMap[p.id] = 0;

  if (splitMode === 'fixed' && fixedAmount) {
    // Fixed mode: everyone owes the same fixed amount
    for (const p of participants) owesMap[p.id] = fixedAmount;
  } else {
    // Equal or hybrid: distribute each expense among its assigned participants
    for (const e of splittable) {
      const splitIds = expenseSplitMap?.[e.id];
      // If no specific split → everyone shares it
      const sharingIds = (splitIds && splitIds.length > 0)
        ? splitIds.filter(id => paidMap[id] !== undefined)
        : participants.map(p => p.id);
      const share = Number(e.total_amount) / (sharingIds.length || 1);
      for (const pid of sharingIds) {
        owesMap[pid] = (owesMap[pid] || 0) + share;
      }
    }
  }

  // Apply manual adjustments: transfer debt from one person to another
  if (adjustments && adjustments.length > 0) {
    for (const adj of adjustments) {
      const amount = Number(adj.amount) || 0;
      if (amount > 0 && owesMap[adj.from_participant_id] !== undefined && owesMap[adj.to_participant_id] !== undefined) {
        owesMap[adj.from_participant_id] -= amount;
        owesMap[adj.to_participant_id] += amount;
      }
    }
  }

  // Fair share for summary display
  const fairShare = splitMode === 'fixed' && fixedAmount ? fixedAmount : totalSpent / numPeople;

  // Balance per person
  const balances: { participant: GatheringParticipant; paid: number; owes: number; balance: number }[] = [];
  for (const p of participants) {
    const paid = paidMap[p.id] || 0;
    const owes = owesMap[p.id] || 0;
    balances.push({ participant: p, paid, owes, balance: paid - owes });
  }

  // Settlements (who pays whom)
  const settlements: { from: GatheringParticipant; to: GatheringParticipant; amount: number }[] = [];
  const debtors = balances.filter((b) => b.balance < -0.01).map((b) => ({ ...b }));
  const creditors = balances.filter((b) => b.balance > 0.01).map((b) => ({ ...b }));

  debtors.sort((a, b) => a.balance - b.balance);
  creditors.sort((a, b) => b.balance - a.balance);

  let di = 0, ci = 0;
  while (di < debtors.length && ci < creditors.length) {
    const amount = Math.min(-debtors[di].balance, creditors[ci].balance);
    if (amount > 0.01) {
      settlements.push({
        from: debtors[di].participant,
        to: creditors[ci].participant,
        amount: Math.round(amount * 100) / 100,
      });
    }
    debtors[di].balance += amount;
    creditors[ci].balance -= amount;
    if (Math.abs(debtors[di].balance) < 0.01) di++;
    if (Math.abs(creditors[ci].balance) < 0.01) ci++;
  }

  return { totalSpent, fairShare, balances, settlements };
}
