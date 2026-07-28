// ============================================================================
// useLifePersonal  —  CENTRAL DA VIDA PESSOAL DO USUÁRIO
// ----------------------------------------------------------------------------
// Hook que reúne todo o módulo "Vida Pessoal" do app: check-in emocional do dia,
// rotinas de casa, relacionamentos, experiências/memórias, "despejo mental",
// diário, ritual semanal e registro de equilíbrio de vida. Busca e grava tudo
// no Supabase e devolve os dados prontos para as telas mostrarem.
// ============================================================================

// Ferramentas do React (estados, efeitos) e do date-fns (formatar datas).
import { useState, useEffect, useCallback } from 'react';
// Conexão com o banco de dados Supabase (onde tudo é guardado).
import { supabase } from '@/integrations/supabase/client';
// Descobre quem é o usuário logado no momento.
import { useAuth } from '@/contexts/AuthContext';
// Mostra mensagens rápidas de sucesso na tela (os "toasts").
import { toast } from 'sonner';
import { format, startOfWeek } from 'date-fns';

// Opções de "como estou me sentindo hoje" no check-in emocional.
export type EmotionalState = 'ótimo' | 'bem' | 'neutro' | 'cansado' | 'sobrecarregado';

// Check-in emocional de um dia: como me senti e o que fiz de bom por mim.
export interface LifeCheckin {
  id: string;
  checkin_date: string;
  emotional_state: EmotionalState;
  talked_to_someone: boolean;
  home_organized: boolean;
  had_me_time: boolean;
  overloaded_mode: boolean;
}

// Uma tarefa/rotina da casa (ex.: "regar plantas"), com frequência e último dia feito.
export interface HouseRoutine {
  id: string;
  title: string;
  category: string;
  frequency: string;
  last_done_at: string | null;
  shared_with: string | null;
}

// Uma pessoa importante na vida do usuário (família, amigo, parceiro), com datas
// especiais e a última vez que teve um "tempo de qualidade" com ela.
export interface LifeRelationship {
  id: string;
  name: string;
  relation: string | null;
  likes: string | null;
  important_dates: { label: string; date: string }[];
  last_quality_time: string | null;
  notes: string | null;
  importance: number;
}

// Uma experiência: algo que a pessoa quer viver ("quero_viver") ou uma memória guardada.
export interface LifeExperience {
  id: string;
  title: string;
  type: 'quero_viver' | 'memoria';
  description: string | null;
  photo_url: string | null;
  experience_date: string | null;
}

// "Despejo mental": uma preocupação anotada e o que decidir fazer com ela
// (deixar pendente, resolver, deixar ir ou concluir que não importa).
export interface BrainDump {
  id: string;
  content: string;
  resolution: 'pendente' | 'resolver' | 'deixar_ir' | 'nao_importa';
  created_at: string;
}

// Entrada do diário de um dia (melhor momento, gratidão, o que carregar adiante, etc.).
export interface LifeDiary {
  id: string;
  diary_date: string;
  best_moment: string | null;
  bothered_by: string | null;
  gratitude: string | null;
  kind_to_self: string | null;
  carry_forward: string | null;
}

// Ritual da semana: intenções da pessoa para os próximos 7 dias.
export interface WeeklyRitual {
  id: string;
  week_start: string;
  want_to_live: string | null;
  more_present_with: string | null;
  avoid_repeating: string | null;
}

// Hook principal do módulo. As telas chamam useLifePersonal() para receber os
// dados já carregados e as funções de salvar/editar/apagar.
export function useLifePersonal() {
  const { user } = useAuth();
  // Data de hoje e início da semana (segunda-feira), no formato do banco (AAAA-MM-DD).
  const today = format(new Date(), 'yyyy-MM-dd');
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  // Cada "estado" abaixo guarda um pedaço dos dados na memória da tela.
  const [checkin, setCheckin] = useState<LifeCheckin | null>(null);
  const [routines, setRoutines] = useState<HouseRoutine[]>([]);
  const [relationships, setRelationships] = useState<LifeRelationship[]>([]);
  const [experiences, setExperiences] = useState<LifeExperience[]>([]);
  const [brainDumps, setBrainDumps] = useState<BrainDump[]>([]);
  const [diary, setDiary] = useState<LifeDiary | null>(null);
  const [weeklyRitual, setWeeklyRitual] = useState<WeeklyRitual | null>(null);
  const [balanceLogs, setBalanceLogs] = useState<{ area: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  // Busca TODOS os dados do módulo de uma vez só quando a tela abre.
  // Usa Promise.all para fazer as 8 consultas em paralelo (mais rápido).
  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [checkinRes, routinesRes, relsRes, expRes, dumpsRes, diaryRes, ritualRes, logsRes] = await Promise.all([
      supabase.from('life_checkins').select('*').eq('user_id', user.id).eq('checkin_date', today).maybeSingle(),
      supabase.from('house_routines').select('*').eq('user_id', user.id).order('created_at'),
      supabase.from('life_relationships').select('*').eq('user_id', user.id).order('name'),
      supabase.from('life_experiences').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('life_brain_dumps').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
      supabase.from('life_diary').select('*').eq('user_id', user.id).eq('diary_date', today).maybeSingle(),
      supabase.from('life_weekly_rituals').select('*').eq('user_id', user.id).eq('week_start', weekStart).maybeSingle(),
      // Registros de equilíbrio de vida dos últimos 30 dias.
      supabase.from('life_balance_logs').select('area').eq('user_id', user.id).gte('log_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
    ]);

    // Guarda cada resultado no seu respectivo estado para a tela usar.
    setCheckin(checkinRes.data as LifeCheckin | null);
    setRoutines((routinesRes.data || []) as HouseRoutine[]);
    setRelationships((relsRes.data || []).map(r => ({ ...r, important_dates: (r.important_dates as { label: string; date: string }[] | null) || [] })) as LifeRelationship[]);
    setExperiences((expRes.data || []) as LifeExperience[]);
    setBrainDumps((dumpsRes.data || []) as BrainDump[]);
    setDiary(diaryRes.data as LifeDiary | null);
    setWeeklyRitual(ritualRes.data as WeeklyRitual | null);

    // Conta quantas vezes o usuário cuidou de cada área da vida (casa, família,
    // amigos, lazer, autocuidado, tempo sozinho) para montar o gráfico de equilíbrio.
    const logs = logsRes.data || [];
    const areas = ['casa', 'familia', 'amigos', 'lazer', 'autocuidado', 'tempo_sozinho'];
    const agg = areas.map(area => ({ area, count: logs.filter((l: { area: string }) => l.area === area).length }));
    setBalanceLogs(agg);

    setLoading(false);
  }, [user, today, weekStart]);

  // Assim que o hook é usado (e sempre que o usuário muda), carrega tudo.
  useEffect(() => { fetchAll(); }, [fetchAll]);

  // === CHECK-IN: cria (primeira vez no dia) ou atualiza o check-in de hoje. ===
  const saveCheckin = async (data: Partial<LifeCheckin>) => {
    if (!user) return;
    const payload = { ...data, user_id: user.id, checkin_date: today };
    if (checkin?.id) {
      await supabase.from('life_checkins').update(payload).eq('id', checkin.id);
      setCheckin(prev => prev ? { ...prev, ...data } : prev);
    } else {
      const { data: newC } = await supabase.from('life_checkins').insert(payload).select().single();
      setCheckin(newC as LifeCheckin);
    }
  };

  // === ROTINAS DE CASA ===
  // Cria uma nova rotina de casa e a adiciona na lista da tela.
  const addRoutine = async (data: Omit<HouseRoutine, 'id'>) => {
    if (!user) return;
    const { data: newR } = await supabase.from('house_routines').insert({ ...data, user_id: user.id }).select().single();
    if (newR) setRoutines(prev => [...prev, newR as HouseRoutine]);
    toast.success('Rotina criada!');
  };

  // Marca a rotina como feita hoje (guarda a data do último "feito").
  const markRoutineDone = async (id: string) => {
    await supabase.from('house_routines').update({ last_done_at: today }).eq('id', id);
    setRoutines(prev => prev.map(r => r.id === id ? { ...r, last_done_at: today } : r));
    toast.success('Feito! ✅');
  };

  // Apaga uma rotina de casa.
  const deleteRoutine = async (id: string) => {
    await supabase.from('house_routines').delete().eq('id', id);
    setRoutines(prev => prev.filter(r => r.id !== id));
  };

  // === RELACIONAMENTOS ===
  // Adiciona uma pessoa importante. important_dates pode vir vazio, então garante uma lista.
  const addRelationship = async (data: Omit<LifeRelationship, 'id'>) => {
    if (!user) return;
    const { data: newR } = await supabase.from('life_relationships').insert({ ...data, user_id: user.id }).select().single();
    if (newR) setRelationships(prev => [...prev, { ...newR, important_dates: (newR.important_dates as { label: string; date: string }[] | null) || [] } as LifeRelationship]);
    toast.success('Pessoa adicionada!');
  };

  // Registra que hoje houve um "tempo de qualidade" com essa pessoa.
  const markQualityTime = async (id: string) => {
    await supabase.from('life_relationships').update({ last_quality_time: today }).eq('id', id);
    setRelationships(prev => prev.map(r => r.id === id ? { ...r, last_quality_time: today } : r));
    toast.success('Momento registrado! ❤️');
  };

  // Edita os dados de uma pessoa já cadastrada.
  const updateRelationship = async (id: string, data: Partial<Omit<LifeRelationship, 'id'>>) => {
    await supabase.from('life_relationships').update(data).eq('id', id);
    setRelationships(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
    toast.success('Pessoa atualizada!');
  };

  // Remove uma pessoa da lista de relacionamentos.
  const deleteRelationship = async (id: string) => {
    await supabase.from('life_relationships').delete().eq('id', id);
    setRelationships(prev => prev.filter(r => r.id !== id));
  };

  // === EXPERIÊNCIAS E MEMÓRIAS ===
  // Adiciona uma experiência (a mensagem muda se for memória ou desejo futuro).
  const addExperience = async (data: Omit<LifeExperience, 'id'>) => {
    if (!user) return;
    const { data: newE } = await supabase.from('life_experiences').insert({ ...data, user_id: user.id }).select().single();
    if (newE) setExperiences(prev => [newE as LifeExperience, ...prev]);
    toast.success(data.type === 'memoria' ? 'Memória guardada! 📸' : 'Adicionado à lista!');
  };

  // Apaga uma experiência/memória.
  const deleteExperience = async (id: string) => {
    await supabase.from('life_experiences').delete().eq('id', id);
    setExperiences(prev => prev.filter(e => e.id !== id));
  };

  // === DESPEJO MENTAL ===
  // Anota uma nova preocupação, já marcada como "pendente".
  const addBrainDump = async (content: string) => {
    if (!user) return;
    const { data: newD } = await supabase.from('life_brain_dumps').insert({ content, user_id: user.id, resolution: 'pendente' }).select().single();
    if (newD) setBrainDumps(prev => [newD as BrainDump, ...prev]);
  };

  // Define o que fazer com a preocupação (resolver, deixar ir, etc.).
  const resolveDump = async (id: string, resolution: BrainDump['resolution']) => {
    await supabase.from('life_brain_dumps').update({ resolution }).eq('id', id);
    setBrainDumps(prev => prev.map(d => d.id === id ? { ...d, resolution } : d));
  };

  // Apaga uma anotação do despejo mental.
  const deleteDump = async (id: string) => {
    await supabase.from('life_brain_dumps').delete().eq('id', id);
    setBrainDumps(prev => prev.filter(d => d.id !== id));
  };

  // === DIÁRIO: cria ou atualiza a entrada do diário de hoje. ===
  const saveDiary = async (data: Partial<LifeDiary>) => {
    if (!user) return;
    const payload = { ...data, user_id: user.id, diary_date: today };
    if (diary?.id) {
      await supabase.from('life_diary').update(payload).eq('id', diary.id);
      setDiary(prev => prev ? { ...prev, ...data } : prev);
    } else {
      const { data: newD } = await supabase.from('life_diary').insert(payload).select().single();
      setDiary(newD as LifeDiary);
    }
    toast.success('Salvo no diário ✨');
  };

  // === RITUAL SEMANAL: cria ou atualiza as intenções desta semana. ===
  const saveWeeklyRitual = async (data: Partial<WeeklyRitual>) => {
    if (!user) return;
    const payload = { ...data, user_id: user.id, week_start: weekStart };
    if (weeklyRitual?.id) {
      await supabase.from('life_weekly_rituals').update(payload).eq('id', weeklyRitual.id);
      setWeeklyRitual(prev => prev ? { ...prev, ...data } : prev);
    } else {
      const { data: newR } = await supabase.from('life_weekly_rituals').insert(payload).select().single();
      setWeeklyRitual(newR as WeeklyRitual);
    }
    toast.success('Ritual da semana salvo 🌙');
  };

  // === EQUILÍBRIO DE VIDA ===
  // Registra que hoje o usuário cuidou de uma área (casa, lazer, etc.) e soma +1
  // no contador dessa área para atualizar o gráfico na hora.
  const logBalance = async (area: string) => {
    if (!user) return;
    await supabase.from('life_balance_logs').insert({ user_id: user.id, area, log_date: today });
    setBalanceLogs(prev => prev.map(l => l.area === area ? { ...l, count: l.count + 1 } : l));
    toast.success(`${area} registrado!`);
  };

  // Entrega para as telas todos os dados carregados e as funções de ação.
  return {
    checkin, routines, relationships, experiences, brainDumps, diary, weeklyRitual, balanceLogs, loading,
    saveCheckin, addRoutine, markRoutineDone, deleteRoutine,
    addRelationship, updateRelationship, markQualityTime, deleteRelationship,
    addExperience, deleteExperience,
    addBrainDump, resolveDump, deleteDump,
    saveDiary, saveWeeklyRitual, logBalance,
    refetch: fetchAll,
  };
}
