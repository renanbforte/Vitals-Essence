-- Create table to track medication intake per schedule time
CREATE TABLE public.medication_intake_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  medication_id UUID NOT NULL REFERENCES public.user_medications(id) ON DELETE CASCADE,
  schedule_time TEXT NOT NULL,
  intake_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(medication_id, schedule_time, intake_date)
);

-- Enable RLS
ALTER TABLE public.medication_intake_log ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own medication intake logs"
ON public.medication_intake_log
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own medication intake logs"
ON public.medication_intake_log
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medication intake logs"
ON public.medication_intake_log
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medication intake logs"
ON public.medication_intake_log
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_medication_intake_date ON public.medication_intake_log(medication_id, intake_date);
CREATE INDEX idx_medication_intake_user ON public.medication_intake_log(user_id, intake_date);