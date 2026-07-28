import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface IntimacyLog {
  id: string;
  user_id: string;
  log_date: string;
  log_time?: string;
  duration_minutes?: number;
  activity_type: string[];
  partner_label?: string;
  location?: string;
  desire_before?: number;
  satisfaction?: number;
  pleasure?: number;
  orgasm?: string;
  energy_level?: string;
  mood?: string;
  contraception_used?: string;
  protection_used: boolean;
  discomfort?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type IntimacyLogInsert = Omit<IntimacyLog, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export function useIntimacyLogs() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['intimacy_logs', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('intimacy_logs')
        .select('*')
        .order('log_date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as IntimacyLog[];
    },
  });

  const addLog = useMutation({
    mutationFn: async (payload: IntimacyLogInsert) => {
      const { error } = await supabase
        .from('intimacy_logs')
        .insert({ ...payload, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intimacy_logs'] });
      toast.success('Registro salvo');
    },
    onError: () => toast.error('Erro ao salvar'),
  });

  const deleteLog = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('intimacy_logs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intimacy_logs'] });
      toast.success('Registro removido');
    },
  });

  // Insights
  const totalLogs = logs.length;
  const avgSatisfaction = logs.length
    ? Math.round((logs.reduce((s, l) => s + (l.satisfaction ?? 0), 0) / logs.filter(l => l.satisfaction).length) * 10) / 10
    : 0;
  const avgPleasure = logs.length
    ? Math.round((logs.reduce((s, l) => s + (l.pleasure ?? 0), 0) / logs.filter(l => l.pleasure).length) * 10) / 10
    : 0;

  const logsThisMonth = logs.filter(l => {
    const d = new Date(l.log_date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return {
    logs,
    isLoading,
    addLog: addLog.mutateAsync,
    deleteLog: deleteLog.mutateAsync,
    isAdding: addLog.isPending,
    insights: { totalLogs, avgSatisfaction, avgPleasure, logsThisMonth },
  };
}
