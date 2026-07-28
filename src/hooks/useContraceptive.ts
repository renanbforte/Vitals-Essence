import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, differenceInDays, addDays, parseISO } from 'date-fns';

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

export const METHOD_NEEDS_DAILY = ['pill', 'condom'];
export const METHOD_HAS_END_DATE = ['implant', 'iud_hormonal', 'iud_copper', 'injection', 'ring', 'patch'];

export interface ContraceptiveStatus {
  method: ContraceptiveMethod;
  daysUntilRenewal: number | null;
  isExpiringSoon: boolean;
  nextInjectionDate: string | null;
  currentPillPhase: 'active' | 'break' | null;
  pillDayInCycle: number | null;
  todayLog: ContraceptiveLog | null;
}

export function useContraceptive() {
  const { user } = useAuth();
  const [methods, setMethods] = useState<ContraceptiveMethod[]>([]);
  const [logs, setLogs] = useState<ContraceptiveLog[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const saveMethod = useCallback(async (data: Omit<ContraceptiveMethod, 'id' | 'user_id' | 'created_at' | 'updated_at'>, id?: string) => {
    if (!user) return;
    if (id) {
      await supabase.from('contraceptive_methods').update(data).eq('id', id);
    } else {
      await supabase.from('contraceptive_methods').insert({ ...data, user_id: user.id });
    }
    await fetchAll();
  }, [user, fetchAll]);

  const deleteMethod = useCallback(async (id: string) => {
    await supabase.from('contraceptive_methods').delete().eq('id', id);
    await fetchAll();
  }, [fetchAll]);

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

  const statuses = useMemo((): ContraceptiveStatus[] => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');

    return methods.filter(m => m.active).map(method => {
      const todayLog = logs.find(l => l.method_id === method.id && l.log_date === todayStr) || null;

      // Days until renewal
      let daysUntilRenewal: number | null = null;
      if (method.end_date) {
        daysUntilRenewal = differenceInDays(parseISO(method.end_date), today);
      }

      // Next injection date
      let nextInjectionDate: string | null = null;
      if (method.method_type === 'injection' && method.injection_interval_days) {
        const lastLog = logs.filter(l => l.method_id === method.id && l.taken).sort((a, b) => b.log_date.localeCompare(a.log_date))[0];
        if (lastLog) {
          nextInjectionDate = format(addDays(parseISO(lastLog.log_date), method.injection_interval_days), 'yyyy-MM-dd');
        } else {
          nextInjectionDate = format(addDays(parseISO(method.start_date), method.injection_interval_days), 'yyyy-MM-dd');
        }
      }

      // Pill phase
      let currentPillPhase: 'active' | 'break' | null = null;
      let pillDayInCycle: number | null = null;
      if (method.method_type === 'pill') {
        const daysSinceStart = differenceInDays(today, parseISO(method.start_date));
        const cycleTotal = method.pill_cycle_days + method.pill_break_days;
        const dayInCycle = daysSinceStart % cycleTotal;
        pillDayInCycle = dayInCycle + 1;
        currentPillPhase = dayInCycle < method.pill_cycle_days ? 'active' : 'break';
      }

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

  const getLast30DaysLogs = useCallback((methodId: string) => {
    return logs.filter(l => l.method_id === methodId).sort((a, b) => b.log_date.localeCompare(a.log_date));
  }, [logs]);

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
