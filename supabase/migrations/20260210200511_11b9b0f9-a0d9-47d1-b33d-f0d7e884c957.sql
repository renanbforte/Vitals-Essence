
CREATE TABLE public.bank_balances (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  bank_name text NOT NULL,
  initial_balance numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, bank_name)
);

ALTER TABLE public.bank_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bank balances" ON public.bank_balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bank balances" ON public.bank_balances FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bank balances" ON public.bank_balances FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bank balances" ON public.bank_balances FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_bank_balances_updated_at
BEFORE UPDATE ON public.bank_balances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
