-- Create table for user medications
CREATE TABLE public.user_medications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  composition TEXT,
  dosage TEXT,
  schedule_times TEXT[] DEFAULT '{}',
  notes TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_medications ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own medications"
ON public.user_medications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own medications"
ON public.user_medications FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medications"
ON public.user_medications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medications"
ON public.user_medications FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_medications_updated_at
BEFORE UPDATE ON public.user_medications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();