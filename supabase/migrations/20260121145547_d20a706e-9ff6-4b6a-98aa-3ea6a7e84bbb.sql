-- Create table for exam files
CREATE TABLE public.exam_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  exam_date DATE NOT NULL,
  exam_type TEXT,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for extracted exam results
CREATE TABLE public.exam_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  exam_upload_id UUID REFERENCES public.exam_uploads(id) ON DELETE CASCADE,
  exam_date DATE NOT NULL,
  biomarker_name TEXT NOT NULL,
  biomarker_category TEXT NOT NULL,
  value NUMERIC,
  unit TEXT,
  reference_min NUMERIC,
  reference_max NUMERIC,
  status TEXT, -- 'normal', 'low', 'high'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.exam_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

-- RLS policies for exam_uploads
CREATE POLICY "Users can view their own exam uploads" 
ON public.exam_uploads FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own exam uploads" 
ON public.exam_uploads FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exam uploads" 
ON public.exam_uploads FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own exam uploads" 
ON public.exam_uploads FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS policies for exam_results
CREATE POLICY "Users can view their own exam results" 
ON public.exam_results FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own exam results" 
ON public.exam_results FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exam results" 
ON public.exam_results FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own exam results" 
ON public.exam_results FOR UPDATE 
USING (auth.uid() = user_id);

-- Create storage bucket for exams
INSERT INTO storage.buckets (id, name, public) VALUES ('exams', 'exams', false);

-- Storage policies
CREATE POLICY "Users can upload their own exams"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'exams' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own exams"
ON storage.objects FOR SELECT
USING (bucket_id = 'exams' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own exams"
ON storage.objects FOR DELETE
USING (bucket_id = 'exams' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add triggers for updated_at
CREATE TRIGGER update_exam_uploads_updated_at
BEFORE UPDATE ON public.exam_uploads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exam_results_updated_at
BEFORE UPDATE ON public.exam_results
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();