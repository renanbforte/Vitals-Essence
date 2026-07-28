import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, differenceInDays, addDays, subDays } from 'date-fns';

export interface MenstrualSettings {
  id: string;
  user_id: string;
  average_cycle_length: number;
  average_period_length: number;
  contraceptive_type: string | null;
  notifications_enabled: boolean;
}

export interface MenstrualCycle {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string | null;
  cycle_length: number | null;
  is_atypical: boolean;
  notes: string | null;
}

export type FlowIntensity = 'light' | 'medium' | 'heavy' | 'very_heavy' | 'spotting' | 'none';

export interface MenstrualDailyLog {
  id: string;
  user_id: string;
  date: string;
  cycle_id: string | null;
  flow_intensity: FlowIntensity | null;
  symptoms: string[];
  mood: string | null;
  notes: string | null;
}

export interface PredictionResult {
  nextPeriodStart: Date;
  nextPeriodEnd: Date;
  marginDays: number;
  confidence: number; // 0-1
}

function calculateWeightedAverage(cycles: MenstrualCycle[]): number {
  const valid = cycles.filter(c => c.cycle_length && !c.is_atypical).slice(-6);
  if (valid.length === 0) return 28;

  const weights = valid.map((_, i) => {
    const pos = valid.length - i;
    if (pos <= 3) return 0.4 / Math.min(3, valid.length);
    if (pos <= 5) return 0.35 / Math.min(2, valid.length - 3);
    return 0.25 / Math.max(1, valid.length - 5);
  });

  const totalWeight = weights.reduce((s, w) => s + w, 0);
  const avg = valid.reduce((s, c, i) => s + (c.cycle_length! * weights[i]), 0) / totalWeight;
  return Math.round(avg);
}

function getDeviationLevel(expected: number, actual: number): 'small' | 'moderate' | 'large' {
  const diff = Math.abs(actual - expected);
  if (diff <= 2) return 'small';
  if (diff <= 7) return 'moderate';
  return 'large';
}

export const DEVIATION_MESSAGES = {
  small: 'Seu ciclo teve uma pequena variação. Isso pode acontecer. 🌸',
  moderate: 'Sua menstruação veio fora do período esperado. Vamos acompanhar para ajustar sua previsão.',
  large: 'Seu ciclo apresentou uma variação maior que o normal. Se isso continuar, pode ser importante observar com mais atenção.',
};

export function useMenstrualCycle() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<MenstrualSettings | null>(null);
  const [cycles, setCycles] = useState<MenstrualCycle[]>([]);
  const [dailyLogs, setDailyLogs] = useState<MenstrualDailyLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [settingsRes, cyclesRes, logsRes] = await Promise.all([
      supabase.from('menstrual_settings').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('menstrual_cycles').select('*').eq('user_id', user.id).order('start_date', { ascending: false }),
      supabase.from('menstrual_daily_logs').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(120),
    ]);

    if (settingsRes.data) setSettings(settingsRes.data as unknown as MenstrualSettings);
    if (cyclesRes.data) setCycles(cyclesRes.data as unknown as MenstrualCycle[]);
    if (logsRes.data) setDailyLogs(logsRes.data as unknown as MenstrualDailyLog[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const saveSettings = useCallback(async (updates: Partial<MenstrualSettings>) => {
    if (!user) return;
    if (settings) {
      await supabase.from('menstrual_settings').update(updates).eq('id', settings.id);
    } else {
      await supabase.from('menstrual_settings').insert({ user_id: user.id, ...updates });
    }
    await fetchAll();
  }, [user, settings, fetchAll]);

  const startNewCycle = useCallback(async (startDate: string) => {
    if (!user) return;

    // Close the previous cycle
    const lastCycle = cycles[0];
    if (lastCycle && !lastCycle.end_date) {
      const endDate = format(subDays(new Date(startDate), 1), 'yyyy-MM-dd');
      const cycleLen = differenceInDays(new Date(startDate), new Date(lastCycle.start_date));
      await supabase.from('menstrual_cycles').update({
        end_date: endDate,
        cycle_length: cycleLen,
        is_atypical: settings
          ? Math.abs(cycleLen - settings.average_cycle_length) > 7
          : false,
      }).eq('id', lastCycle.id);
    }

    await supabase.from('menstrual_cycles').insert({
      user_id: user.id,
      start_date: startDate,
    });

    await fetchAll();
  }, [user, cycles, settings, fetchAll]);

  const deleteCycle = useCallback(async (cycleId: string) => {
    await supabase.from('menstrual_cycles').delete().eq('id', cycleId);
    await fetchAll();
  }, [fetchAll]);

  const logDay = useCallback(async (date: string, data: {
    flow_intensity?: FlowIntensity;
    symptoms?: string[];
    mood?: string;
    notes?: string;
  }) => {
    if (!user) return;

    // Find which cycle this date belongs to
    const cycle = cycles.find(c => {
      const start = new Date(c.start_date);
      const end = c.end_date ? new Date(c.end_date) : addDays(start, (settings?.average_period_length || 5));
      return new Date(date) >= start && new Date(date) <= end;
    });

    const existing = dailyLogs.find(l => l.date === date);
    if (existing) {
      await supabase.from('menstrual_daily_logs').update({
        ...data,
        cycle_id: cycle?.id || existing.cycle_id,
      }).eq('id', existing.id);
    } else {
      await supabase.from('menstrual_daily_logs').insert({
        user_id: user.id,
        date,
        cycle_id: cycle?.id || null,
        flow_intensity: data.flow_intensity || null,
        symptoms: data.symptoms || [],
        mood: data.mood || null,
        notes: data.notes || null,
      });
    }
    await fetchAll();
  }, [user, cycles, dailyLogs, settings, fetchAll]);

  const prediction = useMemo((): PredictionResult | null => {
    if (cycles.length === 0) return null;

    const lastCycle = cycles[0];
    const avgLength = calculateWeightedAverage(cycles);
    const validCycles = cycles.filter(c => c.cycle_length && !c.is_atypical);

    // Confidence based on data amount
    const confidence = Math.min(validCycles.length / 6, 1);

    // Margin based on std deviation
    let margin = 3;
    if (validCycles.length >= 3) {
      const lengths = validCycles.map(c => c.cycle_length!);
      const mean = lengths.reduce((s, v) => s + v, 0) / lengths.length;
      const std = Math.sqrt(lengths.reduce((s, v) => s + (v - mean) ** 2, 0) / lengths.length);
      margin = Math.max(1, Math.min(5, Math.round(std)));
    }

    const nextStart = addDays(new Date(lastCycle.start_date), avgLength);
    const periodLen = settings?.average_period_length || 5;

    return {
      nextPeriodStart: nextStart,
      nextPeriodEnd: addDays(nextStart, periodLen - 1),
      marginDays: margin,
      confidence,
    };
  }, [cycles, settings]);

  const lastCycleDeviation = useMemo(() => {
    if (cycles.length < 2) return null;
    const last = cycles[0];
    if (!last.cycle_length) return null;
    const expected = settings?.average_cycle_length || 28;
    const level = getDeviationLevel(expected, last.cycle_length);
    return { level, message: DEVIATION_MESSAGES[level] };
  }, [cycles, settings]);

  return {
    settings,
    cycles,
    dailyLogs,
    loading,
    prediction,
    lastCycleDeviation,
    saveSettings,
    startNewCycle,
    deleteCycle,
    logDay,
    refetch: fetchAll,
  };
}
