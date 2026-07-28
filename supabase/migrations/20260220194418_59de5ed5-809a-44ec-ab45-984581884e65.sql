ALTER TABLE public.life_relationships
ADD COLUMN IF NOT EXISTS importance integer NOT NULL DEFAULT 3;

COMMENT ON COLUMN public.life_relationships.importance IS '1=Presença, 2=Próximo, 3=Próximo+, 4=Pilar, 5=Núcleo';