
-- Add new columns to investments table for the complete investment area
ALTER TABLE public.investments 
  ADD COLUMN IF NOT EXISTS priority integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS objective text,
  ADD COLUMN IF NOT EXISTS target_value numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS investment_type text;

-- Create index for priority ordering
CREATE INDEX IF NOT EXISTS idx_investments_priority ON public.investments(user_id, priority);
