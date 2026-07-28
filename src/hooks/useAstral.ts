// ============================================================================
// useAstral  —  ASTROLOGIA E ESOTERISMO (MAPA ASTRAL, HORÓSCOPO, TAROT, DIÁRIO)
// ----------------------------------------------------------------------------
// Reúne os hooks do módulo místico do app: calcula e guarda o mapa astral do
// usuário, gera o horóscopo do dia, salva leituras de tarot e registra o
// diário cósmico — todos lendo e gravando dados no Supabase.
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
// Funções de cálculo astrológico (signo solar, lunar, ascendente, número da
// vida e posições dos planetas) ficam em um arquivo separado de utilidades.
import {
  calculateSunSign,
  calculateMoonSign,
  calculateAscendant,
  calculateLifePathNumber,
  calculatePlanetPlacements,
} from '@/lib/astralCalculations';

// Formato do perfil astral do usuário: dados de nascimento e signos calculados.
export interface AstralProfile {
  id: string;
  user_id: string;
  birth_date: string;
  birth_time?: string;
  birth_city?: string;
  birth_lat?: number;
  birth_lon?: number;
  sun_sign?: string;
  moon_sign?: string;
  ascendant_sign?: string;
  life_path_number?: number;
  created_at: string;
  updated_at: string;
}

// Hook principal do mapa astral: carrega o perfil, permite salvá-lo (recalculando
// os signos) e traz as posições dos planetas do usuário.
export function useAstral() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Busca o perfil astral já salvo do usuário (ou null se ainda não existe).
  const profileQuery = useQuery({
    queryKey: ['astral_profile', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('astral_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as AstralProfile | null;
    },
  });

  // Salva o perfil astral: a partir dos dados de nascimento, calcula os signos
  // e as posições dos planetas, e grava tudo no banco (cria ou atualiza).
  const saveProfile = useMutation({
    mutationFn: async (input: {
      birth_date: string;
      birth_time?: string;
      birth_city?: string;
      birth_lat?: number;
      birth_lon?: number;
    }) => {
      // A partir da data (e hora) de nascimento, calcula os quatro pilares do
      // mapa: signo solar, lunar, ascendente e o número do caminho de vida.
      const birthDate = new Date(input.birth_date + 'T12:00:00');
      const sunSign = calculateSunSign(birthDate);
      const moonSign = calculateMoonSign(birthDate);
      const ascendant = calculateAscendant(birthDate, input.birth_time);
      const lifePathNumber = calculateLifePathNumber(birthDate);

      // Monta o registro do perfil juntando os dados informados e os calculados.
      const profileData = {
        user_id: user!.id,
        ...input,
        sun_sign: sunSign,
        moon_sign: moonSign,
        ascendant_sign: ascendant,
        life_path_number: lifePathNumber,
      };

      // Verifica se já existe perfil para decidir entre atualizar ou criar.
      const { data: existing } = await supabase
        .from('astral_profiles')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('astral_profiles')
          .update(profileData)
          .eq('user_id', user!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('astral_profiles')
          .insert(profileData);
        if (error) throw error;
      }

      // Calcula as posições dos planetas (signo, casa e graus de cada um).
      const placements = calculatePlanetPlacements(birthDate, input.birth_time);

      // Apaga as posições antigas antes de gravar as novas (recomeça do zero).
      await supabase.from('planet_placements').delete().eq('user_id', user!.id);

      // Prepara e insere as novas linhas de posições planetárias.
      const placementRows = placements.map(p => ({
        user_id: user!.id,
        planet: p.planet,
        sign: p.sign,
        house: p.house,
        degrees: p.degrees,
      }));
      await supabase.from('planet_placements').insert(placementRows);
    },
    // Deu certo: recarrega perfil e planetas na tela e avisa o usuário.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['astral_profile'] });
      queryClient.invalidateQueries({ queryKey: ['planet_placements'] });
      toast.success('Mapa astral calculado com sucesso!');
    },
    onError: () => toast.error('Erro ao salvar perfil astral'),
  });

  // Busca as posições dos planetas do usuário (só depois que o perfil existe).
  const planetPlacementsQuery = useQuery({
    queryKey: ['planet_placements', user?.id],
    enabled: !!user && !!profileQuery.data,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('planet_placements')
        .select('*')
        .eq('user_id', user!.id);
      if (error) throw error;
      return data || [];
    },
  });

  // Entrega para a tela o perfil, os planetas e as funções/estados de salvar.
  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    saveProfile: saveProfile.mutateAsync,
    isSaving: saveProfile.isPending,
    planetPlacements: planetPlacementsQuery.data || [],
  };
}

// Hook do horóscopo do dia: busca o horóscopo já gerado hoje e permite gerar
// um novo (via função de servidor / IA no Supabase).
export function useDailyHoroscope() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  // Data de hoje no formato AAAA-MM-DD, usada como chave do horóscopo do dia.
  const today = new Date().toISOString().split('T')[0];

  // Busca o horóscopo do usuário para a data de hoje (se já foi gerado).
  const query = useQuery({
    queryKey: ['daily_horoscope', user?.id, today],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_horoscopes')
        .select('*')
        .eq('user_id', user!.id)
        .eq('date', today)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Gera o horóscopo chamando a Edge Function 'generate-horoscope' no servidor,
  // passando o signo solar do usuário.
  const generateHoroscope = useMutation({
    mutationFn: async (sunSign: string) => {
      const { data, error } = await supabase.functions.invoke('generate-horoscope', {
        body: { sunSign, userId: user!.id, date: today },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily_horoscope'] });
    },
    onError: () => toast.error('Erro ao gerar horóscopo'),
  });

  return {
    horoscope: query.data,
    isLoading: query.isLoading,
    generateHoroscope: generateHoroscope.mutateAsync,
    isGenerating: generateHoroscope.isPending,
  };
}

// Hook das leituras de tarot: lista o histórico, identifica a leitura de hoje
// e permite salvar novas leituras.
export function useTarotReadings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  // Busca as últimas 20 leituras de tarot do usuário (histórico recente).
  const query = useQuery({
    queryKey: ['tarot_readings', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tarot_readings')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
  });

  // Busca especificamente a leitura de hoje (DAILY) — a carta do dia, entre o
  // início e o fim do dia atual.
  const todayQuery = useQuery({
    queryKey: ['tarot_today', user?.id, today],
    enabled: !!user,
    queryFn: async () => {
      const startOfDay = `${today}T00:00:00.000Z`;
      const endOfDay = `${today}T23:59:59.999Z`;
      const { data, error } = await supabase
        .from('tarot_readings')
        .select('*')
        .eq('user_id', user!.id)
        .eq('reading_type', 'DAILY')
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay)
        .maybeSingle();
      if (error) throw error;
      return data || null;
    },
  });

  // Salva uma nova leitura de tarot (carta, arcano, se veio invertida, etc.).
  const saveReading = useMutation({
    mutationFn: async (reading: {
      card_name: string;
      card_number: number;
      arcana: string;
      is_reversed: boolean;
      interpretation_text: string;
      reading_type: string;
      user_question?: string;
    }) => {
      const { data, error } = await supabase.from('tarot_readings').insert({
        ...reading,
        user_id: user!.id,
      }).select().single();
      if (error) throw error;
      return data;
    },
    // Após salvar, recarrega o histórico e a leitura de hoje.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarot_readings'] });
      queryClient.invalidateQueries({ queryKey: ['tarot_today'] });
    },
  });

  return {
    readings: query.data || [],
    todayReading: todayQuery.data,
    isTodayLoading: todayQuery.isLoading,
    isLoading: query.isLoading,
    saveReading: saveReading.mutateAsync,
  };
}

// Hook do diário cósmico: lista as reflexões escritas pelo usuário e permite
// salvar uma nova entrada por dia (com humor opcional).
export function useCosmicJournal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Busca as últimas 30 entradas do diário, da mais recente para a mais antiga.
  const query = useQuery({
    queryKey: ['cosmic_journal', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cosmic_journal')
        .select('*')
        .eq('user_id', user!.id)
        .order('entry_date', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data || [];
    },
  });

  // Salva a reflexão do dia: se já existe entrada para a data, atualiza; senão,
  // cria uma nova. Assim há no máximo uma reflexão por dia.
  const saveEntry = useMutation({
    mutationFn: async (entry: { content: string; mood?: string; entry_date?: string }) => {
      const today = new Date().toISOString().split('T')[0];
      const { data: existing } = await supabase
        .from('cosmic_journal')
        .select('id')
        .eq('user_id', user!.id)
        .eq('entry_date', entry.entry_date || today)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('cosmic_journal')
          .update({ content: entry.content, mood: entry.mood })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('cosmic_journal').insert({
          ...entry,
          entry_date: entry.entry_date || today,
          user_id: user!.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cosmic_journal'] });
      toast.success('Reflexão salva no diário cósmico');
    },
    onError: () => toast.error('Erro ao salvar reflexão'),
  });

  return {
    entries: query.data || [],
    isLoading: query.isLoading,
    saveEntry: saveEntry.mutateAsync,
    isSaving: saveEntry.isPending,
  };
}
