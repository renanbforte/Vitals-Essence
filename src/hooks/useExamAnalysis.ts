// ============================================================================
// useExamAnalysis  —  ANÁLISE DE EVOLUÇÃO DOS EXAMES
// ----------------------------------------------------------------------------
// Dispara a edge function que lê todos os exames do usuário e avalia a evolução
// dos resultados, e guarda/recupera o último relatório salvo em exam_analyses.
// ============================================================================
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Um ponto na evolução de um marcador (uma medição, numa data).
export interface BiomarkerPoint {
  date: string;
  value: number | null;
  status: string; // normal | baixo | alto | indeterminado
}

// A evolução consolidada de um marcador ao longo dos exames.
export interface BiomarkerEvolution {
  name: string;
  unit: string | null;
  trend: string; // melhora | piora | estavel | oscilando | dado_unico
  latest_status: string;
  points: BiomarkerPoint[];
  note: string;
}

export interface ImagingItem { date: string; exam: string; findings: string }
export interface PendingItem { date: string; exam: string; reason: string }

// O relatório gerado pela IA (formato devolvido pela edge function).
export interface ExamReport {
  summary: string;
  biomarkers: BiomarkerEvolution[];
  imaging: ImagingItem[];
  pending: PendingItem[];
  improved: string[];
  worsened: string[];
  attention: string[];
  disclaimer: string;
}

// Um registro de análise salvo no banco.
export interface ExamAnalysis {
  id: string;
  created_at: string;
  report: ExamReport;
  exams_count: number;
  files_analyzed: number;
  model: string | null;
}

export function useExamAnalysis() {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<ExamAnalysis | null>(null);
  const [loading, setLoading] = useState(true);   // carregando o último relatório salvo
  const [running, setRunning] = useState(false);  // rodando uma nova análise

  // Busca o relatório mais recente já salvo (para não re-analisar a cada abertura).
  // exam_analyses ainda não está nos tipos gerados do Supabase → acesso via cast.
  const fetchLatest = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    // Usa limit(1) + array (em vez de maybeSingle) para não gerar um 406 quando
    // ainda não existe nenhuma análise salva.
    const { data, error } = await (supabase as any)
      .from('exam_analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) {
      console.error('Erro ao buscar análise de exames:', error);
    } else {
      setAnalysis((data?.[0] as ExamAnalysis) || null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) fetchLatest();
  }, [user, fetchLatest]);

  // Roda uma nova análise: chama a edge function, que lê os arquivos e salva o
  // relatório. Pode levar de 30 s a ~1 min conforme a quantidade de exames.
  const runAnalysis = useCallback(async (): Promise<ExamAnalysis | null> => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-exam-evolution');
      if (error) {
        // A função retorna o motivo no corpo (ex.: nenhum exame, sem crédito).
        let msg = error.message;
        try {
          const body = await (error as any).context?.json?.();
          if (body?.error) msg = body.error;
        } catch { /* ignore */ }
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);
      if (data?.analysis) {
        setAnalysis(data.analysis as ExamAnalysis);
        toast.success('Análise concluída!');
        return data.analysis as ExamAnalysis;
      }
      throw new Error('A análise não retornou um relatório.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'erro desconhecido';
      toast.error(`Falha na análise: ${msg}`);
      return null;
    } finally {
      setRunning(false);
    }
  }, []);

  return { analysis, loading, running, runAnalysis, refetch: fetchLatest };
}
