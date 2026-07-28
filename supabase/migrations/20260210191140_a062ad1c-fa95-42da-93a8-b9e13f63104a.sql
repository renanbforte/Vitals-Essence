ALTER TABLE public.financial_transactions
ADD COLUMN payment_method TEXT DEFAULT NULL,
ADD COLUMN card_bank TEXT DEFAULT NULL;