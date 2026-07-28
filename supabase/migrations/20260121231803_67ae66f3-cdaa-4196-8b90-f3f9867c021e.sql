-- Add frequency column to user_workout_plans
ALTER TABLE public.user_workout_plans 
ADD COLUMN IF NOT EXISTS weekly_frequency integer DEFAULT 1;

-- Add column comment
COMMENT ON COLUMN public.user_workout_plans.weekly_frequency IS 'Number of times per week this activity is performed';

-- Remove unique constraint on day_of_week to allow multiple activities
ALTER TABLE public.user_workout_plans DROP CONSTRAINT IF EXISTS user_workout_plans_user_id_day_of_week_key;

-- Add order_index for sorting activities
ALTER TABLE public.user_workout_plans 
ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0;