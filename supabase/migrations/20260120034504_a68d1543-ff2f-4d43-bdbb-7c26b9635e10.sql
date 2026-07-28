-- Add workout tracking to daily_tracking table
ALTER TABLE public.daily_tracking
ADD COLUMN workout_completed boolean DEFAULT false,
ADD COLUMN workout_type text,
ADD COLUMN workout_notes text;