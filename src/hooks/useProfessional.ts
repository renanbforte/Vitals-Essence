import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { startOfWeek, format, startOfMonth } from 'date-fns';

export interface ProfessionalProfile {
  id: string;
  user_id: string;
  job_role: string | null;
  current_income: number;
  target_income: number;
  next_goal: string | null;
  career_track: string;
  level: number;
  level_xp: number;
}

export interface IncomeHistory {
  id: string;
  month: string;
  income: number;
  notes: string | null;
}

export interface DailyRecord {
  id: string;
  record_date: string;
  focus_hours: number;
  strategic_tasks_done: number;
  study_done: boolean;
  important_deliveries: number;
  relevant_meetings: number;
  score: number;
  notes: string | null;
}

export interface ProfessionalSkill {
  id: string;
  skill_name: string;
  category: string;
  rating: number;
  last_reviewed_at: string | null;
}

export interface LearningLog {
  id: string;
  log_date: string;
  type: string;
  title: string;
  duration_minutes: number | null;
  notes: string | null;
}

export interface Opportunity {
  id: string;
  opportunity_date: string;
  type: string;
  description: string | null;
  result: string;
}

export interface StudyPlan {
  id: string;
  title: string;
  plan_type: string;
  deadline: string | null;
  weekly_hours_goal: number;
  status: string;
  total_hours_done: number;
}

export interface StudySession {
  id: string;
  plan_id: string;
  planned_date: string;
  topic: string;
  duration_minutes: number;
  activity_type: string;
  completed: boolean;
  actual_duration_minutes: number | null;
  notes: string | null;
}

export interface WeeklyMission {
  id: string;
  week_start: string;
  mission_type: string;
  title: string;
  completed: boolean;
  completed_at: string | null;
}

function calculateScore(record: Partial<DailyRecord>): number {
  let score = 0;
  score += Math.min((record.focus_hours || 0) * 10, 40);
  score += Math.min((record.strategic_tasks_done || 0) * 8, 24);
  score += record.study_done ? 15 : 0;
  score += Math.min((record.important_deliveries || 0) * 7, 14);
  score += Math.min((record.relevant_meetings || 0) * 4, 8);
  return Math.round(score);
}

export function useProfessional() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [incomeHistory, setIncomeHistory] = useState<IncomeHistory[]>([]);
  const [todayRecord, setTodayRecord] = useState<DailyRecord | null>(null);
  const [weekRecords, setWeekRecords] = useState<DailyRecord[]>([]);
  const [skills, setSkills] = useState<ProfessionalSkill[]>([]);
  const [learningLogs, setLearningLogs] = useState<LearningLog[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [weeklyMissions, setWeeklyMissions] = useState<WeeklyMission[]>([]);
  const [loading, setLoading] = useState(true);

  const today = format(new Date(), 'yyyy-MM-dd');
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [profileRes, incomeRes, todayRes, weekRes, skillsRes, learningRes, oppRes, plansRes, sessionsRes, missionsRes] = await Promise.all([
      supabase.from('professional_profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('professional_income_history').select('*').eq('user_id', user.id).order('month', { ascending: false }).limit(12),
      supabase.from('professional_daily_records').select('*').eq('user_id', user.id).eq('record_date', today).maybeSingle(),
      supabase.from('professional_daily_records').select('*').eq('user_id', user.id).gte('record_date', weekStart).order('record_date'),
      supabase.from('professional_skills').select('*').eq('user_id', user.id).order('category'),
      supabase.from('professional_learning_logs').select('*').eq('user_id', user.id).order('log_date', { ascending: false }).limit(20),
      supabase.from('professional_opportunities').select('*').eq('user_id', user.id).order('opportunity_date', { ascending: false }).limit(30),
      supabase.from('study_plans').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('study_plan_sessions').select('*').eq('user_id', user.id).order('planned_date'),
      supabase.from('weekly_missions').select('*').eq('user_id', user.id).eq('week_start', weekStart),
    ]);

    setProfile(profileRes.data as ProfessionalProfile | null);
    setIncomeHistory((incomeRes.data || []) as IncomeHistory[]);
    setTodayRecord(todayRes.data as DailyRecord | null);
    setWeekRecords((weekRes.data || []) as DailyRecord[]);
    setSkills((skillsRes.data || []) as ProfessionalSkill[]);
    setLearningLogs((learningRes.data || []) as LearningLog[]);
    setOpportunities((oppRes.data || []) as Opportunity[]);
    setStudyPlans((plansRes.data || []) as StudyPlan[]);
    setStudySessions((sessionsRes.data || []) as StudySession[]);
    setWeeklyMissions((missionsRes.data || []) as WeeklyMission[]);
    setLoading(false);
  }, [user, today, weekStart]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Profile
  const saveProfile = async (data: Partial<ProfessionalProfile>) => {
    if (!user) return;
    if (profile?.id) {
      const { error } = await supabase.from('professional_profiles').update(data).eq('id', profile.id);
      if (!error) { setProfile(prev => prev ? { ...prev, ...data } : prev); toast.success('Perfil atualizado!'); }
    } else {
      const { data: newProfile, error } = await supabase.from('professional_profiles').insert({ ...data, user_id: user.id }).select().single();
      if (!error) { setProfile(newProfile as ProfessionalProfile); toast.success('Perfil criado!'); }
    }
  };

  // Income
  const saveIncome = async (month: string, income: number, notes?: string) => {
    if (!user) return;
    const { error } = await supabase.from('professional_income_history').upsert({ user_id: user.id, month, income, notes: notes || null }, { onConflict: 'user_id,month' });
    if (!error) { toast.success('Renda registrada!'); fetchAll(); }
    else toast.error('Erro ao salvar renda');
  };

  // Daily Record
  const saveDailyRecord = async (data: Partial<DailyRecord>) => {
    if (!user) return;
    const score = calculateScore(data);
    const payload = { ...data, score, user_id: user.id, record_date: today };

    if (todayRecord?.id) {
      const { error } = await supabase.from('professional_daily_records').update({ ...payload }).eq('id', todayRecord.id);
      if (!error) { setTodayRecord(prev => prev ? { ...prev, ...payload, score } : prev); toast.success('Score atualizado!'); }
    } else {
      const { data: newRec, error } = await supabase.from('professional_daily_records').insert(payload).select().single();
      if (!error) { setTodayRecord(newRec as DailyRecord); toast.success('Score registrado!'); }
      else toast.error('Erro ao salvar');
    }
    // Update XP
    const xpGain = Math.floor(score / 5);
    if (xpGain > 0 && profile) {
      const newXp = (profile.level_xp || 0) + xpGain;
      const xpNeeded = profile.level * 100;
      if (newXp >= xpNeeded) {
        await supabase.from('professional_profiles').update({ level: profile.level + 1, level_xp: newXp - xpNeeded }).eq('id', profile.id);
        toast.success(`🎉 Subiu para o Nível ${profile.level + 1}!`);
        setProfile(prev => prev ? { ...prev, level: prev.level + 1, level_xp: newXp - xpNeeded } : prev);
      } else {
        await supabase.from('professional_profiles').update({ level_xp: newXp }).eq('id', profile.id);
        setProfile(prev => prev ? { ...prev, level_xp: newXp } : prev);
      }
    }
  };

  // Skills
  const addSkill = async (skillData: Omit<ProfessionalSkill, 'id' | 'last_reviewed_at'>) => {
    if (!user) return;
    const { data, error } = await supabase.from('professional_skills').insert({ ...skillData, user_id: user.id, last_reviewed_at: today }).select().single();
    if (!error) { setSkills(prev => [...prev, data as ProfessionalSkill]); toast.success('Competência adicionada!'); }
  };

  const updateSkillRating = async (id: string, rating: number) => {
    const { error } = await supabase.from('professional_skills').update({ rating, last_reviewed_at: today }).eq('id', id);
    if (!error) { setSkills(prev => prev.map(s => s.id === id ? { ...s, rating, last_reviewed_at: today } : s)); }
  };

  const deleteSkill = async (id: string) => {
    await supabase.from('professional_skills').delete().eq('id', id);
    setSkills(prev => prev.filter(s => s.id !== id));
  };

  // Learning
  const addLearning = async (data: Omit<LearningLog, 'id'>) => {
    if (!user) return;
    const { data: newLog, error } = await supabase.from('professional_learning_logs').insert({ ...data, user_id: user.id }).select().single();
    if (!error) { setLearningLogs(prev => [newLog as LearningLog, ...prev]); toast.success('Aprendizado registrado!'); }
  };

  const deleteLearning = async (id: string) => {
    await supabase.from('professional_learning_logs').delete().eq('id', id);
    setLearningLogs(prev => prev.filter(l => l.id !== id));
  };

  // Opportunities
  const addOpportunity = async (data: Omit<Opportunity, 'id'>) => {
    if (!user) return;
    const { data: newOpp, error } = await supabase.from('professional_opportunities').insert({ ...data, user_id: user.id }).select().single();
    if (!error) { setOpportunities(prev => [newOpp as Opportunity, ...prev]); toast.success('Oportunidade registrada!'); }
  };

  const updateOpportunityResult = async (id: string, result: string) => {
    await supabase.from('professional_opportunities').update({ result }).eq('id', id);
    setOpportunities(prev => prev.map(o => o.id === id ? { ...o, result } : o));
  };

  const deleteOpportunity = async (id: string) => {
    await supabase.from('professional_opportunities').delete().eq('id', id);
    setOpportunities(prev => prev.filter(o => o.id !== id));
  };

  // Study Plans
  const addStudyPlan = async (data: Omit<StudyPlan, 'id' | 'total_hours_done'>) => {
    if (!user) return;
    const { data: newPlan, error } = await supabase.from('study_plans').insert({ ...data, user_id: user.id }).select().single();
    if (!error) { setStudyPlans(prev => [newPlan as StudyPlan, ...prev]); toast.success('Plano criado!'); return newPlan as StudyPlan; }
    return null;
  };

  const updateStudyPlan = async (id: string, data: Partial<StudyPlan>) => {
    await supabase.from('study_plans').update(data).eq('id', id);
    setStudyPlans(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  };

  const deleteStudyPlan = async (id: string) => {
    await supabase.from('study_plans').delete().eq('id', id);
    setStudyPlans(prev => prev.filter(p => p.id !== id));
    setStudySessions(prev => prev.filter(s => s.plan_id !== id));
  };

  // Study Sessions
  const addStudySession = async (data: Omit<StudySession, 'id'>) => {
    if (!user) return;
    const { data: newSession, error } = await supabase.from('study_plan_sessions').insert({ ...data, user_id: user.id }).select().single();
    if (!error) { setStudySessions(prev => [...prev, newSession as StudySession]); toast.success('Sessão criada!'); }
  };

  const completeStudySession = async (id: string, actualMinutes: number, notes?: string) => {
    if (!user) return;
    const session = studySessions.find(s => s.id === id);
    await supabase.from('study_plan_sessions').update({ completed: true, actual_duration_minutes: actualMinutes, notes: notes || null }).eq('id', id);
    setStudySessions(prev => prev.map(s => s.id === id ? { ...s, completed: true, actual_duration_minutes: actualMinutes } : s));
    // Update plan total hours
    if (session) {
      const plan = studyPlans.find(p => p.id === session.plan_id);
      if (plan) {
        const newTotal = (plan.total_hours_done || 0) + actualMinutes / 60;
        await supabase.from('study_plans').update({ total_hours_done: newTotal }).eq('id', session.plan_id);
        setStudyPlans(prev => prev.map(p => p.id === session.plan_id ? { ...p, total_hours_done: newTotal } : p));
      }
    }
    toast.success('Sessão concluída! +XP');
  };

  const deleteStudySession = async (id: string) => {
    await supabase.from('study_plan_sessions').delete().eq('id', id);
    setStudySessions(prev => prev.filter(s => s.id !== id));
  };

  // Weekly Missions
  const addMission = async (missionType: string, title: string) => {
    if (!user) return;
    const { data: newMission, error } = await supabase.from('weekly_missions').insert({ user_id: user.id, week_start: weekStart, mission_type: missionType, title }).select().single();
    if (!error) { setWeeklyMissions(prev => [...prev, newMission as WeeklyMission]); }
  };

  const completeMission = async (id: string) => {
    const now = new Date().toISOString();
    await supabase.from('weekly_missions').update({ completed: true, completed_at: now }).eq('id', id);
    setWeeklyMissions(prev => prev.map(m => m.id === id ? { ...m, completed: true, completed_at: now } : m));
    toast.success('Missão concluída! 🎯');
  };

  const deleteMission = async (id: string) => {
    await supabase.from('weekly_missions').delete().eq('id', id);
    setWeeklyMissions(prev => prev.filter(m => m.id !== id));
  };

  // Computed
  const weekScore = weekRecords.reduce((sum, r) => sum + r.score, 0);
  const weekFocusHours = weekRecords.reduce((sum, r) => sum + r.focus_hours, 0);
  const incomeProgress = profile?.target_income ? (profile.current_income / profile.target_income) * 100 : 0;
  const xpForNextLevel = profile ? profile.level * 100 : 100;
  const xpProgress = profile ? (profile.level_xp / xpForNextLevel) * 100 : 0;

  return {
    profile, incomeHistory, todayRecord, weekRecords, skills, learningLogs,
    opportunities, studyPlans, studySessions, weeklyMissions, loading,
    weekScore, weekFocusHours, incomeProgress, xpForNextLevel, xpProgress,
    saveProfile, saveIncome, saveDailyRecord,
    addSkill, updateSkillRating, deleteSkill,
    addLearning, deleteLearning,
    addOpportunity, updateOpportunityResult, deleteOpportunity,
    addStudyPlan, updateStudyPlan, deleteStudyPlan,
    addStudySession, completeStudySession, deleteStudySession,
    addMission, completeMission, deleteMission,
    refetch: fetchAll,
  };
}
