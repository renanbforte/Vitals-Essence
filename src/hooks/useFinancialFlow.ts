// ============================================================================
// useFinancialFlow.ts  —  CONTROLE FINANCEIRO (LANÇAMENTOS DO MÊS)
// ----------------------------------------------------------------------------
// Hook central das finanças do usuário: busca e grava receitas/despesas do mês
// no Supabase, cria e mantém lançamentos recorrentes (parcelas), gerencia
// centros de custo (categorias), anexos de comprovantes e o resumo do mês.
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { startOfMonth, endOfMonth, format, addDays, addWeeks, addMonths, addYears, parseISO } from 'date-fns';

// Centro de custo = categoria de gasto/receita (ex.: Moradia, Saúde), com ícone e cor.
export interface CostCenter {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

// Formato de um lançamento financeiro já salvo (uma receita ou despesa).
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
  installment_index: number | null;
  installment_total: number | null;
  created_at: string;
  cost_center?: CostCenter;
  installment_label?: string; // e.g. "2/5"
}

// Dados que o formulário envia ao criar/editar um lançamento (entrada do usuário).
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

// Categorias padrão criadas automaticamente para um usuário novo (primeiro acesso).
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

// Formata um número como moeda brasileira (R$), usado para permitir busca por valor.
function formatCurrencySearch(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// Hook principal. Recebe o mês selecionado na tela e devolve dados + ações das finanças.
export function useFinancialFlow(selectedMonth: Date) {
  const { user } = useAuth();          // usuário logado (dono dos dados)
  const { toast } = useToast();        // mensagens de aviso na tela
  // Estados guardados na memória da tela:
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]); // lançamentos do mês
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);             // categorias do usuário
  const [savedBanks, setSavedBanks] = useState<string[]>([]);                   // bancos/cartões já usados (autocomplete)
  const [loading, setLoading] = useState(true);                                 // se está carregando dados

  // Primeiro e último dia do mês selecionado, usados para filtrar os lançamentos.
  const monthStart = format(startOfMonth(selectedMonth), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(selectedMonth), 'yyyy-MM-dd');

  // Busca as categorias do usuário. Se ele não tiver nenhuma, cria as categorias padrão.
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
      // Usuário sem categorias: grava as categorias padrão de uma vez.
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

  // Busca os lançamentos do mês selecionado e calcula os rótulos de parcela (ex.: "2/5").
  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    // Traz do banco só os lançamentos do usuário dentro do mês, do mais novo ao mais antigo.
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
      // Junta os IDs "pai" dos lançamentos recorrentes para depois montar o rótulo de parcela.
      const parentIds = new Set<string>();
      data.forEach(t => {
        if (t.is_recurring || t.parent_transaction_id) {
          parentIds.add(t.parent_transaction_id || t.id);
        }
      });

      // Para cada grupo de parcelas, busca todas as "irmãs" e calcula a posição "X de Y".
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

      // Enriquece cada lançamento com sua categoria completa e o rótulo de parcela.
      // Usa a numeração salva no lançamento (fixa, não quebra ao apagar uma parcela);
      // se não houver (dados antigos), cai no cálculo por contagem das irmãs.
      const enriched = data.map(t => ({
        ...t,
        type: t.type as 'income' | 'expense',
        cost_center: costCenters.find(cc => cc.id === t.cost_center_id),
        installment_label: (t.installment_total && t.installment_total > 1)
          ? `${t.installment_index}/${t.installment_total}`
          : (installmentMap.has(t.id)
              ? `${installmentMap.get(t.id)!.index}/${installmentMap.get(t.id)!.total}`
              : undefined),
      }));
      setTransactions(enriched);
    }
    setLoading(false);
  }, [user, monthStart, monthEnd, costCenters]);

  // Busca a lista de bancos/cartões já digitados antes, para sugerir no formulário.
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

  // Ao abrir/entrar no usuário: carrega categorias e bancos salvos.
  useEffect(() => {
    fetchCostCenters();
    fetchSavedBanks();
  }, [fetchCostCenters, fetchSavedBanks]);

  // Quando as categorias chegam (ou o mês muda), recarrega os lançamentos.
  useEffect(() => {
    if (costCenters.length > 0 || !loading) {
      fetchTransactions();
    }
  }, [fetchTransactions, costCenters]);

  // Cria um novo lançamento. Se for recorrente, gera automaticamente as parcelas futuras.
  const addTransaction = async (input: TransactionInput): Promise<string | null> => {
    if (!user) return null;

    // Quantas parcelas terá a série (quando recorrente). Fixa o total para que o
    // rótulo "X/Y" não mude se uma parcela for apagada depois.
    const seriesTotal = input.is_recurring ? (input.installments ? input.installments : 60) : null;

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
      installment_index: input.is_recurring ? 1 : null,
      installment_total: seriesTotal,
    };

    // Grava o primeiro lançamento (o "pai" da série, se houver recorrência).
    const { data: parentData, error } = await supabase
      .from('financial_transactions')
      .insert(base)
      .select('id')
      .single();

    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
      return null;
    }

    // Se for recorrente, cria as próximas ocorrências (parcelas) apontando para o pai.
    if (input.is_recurring && parentData) {
      const parentId = parentData.id;
      const futureInserts = [];
      const baseDate = parseISO(input.date);
      const interval = input.recurrence_interval || 1;   // de quantos em quantos (ex.: a cada 1 mês)
      const type = input.recurrence_type || 'months';    // unidade: dias/semanas/meses/anos
      // Sem número de parcelas definido = recorrência contínua (projeta até 60 ocorrências).
      const totalInstallments = seriesTotal || 60;

      // Calcula a data de cada parcela futura conforme a unidade e o intervalo.
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
          installment_index: i + 1,       // 2ª, 3ª... parcela (a 1ª é o lançamento pai)
          installment_total: totalInstallments,
        });
      }

      // Grava todas as parcelas futuras de uma vez só.
      if (futureInserts.length > 0) {
        await supabase.from('financial_transactions').insert(futureInserts);
      }
    }

    toast({ title: 'Lançamento salvo' });
    fetchTransactions();
    fetchSavedBanks();
    return parentData?.id || null;
  };

  // Atualiza um lançamento. "scope" define se altera só ele ('single') ou ele e os seguintes ('from_date').
  const updateTransaction = async (id: string, input: Partial<TransactionInput>, scope: 'single' | 'from_date' = 'single', fromDate?: string) => {
    if (!user) return;

    // Remove campos que não existem no banco e valores vazios antes de enviar ao Supabase.
    const { installments: _inst, ...rest } = input;
    const dbInput: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rest)) {
      if (value !== undefined) {
        dbInput[key] = value;
      }
    }

    console.log('[updateTransaction] scope:', scope, 'id:', id, 'dbInput:', JSON.stringify(dbInput));

    if (scope === 'single') {
      // Lê o estado atual direto do banco (fonte da verdade) para evitar erros com dados desatualizados na tela.
      const { data: dbTxn } = await supabase
        .from('financial_transactions')
        .select('id, is_recurring, parent_transaction_id, recurrence_mode')
        .eq('id', id)
        .maybeSingle();

      const wasRecurring = dbTxn?.is_recurring || !!dbTxn?.parent_transaction_id; // já era recorrente?
      const nowRecurring = input.is_recurring === true;                          // vai passar a ser recorrente?

      // Detecta mudança no tipo de recorrência (ex.: de parcelado para contínuo).
      const oldMode = dbTxn?.recurrence_mode || 'installments';
      const newMode = input.recurrence_mode || oldMode;
      const modeChanged = wasRecurring && nowRecurring && oldMode !== newMode;

      // Verifica no banco se já existem parcelas "filhas" desse lançamento.
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

      // Só gera parcelas se virou recorrente agora (e ainda não tinha filhas) ou se o modo mudou.
      const shouldGenerateInstallments = nowRecurring && (!wasRecurring && !hasChildrenInDb || modeChanged);

      // Se o modo mudou, apaga as parcelas antigas primeiro para poder recriá-las.
      if (modeChanged && hasChildrenInDb) {
        await supabase
          .from('financial_transactions')
          .delete()
          .eq('parent_transaction_id', parentId)
          .eq('user_id', user.id);
        // Se o lançamento clicado é uma parcela filha, atualiza também o lançamento pai.
        if (dbTxn?.parent_transaction_id) {
          await supabase
            .from('financial_transactions')
            .update(dbInput)
            .eq('id', dbTxn.parent_transaction_id)
            .eq('user_id', user.id);
        }
      }

      // Salva a alteração no próprio lançamento clicado.
      const { data: updateData, error } = await supabase
        .from('financial_transactions')
        .update(dbInput)
        .eq('id', id)
        .eq('user_id', user.id)
        .select();
      console.log('[updateTransaction] single result:', JSON.stringify(updateData), 'error:', error);

      // Gera novas parcelas quando a recorrência foi ligada agora ou o modo mudou.
      if (!error && shouldGenerateInstallments) {
        const existingTxn = transactions.find(t => t.id === id);
        // Na mudança de modo, usa o lançamento pai como âncora (ponto de partida) das novas parcelas.
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
          installment_total: totalInstallments,
        };

        // O lançamento âncora (pai) é a 1ª parcela da série.
        await supabase
          .from('financial_transactions')
          .update({ installment_index: 1, installment_total: totalInstallments })
          .eq('id', anchorId)
          .eq('user_id', user.id);

        const futureInserts = [];
        for (let i = 1; i < totalInstallments; i++) {
          let nextDate: Date;
          switch (type) {
            case 'days': nextDate = addDays(baseDate, interval * i); break;
            case 'weeks': nextDate = addWeeks(baseDate, interval * i); break;
            case 'years': nextDate = addYears(baseDate, interval * i); break;
            case 'months': default: nextDate = addMonths(baseDate, interval * i); break;
          }
          futureInserts.push({ ...base, date: format(nextDate, 'yyyy-MM-dd'), installment_index: i + 1 });
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
      // Edição em lote: altera o lançamento clicado e todas as parcelas a partir daquela data.
      const { date: newDate, installments: _inst2, ...rawBulk } = input;
      const bulkInput: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(rawBulk)) {
        if (value !== undefined) {
          bulkInput[key] = value;
        }
      }

      // Atualiza o próprio lançamento clicado, incluindo a mudança de data.
      const { error: selfError } = await supabase
        .from('financial_transactions')
        .update(dbInput)
        .eq('id', id)
        .eq('user_id', user.id);
      if (selfError) {
        toast({ title: 'Erro ao atualizar', description: selfError.message, variant: 'destructive' });
        return;
      }

      // Busca as parcelas "irmãs" (mesma série) para atualizá-las também.
      const { data: txn } = await supabase
        .from('financial_transactions')
        .select('id, parent_transaction_id')
        .eq('id', id)
        .maybeSingle();

      if (txn) {
        const parentId = txn.parent_transaction_id || txn.id;

        // Pega as irmãs da mesma série, a partir da data escolhida (menos a que já foi atualizada acima).

        const { data: siblings } = await supabase
          .from('financial_transactions')
          .select('id, date')
          .or(`id.eq.${parentId},parent_transaction_id.eq.${parentId}`)
          .neq('id', id)
          .eq('user_id', user.id)
          .gte('date', fromDate)
          .order('date');

        if (siblings && siblings.length > 0) {
          // Se a data mudou, calcula em quantos dias todas as parcelas seguintes devem ser deslocadas.
          const hasDateChange = newDate && newDate !== fromDate;
          const dayOffset = hasDateChange
            ? Math.round((parseISO(newDate).getTime() - parseISO(fromDate).getTime()) / (1000 * 60 * 60 * 24))
            : 0;

          // Aplica as mesmas alterações a cada irmã, deslocando a data quando necessário.
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

  // ---- Anexos (comprovantes) ligados a um lançamento ----

  // Envia um arquivo para o armazenamento e registra o anexo no banco.
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

  // Lista os anexos de um lançamento.
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

  // Remove um anexo tanto do armazenamento quanto do banco.
  const deleteAttachment = async (attachmentId: string, filePath: string) => {
    if (!user) return;
    await supabase.storage.from('transaction-attachments').remove([filePath]);
    await supabase.from('transaction_attachments').delete().eq('id', attachmentId).eq('user_id', user.id);
  };

  // Gera um link temporário (1 hora) para visualizar/baixar o anexo com segurança.
  const getAttachmentUrl = async (filePath: string) => {
    const { data } = await supabase.storage.from('transaction-attachments').createSignedUrl(filePath, 3600);
    return data?.signedUrl || null;
  };

  // Exclui um lançamento. Com deleteRelated=true, apaga também toda a série de parcelas.
  const deleteTransaction = async (id: string, deleteRelated = false) => {
    if (!user) return;

    if (deleteRelated) {
      // Descobre a qual série (pai) o lançamento pertence para apagar tudo.
      const { data: txn } = await supabase
        .from('financial_transactions')
        .select('id, parent_transaction_id')
        .eq('id', id)
        .single();

      if (txn) {
        const parentId = txn.parent_transaction_id || txn.id;
        // Apaga todas as parcelas filhas.
        await supabase
          .from('financial_transactions')
          .delete()
          .eq('parent_transaction_id', parentId)
          .eq('user_id', user.id);
        // Apaga o lançamento pai.
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

  // Marca/desmarca um lançamento como pago. Atualiza a tela na hora, sem recarregar tudo.
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

  // Cria uma nova categoria (centro de custo) para o usuário.
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

  // Edita uma categoria existente (nome, ícone ou cor).
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

  // Exclui uma categoria do usuário.
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

  // Resumo do mês: soma das receitas, soma das despesas e o saldo (recalculado quando os lançamentos mudam).
  const summary = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  // Busca ampla de lançamentos (fora do mês atual), com filtros de texto, categoria e período de datas.
  const searchAllTransactions = useCallback(async (query?: string, costCenterId?: string, dateFrom?: string, dateTo?: string): Promise<FinancialTransaction[]> => {
    if (!user) return [];
    let q = supabase
      .from('financial_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true });

    // Aplica os filtros opcionais informados pelo usuário.
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

    // Filtro por texto: casa com a descrição ou com o valor formatado (ex.: "R$ 50,00").
    if (query && query.trim()) {
      const lq = query.toLowerCase();
      results = results.filter(t =>
        t.description.toLowerCase().includes(lq) ||
        formatCurrencySearch(Number(t.amount)).toLowerCase().includes(lq)
      );
    }

    return results;
  }, [user, costCenters]);

  // Entrega para a tela os dados e todas as ações disponíveis das finanças.
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
