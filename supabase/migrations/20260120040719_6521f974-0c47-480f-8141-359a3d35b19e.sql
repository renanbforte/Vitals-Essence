-- Add medication tracking to daily_tracking table
ALTER TABLE public.daily_tracking
ADD COLUMN medication_morning_completed boolean DEFAULT false,
ADD COLUMN medication_afternoon_completed boolean DEFAULT false;