
-- Tabela de admins da plataforma (apenas Renan inicialmente)
CREATE TABLE IF NOT EXISTS public.platform_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- Apenas o próprio admin pode verificar se é admin (leitura)
CREATE POLICY "Admins can view own record"
  ON public.platform_admins FOR SELECT
  USING (auth.uid() = user_id);

-- Inserir o Renan como admin
INSERT INTO public.platform_admins (user_id)
VALUES ('eb08b6f3-8f67-4f0c-a8a1-c5d22a3f75ed')
ON CONFLICT DO NOTHING;

-- Tabela de premium vitalício
CREATE TABLE IF NOT EXISTS public.lifetime_premium_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  added_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lifetime_premium_users ENABLE ROW LEVEL SECURITY;

-- Qualquer autenticado pode verificar se ele mesmo é premium vitalício
CREATE POLICY "Users can check own lifetime status"
  ON public.lifetime_premium_users FOR SELECT
  USING (auth.uid() = user_id);

-- Admins podem ver todos os registros (via security definer abaixo)
CREATE POLICY "Admins can view all lifetime users"
  ON public.lifetime_premium_users FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()));

-- Admins podem inserir
CREATE POLICY "Admins can insert lifetime users"
  ON public.lifetime_premium_users FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()));

-- Admins podem deletar
CREATE POLICY "Admins can delete lifetime users"
  ON public.lifetime_premium_users FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()));

-- Tabela de trials por módulo (14 dias por conta)
CREATE TABLE IF NOT EXISTS public.module_trials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module_key text NOT NULL,
  trial_start timestamptz NOT NULL DEFAULT now(),
  trial_end timestamptz NOT NULL DEFAULT (now() + INTERVAL '14 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_key)
);

ALTER TABLE public.module_trials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own trials"
  ON public.module_trials FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Função para verificar se é admin da plataforma (evita recursão RLS)
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins WHERE user_id = _user_id
  );
$$;

-- Função para verificar se tem premium vitalício
CREATE OR REPLACE FUNCTION public.has_lifetime_premium(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.lifetime_premium_users WHERE user_id = _user_id
  );
$$;
