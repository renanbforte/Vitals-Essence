ALTER TABLE public.life_diary
ADD COLUMN IF NOT EXISTS kind_to_self text NULL,
ADD COLUMN IF NOT EXISTS carry_forward text NULL;