-- Table for transaction file attachments
CREATE TABLE public.transaction_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES public.financial_transactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.transaction_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attachments"
  ON public.transaction_attachments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attachments"
  ON public.transaction_attachments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own attachments"
  ON public.transaction_attachments FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_transaction_attachments_transaction ON public.transaction_attachments(transaction_id);

-- Storage bucket for transaction attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('transaction-attachments', 'transaction-attachments', false);

CREATE POLICY "Users can upload transaction attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'transaction-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own transaction attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'transaction-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own transaction attachments"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'transaction-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);