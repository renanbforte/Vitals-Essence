import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  calculateSunSign,
  calculateMoonSign,
  calculateAscendant,
  calculateLifePathNumber,
  calculatePlanetPlacements,
} from '@/lib/astralCalculations';

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

export function useAstral() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

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

  const saveProfile = useMutation({
    mutationFn: async (input: {
      birth_date: string;
      birth_time?: string;
      birth_city?: string;
      birth_lat?: number;
      birth_lon?: number;
    }) => {
      const birthDate = new Date(input.birth_date + 'T12:00:00');
      const sunSign = calculateSunSign(birthDate);
      const moonSign = calculateMoonSign(birthDate);
      const ascendant = calculateAscendant(birthDate, input.birth_time);
      const lifePathNumber = calculateLifePathNumber(birthDate);

      const profileData = {
        user_id: user!.id,
        ...input,
        sun_sign: sunSign,
        moon_sign: moonSign,
        ascendant_sign: ascendant,
        life_path_number: lifePathNumber,
      };

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

      // Calculate and save planet placements
      const placements = calculatePlanetPlacements(birthDate, input.birth_time);

      // Delete old placements
      await supabase.from('planet_placements').delete().eq('user_id', user!.id);

      const placementRows = placements.map(p => ({
        user_id: user!.id,
        planet: p.planet,
        sign: p.sign,
        house: p.house,
        degrees: p.degrees,
      }));
      await supabase.from('planet_placements').insert(placementRows);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['astral_profile'] });
      queryClient.invalidateQueries({ queryKey: ['planet_placements'] });
      toast.success('Mapa astral calculado com sucesso!');
    },
    onError: () => toast.error('Erro ao salvar perfil astral'),
  });

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

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    saveProfile: saveProfile.mutateAsync,
    isSaving: saveProfile.isPending,
    planetPlacements: planetPlacementsQuery.data || [],
  };
}

export function useDailyHoroscope() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

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

export function useTarotReadings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

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

  // Busca especificamente a leitura de hoje (DAILY)
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

export function useCosmicJournal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

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
