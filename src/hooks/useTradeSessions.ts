import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface TradeSession {
  id: string;
  date: string;
  start_time: string | null;
  platform: string | null;
  market: string | null;
  allocated_capital: number;
  max_daily_risk: number;
  risk_per_operation: number;
  expected_scenario: string | null;
  allowed_setups: string | null;
  allowed_hours: string | null;
  prohibited_hours: string | null;
  emotional_state: string | null;
  sleep_quality: string | null;
  energy_level: string | null;
  financial_result: number | null;
  percentage_result: number | null;
  num_operations: number | null;
  win_rate: number | null;
  biggest_gain: number | null;
  biggest_loss: number | null;
  respected_daily_risk: boolean | null;
  respected_plan: string | null;
  broken_rules: string | null;
  observations: string | null;
  bank_name: string | null;
  status: string;
  created_at: string;
}

export interface PreTradeInput {
  date: string;
  start_time?: string;
  platform?: string;
  market?: string;
  allocated_capital: number;
  max_daily_risk: number;
  risk_per_operation: number;
  expected_scenario?: string;
  allowed_setups?: string;
  allowed_hours?: string;
  prohibited_hours?: string;
  emotional_state?: string;
  sleep_quality?: string;
  energy_level?: string;
}

export interface PostTradeInput {
  financial_result: number;
  percentage_result?: number;
  num_operations?: number;
  win_rate?: number;
  biggest_gain?: number;
  biggest_loss?: number;
  respected_daily_risk?: boolean;
  respected_plan?: string;
  broken_rules?: string;
  observations?: string;
  bank_name?: string;
}

export function useTradeSessions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<TradeSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('trade_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(50);
    if (error) console.error(error);
    else setSessions((data || []) as TradeSession[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const createPreTrade = async (input: PreTradeInput) => {
    if (!user) return;
    const { error } = await supabase.from('trade_sessions').insert({
      user_id: user.id,
      date: input.date,
      start_time: input.start_time || null,
      platform: input.platform || 'Profit',
      market: input.market || null,
      allocated_capital: input.allocated_capital,
      max_daily_risk: input.max_daily_risk,
      risk_per_operation: input.risk_per_operation,
      expected_scenario: input.expected_scenario || null,
      allowed_setups: input.allowed_setups || null,
      allowed_hours: input.allowed_hours || null,
      prohibited_hours: input.prohibited_hours || null,
      emotional_state: input.emotional_state || null,
      sleep_quality: input.sleep_quality || null,
      energy_level: input.energy_level || null,
      status: 'pre',
    });
    if (error) toast({ title: 'Erro ao criar sessão', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Sessão criada' }); fetchSessions(); }
  };

  const completePostTrade = async (id: string, input: PostTradeInput) => {
    if (!user) return;
    const { error } = await supabase.from('trade_sessions').update({
      financial_result: input.financial_result,
      percentage_result: input.percentage_result ?? null,
      num_operations: input.num_operations ?? null,
      win_rate: input.win_rate ?? null,
      biggest_gain: input.biggest_gain ?? null,
      biggest_loss: input.biggest_loss ?? null,
      respected_daily_risk: input.respected_daily_risk ?? null,
      respected_plan: input.respected_plan ?? null,
      broken_rules: input.broken_rules || null,
      observations: input.observations || null,
      bank_name: input.bank_name || null,
      status: 'completed',
    }).eq('id', id).eq('user_id', user.id);
    if (error) toast({ title: 'Erro ao finalizar sessão', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Sessão finalizada' }); fetchSessions(); }
  };

  const deleteSession = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('trade_sessions').delete().eq('id', id).eq('user_id', user.id);
    if (error) toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Sessão excluída' }); fetchSessions(); }
  };

  const stats = sessions.filter(s => s.status === 'completed');
  const totalSessions = stats.length;
  const totalResult = stats.reduce((s, t) => s + (Number(t.financial_result) || 0), 0);
  const avgWinRate = totalSessions > 0 ? stats.reduce((s, t) => s + (Number(t.win_rate) || 0), 0) / totalSessions : 0;
  const disciplineRate = totalSessions > 0 ? (stats.filter(s => s.respected_daily_risk).length / totalSessions) * 100 : 0;

  return {
    sessions, loading, totalSessions, totalResult, avgWinRate, disciplineRate,
    createPreTrade, completePostTrade, deleteSession, refetch: fetchSessions,
  };
}
