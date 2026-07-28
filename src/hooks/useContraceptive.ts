// ============================================================================
// useContraceptive.ts  —  CONTROLE DE MÉTODOS CONTRACEPTIVOS
// ----------------------------------------------------------------------------
// Hook que busca e grava no Supabase os métodos anticoncepcionais da usuária
// (pílula, DIU, injeção, etc.) e os registros diários de uso. Também calcula,
// em memória, status úteis como próxima renovação, fase da pílula e próxima
// injeção, que a tela de saúde feminina exibe.
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, differenceInDays, addDays, parseISO } from 'date-fns';

// Formato de um método contraceptivo cadastrado (como ele vem salvo no banco).
export interface ContraceptiveMethod {
  id: string;
  user_id: string;
  method_type: string;
  name: string;
  start_date: string;
  end_date: string | null;
  renewal_reminder_days: number;
  pill_time: string | null;
  pill_cycle_days: number;
  pill_break_days: number;
  injection_interval_days: number | null;
  active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Formato de um registro diário: se a usuária tomou/pulou o método naquele dia.
export interface ContraceptiveLog {
  id: string;
  user_id: string;
  method_id: string;
  log_date: string;
  taken: boolean;
  taken_at: string | null;
  skipped: boolean;
  skip_reason: string | null;
  notes: string | null;
}

// Lista fechada dos tipos de método aceitos pelo app.
export type MethodType =
  | 'pill'
  | 'iud_hormonal'
  | 'iud_copper'
  | 'implant'
  | 'injection'
  | 'ring'
  | 'patch'
  | 'condom'
  | 'other';

// Tradução de cada tipo para o nome amigável exibido na tela (em português).
export const METHOD_LABELS: Record<string, string> = {
  pill: 'Pílula anticoncepcional',
  iud_hormonal: 'DIU hormonal',
  iud_copper: 'DIU de cobre',
  implant: 'Implante',
  injection: 'Injeção',
  ring: 'Anel vaginal',
  patch: 'Adesivo',
  condom: 'Preservativo',
  other: 'Outro',
};

// Métodos que exigem registro diário de uso.
export const METHOD_NEEDS_DAILY = ['pill', 'condom'];
// Métodos que têm data de validade/troca (e por isso geram lembrete de renovação).
export const METHOD_HAS_END_DATE = ['implant', 'iud_hormonal', 'iud_copper', 'injection', 'ring', 'patch'];

// Formato do "status calculado" de um método: informações prontas para exibir
// (dias até renovar, se está vencendo, fase da pílula, etc.).
export interface ContraceptiveStatus {
  method: ContraceptiveMethod;
  daysUntilRenewal: number | null;
  isExpiringSoon: boolean;
  nextInjectionDate: string | null;
  currentPillPhase: 'active' | 'break' | null;
  pillDayInCycle: number | null;
  todayLog: ContraceptiveLog | null;
}

// Hook principal: entrega os dados e as ações de contracepção para as telas.
export function useContraceptive() {
  const { user } = useAuth();
  // Estados locais: métodos cadastrados, registros dos últimos dias e "carregando".
  const [methods, setMethods] = useState<ContraceptiveMethod[]>([]);
  const [logs, setLogs] = useState<ContraceptiveLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Busca do banco, em paralelo, os métodos da usuária e os registros dos
  // últimos 30 dias. Só roda se houver usuário logado.
  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const today = format(new Date(), 'yyyy-MM-dd');
    const thirtyDaysAgo = format(addDays(new Date(), -30), 'yyyy-MM-dd');

    const [methodsRes, logsRes] = await Promise.all([
      supabase
        .from('contraceptive_methods')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('contraceptive_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('log_date', thirtyDaysAgo)
        .order('log_date', { ascending: false }),
    ]);

    if (methodsRes.data) setMethods(methodsRes.data as ContraceptiveMethod[]);
    if (logsRes.data) setLogs(logsRes.data as ContraceptiveLog[]);
    setLoading(false);
  }, [user]);

  // Carrega os dados assim que o hook é montado (e sempre que fetchAll mudar).
  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Cria (sem id) ou atualiza (com id) um método e recarrega a lista.
  const saveMethod = useCallback(async (data: Omit<ContraceptiveMethod, 'id' | 'user_id' | 'created_at' | 'updated_at'>, id?: string) => {
    if (!user) return;
    if (id) {
      await supabase.from('contraceptive_methods').update(data).eq('id', id);
    } else {
      await supabase.from('contraceptive_methods').insert({ ...data, user_id: user.id });
    }
    await fetchAll();
  }, [user, fetchAll]);

  // Exclui um método pelo id e recarrega a lista.
  const deleteMethod = useCallback(async (id: string) => {
    await supabase.from('contraceptive_methods').delete().eq('id', id);
    await fetchAll();
  }, [fetchAll]);

  // Registra o uso de hoje para um método: se já existe registro do dia,
  // atualiza; senão, cria um novo. Depois recarrega tudo.
  const logToday = useCallback(async (methodId: string, data: {
    taken?: boolean;
    taken_at?: string | null;
    skipped?: boolean;
    skip_reason?: string | null;
    notes?: string | null;
  }) => {
    if (!user) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    const existing = logs.find(l => l.method_id === methodId && l.log_date === today);

    if (existing) {
      await supabase.from('contraceptive_logs').update(data).eq('id', existing.id);
    } else {
      await supabase.from('contraceptive_logs').insert({
        user_id: user.id,
        method_id: methodId,
        log_date: today,
        taken: data.taken ?? false,
        taken_at: data.taken_at ?? null,
        skipped: data.skipped ?? false,
        skip_reason: data.skip_reason ?? null,
        notes: data.notes ?? null,
      });
    }
    await fetchAll();
  }, [user, logs, fetchAll]);

  // Calcula, para cada método ATIVO, os status prontos para exibir na tela.
  // Fica em useMemo para só recalcular quando métodos ou registros mudarem.
  const statuses = useMemo((): ContraceptiveStatus[] => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');

    return methods.filter(m => m.active).map(method => {
      const todayLog = logs.find(l => l.method_id === method.id && l.log_date === todayStr) || null;

      // Dias que faltam até a data de renovação/validade do método.
      let daysUntilRenewal: number | null = null;
      if (method.end_date) {
        daysUntilRenewal = differenceInDays(parseISO(method.end_date), today);
      }

      // Data da próxima injeção: parte da última injeção tomada (ou, se não
      // houver, da data de início) e soma o intervalo em dias.
      let nextInjectionDate: string | null = null;
      if (method.method_type === 'injection' && method.injection_interval_days) {
        const lastLog = logs.filter(l => l.method_id === method.id && l.taken).sort((a, b) => b.log_date.localeCompare(a.log_date))[0];
        if (lastLog) {
          nextInjectionDate = format(addDays(parseISO(lastLog.log_date), method.injection_interval_days), 'yyyy-MM-dd');
        } else {
          nextInjectionDate = format(addDays(parseISO(method.start_date), method.injection_interval_days), 'yyyy-MM-dd');
        }
      }

      // Fase da pílula: descobre em que dia do ciclo a usuária está e se é
      // fase "ativa" (tomando comprimidos) ou "pausa" (intervalo).
      let currentPillPhase: 'active' | 'break' | null = null;
      let pillDayInCycle: number | null = null;
      if (method.method_type === 'pill') {
        const daysSinceStart = differenceInDays(today, parseISO(method.start_date));
        const cycleTotal = method.pill_cycle_days + method.pill_break_days;
        const dayInCycle = daysSinceStart % cycleTotal;
        pillDayInCycle = dayInCycle + 1;
        currentPillPhase = dayInCycle < method.pill_cycle_days ? 'active' : 'break';
      }

      // "Vencendo em breve": faltam poucos dias, dentro da antecedência de aviso.
      const isExpiringSoon = daysUntilRenewal !== null && daysUntilRenewal <= method.renewal_reminder_days;

      return {
        method,
        daysUntilRenewal,
        isExpiringSoon,
        nextInjectionDate,
        currentPillPhase,
        pillDayInCycle,
        todayLog,
      };
    });
  }, [methods, logs]);

  // Retorna os registros de um método (dos que estão em memória), do mais
  // recente para o mais antigo — usado para montar o histórico na tela.
  const getLast30DaysLogs = useCallback((methodId: string) => {
    return logs.filter(l => l.method_id === methodId).sort((a, b) => b.log_date.localeCompare(a.log_date));
  }, [logs]);

  // Tudo que as telas podem usar: dados, status calculados e ações.
  return {
    methods,
    logs,
    statuses,
    loading,
    saveMethod,
    deleteMethod,
    logToday,
    getLast30DaysLogs,
    refetch: fetchAll,
  };
}
