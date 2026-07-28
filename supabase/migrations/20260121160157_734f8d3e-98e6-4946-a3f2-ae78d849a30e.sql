-- Create table for user hydration schedule
CREATE TABLE public.user_hydration_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  schedule_time TEXT NOT NULL,
  amount_ml INTEGER NOT NULL DEFAULT 250,
  label TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_hydration_schedule ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own hydration schedule" 
ON public.user_hydration_schedule 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own hydration schedule" 
ON public.user_hydration_schedule 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hydration schedule" 
ON public.user_hydration_schedule 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hydration schedule" 
ON public.user_hydration_schedule 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for timestamps
CREATE TRIGGER update_user_hydration_schedule_updated_at
BEFORE UPDATE ON public.user_hydration_schedule
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add column to daily_tracking to store completed hydration entries
ALTER TABLE public.daily_tracking 
ADD COLUMN hydration_schedule_completed JSONB DEFAULT '[]'::jsonb;