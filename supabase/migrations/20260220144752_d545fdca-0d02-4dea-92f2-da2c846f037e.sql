
-- Astral: Perfil astral do usuário (dados de nascimento + Big Three)
CREATE TABLE public.astral_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  birth_date DATE NOT NULL,
  birth_time TIME,
  birth_city TEXT,
  birth_lat DECIMAL,
  birth_lon DECIMAL,
  sun_sign TEXT,
  moon_sign TEXT,
  ascendant_sign TEXT,
  life_path_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.astral_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own astral profile"
ON public.astral_profiles FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Posicionamentos planetários
CREATE TABLE public.planet_placements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  planet TEXT NOT NULL,
  sign TEXT NOT NULL,
  house INTEGER,
  degrees DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.planet_placements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own planet placements"
ON public.planet_placements FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Casas astrológicas
CREATE TABLE public.astrological_houses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  house_number INTEGER NOT NULL,
  sign_on_cusp TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.astrological_houses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own astrological houses"
ON public.astrological_houses FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Horóscopos diários gerados por IA
CREATE TABLE public.daily_horoscopes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  sun_sign TEXT NOT NULL,
  horoscope_text TEXT,
  love_insight TEXT,
  career_insight TEXT,
  wellness_insight TEXT,
  creativity_insight TEXT,
  affirmation TEXT,
  moon_phase TEXT,
  focus_areas JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.daily_horoscopes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own daily horoscopes"
ON public.daily_horoscopes FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Leituras de tarot
CREATE TABLE public.tarot_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  card_name TEXT NOT NULL,
  card_number INTEGER,
  arcana TEXT NOT NULL DEFAULT 'major',
  is_reversed BOOLEAN NOT NULL DEFAULT false,
  interpretation_text TEXT,
  reading_type TEXT NOT NULL DEFAULT 'DAILY',
  user_question TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tarot_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tarot readings"
ON public.tarot_readings FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Diário cósmico (reflexões pessoais)
CREATE TABLE public.cosmic_journal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  content TEXT NOT NULL,
  mood TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cosmic_journal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own cosmic journal"
ON public.cosmic_journal FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Relatórios de sinastria (compatibilidade entre usuários)
CREATE TABLE public.synastry_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  friend_user_id UUID NOT NULL,
  friend_name TEXT,
  overall_score DECIMAL,
  harmony_aspects JSONB DEFAULT '[]',
  challenge_aspects JSONB DEFAULT '[]',
  summary_text TEXT,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_user_id)
);

ALTER TABLE public.synastry_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own synastry reports"
ON public.synastry_reports FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger de updated_at para astral_profiles
CREATE TRIGGER update_astral_profiles_updated_at
BEFORE UPDATE ON public.astral_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cosmic_journal_updated_at
BEFORE UPDATE ON public.cosmic_journal
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
