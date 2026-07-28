-- Create table for user food preferences
CREATE TABLE public.user_food_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  food_name TEXT NOT NULL,
  food_category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, food_name)
);

-- Enable RLS
ALTER TABLE public.user_food_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own food preferences"
ON public.user_food_preferences
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own food preferences"
ON public.user_food_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own food preferences"
ON public.user_food_preferences
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own food preferences"
ON public.user_food_preferences
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_food_preferences_updated_at
BEFORE UPDATE ON public.user_food_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();