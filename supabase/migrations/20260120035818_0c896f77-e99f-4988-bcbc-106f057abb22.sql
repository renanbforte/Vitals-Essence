-- Create user_meal_plans table for customizable meals
CREATE TABLE public.user_meal_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  meal_key TEXT NOT NULL, -- breakfast, morning_snack, lunch, etc.
  meal_name TEXT NOT NULL,
  meal_time TEXT NOT NULL,
  main_description TEXT,
  main_ingredients JSONB DEFAULT '[]'::jsonb,
  main_macros JSONB DEFAULT '{"calories": 0, "protein": 0, "carbs": 0, "fat": 0}'::jsonb,
  alt_description TEXT,
  alt_ingredients JSONB DEFAULT '[]'::jsonb,
  alt_macros JSONB DEFAULT '{"calories": 0, "protein": 0, "carbs": 0, "fat": 0}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, meal_key)
);

-- Create user_workout_plans table for customizable workouts
CREATE TABLE public.user_workout_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, etc.
  workout_type TEXT NOT NULL,
  workout_name TEXT NOT NULL,
  description TEXT,
  duration TEXT,
  details JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, day_of_week)
);

-- Enable RLS
ALTER TABLE public.user_meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_workout_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meal plans
CREATE POLICY "Users can view their own meal plans"
ON public.user_meal_plans FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own meal plans"
ON public.user_meal_plans FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal plans"
ON public.user_meal_plans FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal plans"
ON public.user_meal_plans FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for workout plans
CREATE POLICY "Users can view their own workout plans"
ON public.user_workout_plans FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workout plans"
ON public.user_workout_plans FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout plans"
ON public.user_workout_plans FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout plans"
ON public.user_workout_plans FOR DELETE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_user_meal_plans_updated_at
BEFORE UPDATE ON public.user_meal_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_workout_plans_updated_at
BEFORE UPDATE ON public.user_workout_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();