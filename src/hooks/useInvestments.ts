// ============================================================================
// useInvestments.ts  —  CARTEIRA DE INVESTIMENTOS DO USUARIO
// ----------------------------------------------------------------------------
// Hook que busca e gerencia os investimentos da pessoa no Supabase: criar,
// editar, excluir, adicionar aportes de valor e reordenar por prioridade.
// Tambem calcula totais (quanto ja foi investido e a meta somada) para as telas.
// ============================================================================

// Ferramentas do React (estados, efeitos, memorizacao) e o cliente do banco Supabase.
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
// Descobre quem esta logado; e mostra avisos rapidos na tela (toasts).
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

// Atalho para o formato de "nova linha" da tabela de investimentos no banco.
type InvestmentInsertRow = Database['public']['Tables']['investments']['Insert'];

// Formato completo de um investimento como ele existe no banco (com todos os campos).
export interface Investment {
  id: string;
  name: string;
  investment_type: string | null;
  objective: string | null;
  current_value: number;
  target_value: number;
  target_mode: string;
  operating_capital: number;
  priority: number;
  tracking_mode: string;
  is_recurring_contribution: boolean;
  recurring_amount: number | null;
  recurrence_type: string | null;
  notes: string | null;
  category_id: string | null;
  // Real x simulação (planejamento), data de início do real e aporte recorrente ligado.
  is_simulated: boolean;
  start_date: string | null;
  recurring_tx_id: string | null;
  entry_tx_id: string | null; // lançamento de saída (aporte inicial) no fluxo
  // Moeda estrangeira: moeda, valor na moeda e cotação usada (current_value fica em BRL).
  currency: string;
  foreign_amount: number | null;
  exchange_rate: number | null;
  created_at: string;
  updated_at: string;
}

// Formato dos dados que os formularios enviam ao criar/editar (campos opcionais).
export interface InvestmentInput {
  name: string;
  investment_type?: string | null;
  objective?: string | null;
  target_value?: number;
  target_mode?: string;
  current_value?: number;
  operating_capital?: number;
  tracking_mode?: string;
  is_recurring_contribution?: boolean;
  recurring_amount?: number | null;
  recurrence_type?: string | null;
  notes?: string | null;
  is_simulated?: boolean;
  start_date?: string | null;
  recurring_tx_id?: string | null;
  entry_tx_id?: string | null;
  currency?: string;
  foreign_amount?: number | null;
  exchange_rate?: number | null;
}

// Categoria opcional para agrupar investimentos (com icone e cor).
export interface InvestmentCategory {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

// Lista fixa de tipos de investimento oferecida nos formularios.
const INVESTMENT_TYPES = [
  'Renda Fixa',
  'Ações',
  'FII',
  'Criptomoeda',
  'Tesouro Direto',
  'Poupança',
  'Previdência',
  'Outro',
];

// Lista fixa de objetivos (o "para que serve" do investimento) usada nos formularios.
const OBJECTIVES = [
  'Reserva de longo prazo',
  'Renda passiva',
  'Segurança',
  'Crescimento patrimonial',
  'Aposentadoria',
  'Imóvel',
  'Liberdade financeira',
  'Outro',
];

// Hook principal: entrega os dados e as acoes de investimento para as telas.
export function useInvestments() {
  const { user } = useAuth();
  const { toast } = useToast();
  // Estados guardados em memoria: a lista de investimentos, as categorias e o "carregando".
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [categories, setCategories] = useState<InvestmentCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Busca no banco todos os investimentos do usuario, ordenados por prioridade.
  const fetchInvestments = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', user.id)
      .order('priority', { ascending: true });

    if (error) {
      console.error('Error fetching investments:', error);
    } else {
      setInvestments((data || []) as Investment[]);
    }
    setLoading(false);
  }, [user]);

  // Busca no banco as categorias de investimento criadas pelo usuario.
  const fetchCategories = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('investment_categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name');
    if (data) setCategories(data);
  }, [user]);

  // Ao abrir a tela (ou trocar de usuario), carrega investimentos e categorias.
  useEffect(() => {
    fetchInvestments();
    fetchCategories();
  }, [fetchInvestments, fetchCategories]);

  // Cria um novo investimento no banco.
  const addInvestment = async (input: InvestmentInput) => {
    if (!user) return;
    // Coloca o novo item no fim da fila de prioridade (maior numero atual + 1).
    const maxPriority = investments.length > 0 ? Math.max(...investments.map(i => i.priority)) + 1 : 0;
    // Monta a linha a ser salva, preenchendo valores padrao quando o campo veio vazio.
    const row: InvestmentInsertRow = {
      user_id: user.id,
      name: input.name,
      investment_type: input.investment_type || null,
      objective: input.objective || null,
      target_value: input.target_value || 0,
      target_mode: input.target_mode || 'total',
      tracking_mode: input.tracking_mode || 'cumulative',
      is_recurring_contribution: input.is_recurring_contribution || false,
      recurring_amount: input.recurring_amount || null,
      recurrence_type: input.recurrence_type || null,
      notes: input.notes || null,
      priority: maxPriority,
      current_value: input.current_value || 0,
      operating_capital: input.operating_capital || 0,
      is_simulated: input.is_simulated || false,
      start_date: input.start_date || null,
      recurring_tx_id: input.recurring_tx_id || null,
      entry_tx_id: input.entry_tx_id || null,
      currency: input.currency || 'BRL',
      foreign_amount: input.foreign_amount ?? null,
      exchange_rate: input.exchange_rate ?? null,
    };
    // Grava no banco; avisa em caso de erro ou recarrega a lista em caso de sucesso.
    const { error } = await supabase.from('investments').insert(row);
    if (error) {
      toast({ title: 'Erro ao criar investimento', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Investimento criado' });
      fetchInvestments();
    }
  };

  // Atualiza campos de um investimento existente (edicao pelo formulario).
  const updateInvestment = async (id: string, updates: Partial<InvestmentInput>) => {
    if (!user) return;
    const { error } = await supabase
      .from('investments')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    } else {
      fetchInvestments();
    }
  };

  // Exclui um investimento e todo o seu historico de aportes.
  const deleteInvestment = async (id: string) => {
    if (!user) return;
    const inv = investments.find(i => i.id === id);
    // Remove os lançamentos de fluxo ligados a este investimento (saída inicial e
    // a série de aportes recorrentes), para não ficarem órfãos no Fluxo.
    if (inv?.entry_tx_id) {
      await supabase.from('financial_transactions').delete().eq('id', inv.entry_tx_id).eq('user_id', user.id);
    }
    if (inv?.recurring_tx_id) {
      await supabase.from('financial_transactions').delete().eq('parent_transaction_id', inv.recurring_tx_id).eq('user_id', user.id);
      await supabase.from('financial_transactions').delete().eq('id', inv.recurring_tx_id).eq('user_id', user.id);
    }
    // Apaga primeiro o historico para nao deixar registros orfaos no banco.
    await supabase.from('investment_history').delete().eq('investment_id', id).eq('user_id', user.id);
    const { error } = await supabase.from('investments').delete().eq('id', id).eq('user_id', user.id);
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Investimento excluído' });
      fetchInvestments();
    }
  };

  // Registra um aporte/atualizacao de valor em um investimento.
  const addValue = async (id: string, amount: number) => {
    if (!user) return;
    const inv = investments.find(i => i.id === id);
    if (!inv) return;

    // Modo "cumulative": soma ao valor atual. Modo "real": substitui pelo valor informado.
    const newValue = inv.tracking_mode === 'cumulative'
      ? Number(inv.current_value) + amount
      : amount; // 'real' mode = replace

    // Salva o novo valor atual do investimento.
    const { error: updateError } = await supabase
      .from('investments')
      .update({ current_value: newValue })
      .eq('id', id)
      .eq('user_id', user.id);

    if (updateError) {
      toast({ title: 'Erro ao adicionar valor', description: updateError.message, variant: 'destructive' });
      return;
    }

    // Guarda esse movimento no historico (para graficos e acompanhamento ao longo do tempo).
    await supabase.from('investment_history').insert({
      user_id: user.id,
      investment_id: id,
      value: amount,
      type: inv.tracking_mode === 'cumulative' ? 'contribution' : 'snapshot',
    });

    toast({ title: `R$ ${amount.toFixed(2)} adicionado` });
    fetchInvestments();
  };

  // Reordena a lista (ex.: arrastar itens) e salva a nova prioridade de cada um no banco.
  const reorderInvestments = async (reordered: Investment[]) => {
    if (!user) return;
    setInvestments(reordered); // atualiza a tela na hora, sem esperar o banco
    // Grava a nova ordem: a posicao na lista (idx) vira a prioridade de cada item.
    const updates = reordered.map((inv, idx) =>
      supabase.from('investments').update({ priority: idx }).eq('id', inv.id).eq('user_id', user.id)
    );
    await Promise.all(updates);
  };

  // Total ja investido: soma valor atual + capital em operacao — SOMENTE dos reais
  // (as simulacoes nao entram no patrimonio).
  const totalInvested = useMemo(
    () => investments
      .filter(i => !i.is_simulated)
      .reduce((sum, i) => sum + Number(i.current_value) + Number(i.operating_capital), 0),
    [investments]
  );

  // Meta total: soma o valor-alvo de todos os investimentos.
  const totalTarget = useMemo(
    () => investments.reduce((sum, i) => sum + Number(i.target_value), 0),
    [investments]
  );

  // Entrega para as telas os dados, os totais e todas as acoes disponiveis.
  return {
    investments,
    categories,
    loading,
    totalInvested,
    totalTarget,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    addValue,
    reorderInvestments,
    refetch: fetchInvestments,
    INVESTMENT_TYPES,
    OBJECTIVES,
  };
}
