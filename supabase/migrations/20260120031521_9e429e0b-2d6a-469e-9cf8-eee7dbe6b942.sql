-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  target_weight DECIMAL(5,1) DEFAULT 80.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Create daily tracking table
CREATE TABLE public.daily_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  water_ml INTEGER DEFAULT 0,
  breakfast_completed BOOLEAN DEFAULT FALSE,
  morning_snack_completed BOOLEAN DEFAULT FALSE,
  lunch_completed BOOLEAN DEFAULT FALSE,
  afternoon_snack_completed BOOLEAN DEFAULT FALSE,
  dinner_completed BOOLEAN DEFAULT FALSE,
  night_snack_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS on daily_tracking
ALTER TABLE public.daily_tracking ENABLE ROW LEVEL SECURITY;

-- Daily tracking policies
CREATE POLICY "Users can view their own daily tracking" 
ON public.daily_tracking FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily tracking" 
ON public.daily_tracking FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily tracking" 
ON public.daily_tracking FOR UPDATE USING (auth.uid() = user_id);

-- Create weight history table
CREATE TABLE public.weight_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight_kg DECIMAL(5,1) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS on weight_history
ALTER TABLE public.weight_history ENABLE ROW LEVEL SECURITY;

-- Weight history policies
CREATE POLICY "Users can view their own weight history" 
ON public.weight_history FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weight history" 
ON public.weight_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weight history" 
ON public.weight_history FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weight history" 
ON public.weight_history FOR DELETE USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_tracking_updated_at
BEFORE UPDATE ON public.daily_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto-creating profile on signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();