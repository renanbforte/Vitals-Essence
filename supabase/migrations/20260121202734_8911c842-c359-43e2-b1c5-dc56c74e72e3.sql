
-- Create table for meal photos
CREATE TABLE public.meal_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  meal_key TEXT NOT NULL,
  date DATE NOT NULL,
  photo_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meal_photos ENABLE ROW LEVEL SECURITY;

-- RLS policies for meal_photos
CREATE POLICY "Users can view their own meal photos"
  ON public.meal_photos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meal photos"
  ON public.meal_photos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal photos"
  ON public.meal_photos FOR DELETE
  USING (auth.uid() = user_id);

-- Create table for progress/weight photos
CREATE TABLE public.progress_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  photo_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;

-- RLS policies for progress_photos
CREATE POLICY "Users can view their own progress photos"
  ON public.progress_photos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress photos"
  ON public.progress_photos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress photos"
  ON public.progress_photos FOR DELETE
  USING (auth.uid() = user_id);

-- Create table for friendships
CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, rejected
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Enable RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- RLS policies for friendships
CREATE POLICY "Users can view friendships they are part of"
  ON public.friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendship requests"
  ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friendships they are part of"
  ON public.friendships FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete their own friendship requests"
  ON public.friendships FOR DELETE
  USING (auth.uid() = user_id);

-- Add policies to allow friends to view each other's photos and tracking
CREATE POLICY "Friends can view meal photos"
  ON public.meal_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.friendships
      WHERE status = 'accepted'
      AND ((user_id = auth.uid() AND friend_id = meal_photos.user_id)
           OR (friend_id = auth.uid() AND user_id = meal_photos.user_id))
    )
  );

CREATE POLICY "Friends can view progress photos"
  ON public.progress_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.friendships
      WHERE status = 'accepted'
      AND ((user_id = auth.uid() AND friend_id = progress_photos.user_id)
           OR (friend_id = auth.uid() AND user_id = progress_photos.user_id))
    )
  );

CREATE POLICY "Friends can view daily tracking"
  ON public.daily_tracking FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.friendships
      WHERE status = 'accepted'
      AND ((user_id = auth.uid() AND friend_id = daily_tracking.user_id)
           OR (friend_id = auth.uid() AND user_id = daily_tracking.user_id))
    )
  );

-- Add friend_code to profiles for easy friend adding
ALTER TABLE public.profiles ADD COLUMN friend_code TEXT UNIQUE;

-- Create function to generate unique friend code
CREATE OR REPLACE FUNCTION public.generate_friend_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.friend_code := upper(substring(md5(random()::text) from 1 for 8));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-generate friend code
CREATE TRIGGER set_friend_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.friend_code IS NULL)
  EXECUTE FUNCTION public.generate_friend_code();

-- Update existing profiles with friend codes
UPDATE public.profiles SET friend_code = upper(substring(md5(random()::text || id::text) from 1 for 8)) WHERE friend_code IS NULL;

-- Create storage buckets for photos
INSERT INTO storage.buckets (id, name, public) VALUES ('meal-photos', 'meal-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('progress-photos', 'progress-photos', true);

-- Storage policies for meal-photos
CREATE POLICY "Users can upload their own meal photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'meal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view meal photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'meal-photos');

CREATE POLICY "Users can delete their own meal photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'meal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for progress-photos
CREATE POLICY "Users can upload their own progress photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view progress photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'progress-photos');

CREATE POLICY "Users can delete their own progress photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Update timestamp trigger for friendships
CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
