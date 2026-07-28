
-- Create workout_photos table
CREATE TABLE public.workout_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workout_photos ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own workout photos"
  ON public.workout_photos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workout photos"
  ON public.workout_photos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout photos"
  ON public.workout_photos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout photos"
  ON public.workout_photos FOR DELETE
  USING (auth.uid() = user_id);

-- Create workout-photos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('workout-photos', 'workout-photos', true);

-- Storage policies
CREATE POLICY "Users can view workout photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'workout-photos');

CREATE POLICY "Users can upload workout photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'workout-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update workout photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'workout-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete workout photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'workout-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
