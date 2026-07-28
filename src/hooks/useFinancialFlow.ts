import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { startOfMonth, endOfMonth, format, addDays, addWeeks, addMonths, addYears, parseISO } from 'date-fns';

export interface CostCenter {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

export interface FinancialTransaction {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: string;
  cost_center_id: string | null;
  is_recurring: boolean;
  recurrence_type: string | null;
  recurrence_interval: number | null;
  recurrence_end_date: string | null;
  recurrence_mode: string | null;
  parent_transaction_id: string | null;
  notes: string | null;
  paid: boolean;
  payment_method: string | null;
  card_bank: string | null;
  created_at: string;
  cost_center?: CostCenter;
  installment_label?: string; // e.g. "2/5"
}

export interface TransactionInput {
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: string;
  cost_center_id?: string | null;
  is_recurring?: boolean;
  recurrence_type?: string | null;
  recurrence_interval?: number | null;
  recurrence_end_date?: string | null;
  installments?: number | null;
  recurrence_mode?: string | null;
  notes?: string | null;
  payment_method?: string | null;
  card_bank?: string | null;
}

const DEFAULT_COST_CENTERS = [
  { name: 'Moradia', icon: '🏠', color: '#6366f1' },
  { name: 'Alimentação', icon: '🍽️', color: '#f59e0b' },
  { name: 'Saúde', icon: '❤️', color: '#ef4444' },
  { name: 'Educação', icon: '📚', color: '#3b82f6' },
  { name: 'Lazer', icon: '🎮', color: '#8b5cf6' },
  { name: 'Transporte', icon: '🚗', color: '#64748b' },
  { name: 'Investimentos', icon: '📈', color: '#10b981' },
  { name: 'Reserva', icon: '🐷', color: '#d97706' },
  { name: 'Outros', icon: '📦', color: '#94a3b8' },
];

function formatCurrencySearch(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function useFinancialFlow(selectedMonth: Date) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [savedBanks, setSavedBanks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const monthStart = format(startOfMonth(selectedMonth), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(selectedMonth), 'yyyy-MM-dd');

  const fetchCostCenters = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('cost_centers')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (error) {
      console.error('Error fetching cost centers:', error);
      return;
    }

    if (data && data.length === 0) {
      // Seed default cost centers
      const inserts = DEFAULT_COST_CENTERS.map(cc => ({
        user_id: user.id,
        name: cc.name,
        icon: cc.icon,
        color: cc.color,
      }));
      const { data: seeded, error: seedError } = await supabase
        .from('cost_centers')
        .insert(inserts)
        .select();
      if (!seedError && seeded) {
        setCostCenters(seeded);
      }
    } else if (data) {
      setCostCenters(data);
    }
  }, [user]);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('financial_transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', monthStart)
      .lte('date', monthEnd)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
    } else if (data) {
      // Collect parent IDs for recurring transactions to compute installment labels
      const parentIds = new Set<string>();
      data.forEach(t => {
        if (t.is_recurring || t.parent_transaction_id) {
          parentIds.add(t.parent_transaction_id || t.id);
        }
      });

      // Fetch all siblings for each parent to compute "X/Y"
      const installmentMap = new Map<string, { index: number; total: number }>();
      if (parentIds.size > 0) {
        for (const pid of parentIds) {
          const { data: siblings } = await supabase
            .from('financial_transactions')
            .select('id, date')
            .or(`id.eq.${pid},parent_transaction_id.eq.${pid}`)
            .eq('user_id', user.id)
            .order('date', { ascending: true });
          if (siblings) {
            siblings.forEach((s, idx) => {
              installmentMap.set(s.id, { index: idx + 1, total: siblings.length });
            });
          }
        }
      }

      const enriched = data.map(t => ({
        ...t,
        type: t.type as 'income' | 'expense',
        cost_center: costCenters.find(cc => cc.id === t.cost_center_id),
        installment_label: installmentMap.has(t.id)
          ? `${installmentMap.get(t.id)!.index}/${installmentMap.get(t.id)!.total}`
          : undefined,
      }));
      setTransactions(enriched);
    }
    setLoading(false);
  }, [user, monthStart, monthEnd, costCenters]);

  const fetchSavedBanks = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('financial_transactions')
      .select('card_bank')
      .eq('user_id', user.id)
      .not('card_bank', 'is', null)
      .neq('card_bank', '');
    if (data) {
      const unique = [...new Set(data.map(d => d.card_bank as string))].sort();
      setSavedBanks(unique);
    }
  }, [user]);

  useEffect(() => {
    fetchCostCenters();
    fetchSavedBanks();
  }, [fetchCostCenters, fetchSavedBanks]);

  useEffect(() => {
    if (costCenters.length > 0 || !loading) {
      fetchTransactions();
    }
  }, [fetchTransactions, costCenters]);

  const addTransaction = async (input: TransactionInput): Promise<string | null> => {
    if (!user) return null;

    // Build the base transaction
    const base = {
      user_id: user.id,
      type: input.type,
      description: input.description,
      amount: input.amount,
      date: input.date,
      cost_center_id: input.cost_center_id || null,
      is_recurring: input.is_recurring || false,
      recurrence_type: input.recurrence_type || null,
      recurrence_interval: input.recurrence_interval || null,
      recurrence_end_date: input.recurrence_end_date || null,
      notes: input.notes || null,
      payment_method: input.payment_method || null,
      card_bank: input.card_bank || null,
      recurrence_mode: input.recurrence_mode || null,
    };

    // Insert the first transaction
    const { data: parentData, error } = await supabase
      .from('financial_transactions')
      .insert(base)
      .select('id')
      .single();

    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
      return null;
    }

    // If recurring, generate future occurrences
    if (input.is_recurring && parentData) {
      const parentId = parentData.id;
      const futureInserts = [];
      const baseDate = parseISO(input.date);
      const interval = input.recurrence_interval || 1;
      const type = input.recurrence_type || 'months';
      // installments=null means continuous (project 12 months ahead)
      const totalInstallments = input.installments ? input.installments : 60;

      for (let i = 1; i < totalInstallments; i++) {
        let nextDate: Date;
        switch (type) {
          case 'days':
            nextDate = addDays(baseDate, interval * i);
            break;
          case 'weeks':
            nextDate = addWeeks(baseDate, interval * i);
            break;
          case 'years':
            nextDate = addYears(baseDate, interval * i);
            break;
          case 'months':
          default:
            nextDate = addMonths(baseDate, interval * i);
            break;
        }

        futureInserts.push({
          ...base,
          date: format(nextDate, 'yyyy-MM-dd'),
          parent_transaction_id: parentId,
        });
      }

      if (futureInserts.length > 0) {
        await supabase.from('financial_transactions').insert(futureInserts);
      }
    }

    toast({ title: 'Lançamento salvo' });
    fetchTransactions();
    fetchSavedBanks();
    return parentData?.id || null;
  };

  const updateTransaction = async (id: string, input: Partial<TransactionInput>, scope: 'single' | 'from_date' = 'single', fromDate?: string) => {
    if (!user) return;

    // Strip non-DB fields and undefined values before sending to Supabase
    const { installments: _inst, ...rest } = input;
    const dbInput: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rest)) {
      if (value !== undefined) {
        dbInput[key] = value;
      }
    }

    console.log('[updateTransaction] scope:', scope, 'id:', id, 'dbInput:', JSON.stringify(dbInput));

    if (scope === 'single') {
      // Fetch authoritative state from DB to avoid stale-state bugs
      const { data: dbTxn } = await supabase
        .from('financial_transactions')
        .select('id, is_recurring, parent_transaction_id, recurrence_mode')
        .eq('id', id)
        .maybeSingle();

      const wasRecurring = dbTxn?.is_recurring || !!dbTxn?.parent_transaction_id;
      const nowRecurring = input.is_recurring === true;

      // Detect recurrence mode change (e.g. installments -> continuous)
      const oldMode = dbTxn?.recurrence_mode || 'installments';
      const newMode = input.recurrence_mode || oldMode;
      const modeChanged = wasRecurring && nowRecurring && oldMode !== newMode;

      // Check DB for existing children
      const parentId = dbTxn?.parent_transaction_id || id;
      let hasChildrenInDb = false;
      if (nowRecurring) {
        const { count } = await supabase
          .from('financial_transactions')
          .select('id', { count: 'exact', head: true })
          .eq('parent_transaction_id', parentId)
          .eq('user_id', user.id);
        hasChildrenInDb = (count || 0) > 0;
      }

      const shouldGenerateInstallments = nowRecurring && (!wasRecurring && !hasChildrenInDb || modeChanged);

      // If mode changed, delete old children first so we can regenerate
      if (modeChanged && hasChildrenInDb) {
        await supabase
          .from('financial_transactions')
          .delete()
          .eq('parent_transaction_id', parentId)
          .eq('user_id', user.id);
        // If this transaction is a child, also update the parent
        if (dbTxn?.parent_transaction_id) {
          await supabase
            .from('financial_transactions')
            .update(dbInput)
            .eq('id', dbTxn.parent_transaction_id)
            .eq('user_id', user.id);
        }
      }

      const { data: updateData, error } = await supabase
        .from('financial_transactions')
        .update(dbInput)
        .eq('id', id)
        .eq('user_id', user.id)
        .select();
      console.log('[updateTransaction] single result:', JSON.stringify(updateData), 'error:', error);

      // Generate new installments when recurrence is enabled or mode changed
      if (!error && shouldGenerateInstallments) {
        const existingTxn = transactions.find(t => t.id === id);
        // For mode change, use the root parent as the anchor
        const anchorId = modeChanged ? parentId : id;
        const baseDate = parseISO(input.date || existingTxn?.date || format(new Date(), 'yyyy-MM-dd'));
        const interval = input.recurrence_interval || 1;
        const type = input.recurrence_type || 'months';
        const totalInstallments = _inst ? _inst : 60;
        const base = {
          user_id: user.id,
          type: input.type || existingTxn?.type || 'expense',
          description: input.description || existingTxn?.description || '',
          amount: input.amount || existingTxn?.amount || 0,
          cost_center_id: input.cost_center_id !== undefined ? input.cost_center_id : (existingTxn?.cost_center_id || null),
          is_recurring: true,
          recurrence_type: type,
          recurrence_interval: interval,
          recurrence_mode: newMode,
          notes: input.notes !== undefined ? input.notes : (existingTxn?.notes || null),
          payment_method: input.payment_method !== undefined ? input.payment_method : (existingTxn?.payment_method || null),
          card_bank: input.card_bank !== undefined ? input.card_bank : (existingTxn?.card_bank || null),
          parent_transaction_id: anchorId,
        };

        const futureInserts = [];
        for (let i = 1; i < totalInstallments; i++) {
          let nextDate: Date;
          switch (type) {
            case 'days': nextDate = addDays(baseDate, interval * i); break;
            case 'weeks': nextDate = addWeeks(baseDate, interval * i); break;
            case 'years': nextDate = addYears(baseDate, interval * i); break;
            case 'months': default: nextDate = addMonths(baseDate, interval * i); break;
          }
          futureInserts.push({ ...base, date: format(nextDate, 'yyyy-MM-dd') });
        }
        if (futureInserts.length > 0) {
          await supabase.from('financial_transactions').insert(futureInserts);
        }
      }
      if (error) {
        toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
        return;
      }
    } else if (scope === 'from_date' && fromDate) {
      const { date: newDate, installments: _inst2, ...rawBulk } = input;
      const bulkInput: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(rawBulk)) {
        if (value !== undefined) {
          bulkInput[key] = value;
        }
      }

      // Update the clicked transaction itself WITH the date change
      const { error: selfError } = await supabase
        .from('financial_transactions')
        .update(dbInput)
        .eq('id', id)
        .eq('user_id', user.id);
      if (selfError) {
        toast({ title: 'Erro ao atualizar', description: selfError.message, variant: 'destructive' });
        return;
      }

      // Fetch and update siblings
      const { data: txn } = await supabase
        .from('financial_transactions')
        .select('id, parent_transaction_id')
        .eq('id', id)
        .maybeSingle();

      if (txn) {
        const parentId = txn.parent_transaction_id || txn.id;

        const { data: siblings } = await supabase
          .from('financial_transactions')
          .select('id, date')
          .or(`id.eq.${parentId},parent_transaction_id.eq.${parentId}`)
          .neq('id', id)
          .eq('user_id', user.id)
          .gte('date', fromDate)
          .order('date');

        if (siblings && siblings.length > 0) {
          const hasDateChange = newDate && newDate !== fromDate;
          const dayOffset = hasDateChange
            ? Math.round((parseISO(newDate).getTime() - parseISO(fromDate).getTime()) / (1000 * 60 * 60 * 24))
            : 0;

          for (const sibling of siblings) {
            const updatePayload: Record<string, unknown> = { ...bulkInput };
            if (dayOffset !== 0) {
              const shiftedDate = addDays(parseISO(sibling.date), dayOffset);
              updatePayload.date = format(shiftedDate, 'yyyy-MM-dd');
            }
            await supabase
              .from('financial_transactions')
              .update(updatePayload)
              .eq('id', sibling.id)
              .eq('user_id', user.id);
          }
        }
        // No else branch — editing never creates new installments
      }
    }

    toast({ title: 'Lançamento atualizado' });
    fetchTransactions();
  };

  // Attachment helpers
  const uploadAttachment = async (transactionId: string, file: File) => {
    if (!user) return null;
    const filePath = `${user.id}/${transactionId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('transaction-attachments')
      .upload(filePath, file);
    if (uploadError) {
      toast({ title: 'Erro no upload', description: uploadError.message, variant: 'destructive' });
      return null;
    }
    const { error: dbError } = await supabase.from('transaction_attachments').insert({
      transaction_id: transactionId,
      user_id: user.id,
      file_name: file.name,
      file_path: filePath,
      file_type: file.type || null,
    });
    if (dbError) {
      toast({ title: 'Erro ao salvar anexo', description: dbError.message, variant: 'destructive' });
      return null;
    }
    return filePath;
  };

  const fetchAttachments = async (transactionId: string) => {
    if (!user) return [];
    const { data } = await supabase
      .from('transaction_attachments')
      .select('*')
      .eq('transaction_id', transactionId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    return data || [];
  };

  const deleteAttachment = async (attachmentId: string, filePath: string) => {
    if (!user) return;
    await supabase.storage.from('transaction-attachments').remove([filePath]);
    await supabase.from('transaction_attachments').delete().eq('id', attachmentId).eq('user_id', user.id);
  };

  const getAttachmentUrl = async (filePath: string) => {
    const { data } = await supabase.storage.from('transaction-attachments').createSignedUrl(filePath, 3600);
    return data?.signedUrl || null;
  };

  const deleteTransaction = async (id: string, deleteRelated = false) => {
    if (!user) return;

    if (deleteRelated) {
      // Find the transaction to determine the parent chain
      const { data: txn } = await supabase
        .from('financial_transactions')
        .select('id, parent_transaction_id')
        .eq('id', id)
        .single();

      if (txn) {
        const parentId = txn.parent_transaction_id || txn.id;
        // Delete all children of the parent
        await supabase
          .from('financial_transactions')
          .delete()
          .eq('parent_transaction_id', parentId)
          .eq('user_id', user.id);
        // Delete the parent itself
        await supabase
          .from('financial_transactions')
          .delete()
          .eq('id', parentId)
          .eq('user_id', user.id);
      }
    } else {
      await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
    }

    toast({ title: 'Lançamento excluído' });
    fetchTransactions();
  };

  const togglePaid = async (id: string, currentPaid: boolean) => {
    if (!user) return;
    const { error } = await supabase
      .from('financial_transactions')
      .update({ paid: !currentPaid })
      .eq('id', id)
      .eq('user_id', user.id);
    if (!error) {
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, paid: !currentPaid } : t));
    }
  };

  const addCostCenter = async (name: string, icon?: string, color?: string) => {
    if (!user) return;
    const { error } = await supabase.from('cost_centers').insert({
      user_id: user.id,
      name,
      icon: icon || null,
      color: color || null,
    });
    if (!error) {
      fetchCostCenters();
    }
  };

  const updateCostCenter = async (id: string, updates: { name?: string; icon?: string; color?: string }) => {
    if (!user) return;
    const { error } = await supabase
      .from('cost_centers')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id);
    if (!error) {
      fetchCostCenters();
    }
  };

  const deleteCostCenter = async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('cost_centers')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (!error) {
      fetchCostCenters();
    }
  };

  const summary = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const searchAllTransactions = useCallback(async (query?: string, costCenterId?: string, dateFrom?: string, dateTo?: string): Promise<FinancialTransaction[]> => {
    if (!user) return [];
    let q = supabase
      .from('financial_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true });

    if (dateFrom) q = q.gte('date', dateFrom);
    if (dateTo) q = q.lte('date', dateTo);
    if (costCenterId && costCenterId !== 'all') q = q.eq('cost_center_id', costCenterId);

    const { data, error } = await q;
    if (error || !data) return [];

    let results: FinancialTransaction[] = data.map(t => ({
      ...t,
      type: t.type as 'income' | 'expense',
      cost_center: costCenters.find(cc => cc.id === t.cost_center_id),
    }));

    if (query && query.trim()) {
      const lq = query.toLowerCase();
      results = results.filter(t =>
        t.description.toLowerCase().includes(lq) ||
        formatCurrencySearch(Number(t.amount)).toLowerCase().includes(lq)
      );
    }

    return results;
  }, [user, costCenters]);

  return {
    transactions,
    costCenters,
    savedBanks,
    loading,
    summary,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    togglePaid,
    addCostCenter,
    updateCostCenter,
    deleteCostCenter,
    uploadAttachment,
    fetchAttachments,
    deleteAttachment,
    getAttachmentUrl,
    searchAllTransactions,
    refetch: fetchTransactions,
  };
}
