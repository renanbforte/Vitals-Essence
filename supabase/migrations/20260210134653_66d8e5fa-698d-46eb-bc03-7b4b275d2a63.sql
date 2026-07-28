ALTER TABLE public.financial_transactions DROP CONSTRAINT financial_transactions_recurrence_type_check;

ALTER TABLE public.financial_transactions ADD CONSTRAINT financial_transactions_recurrence_type_check 
  CHECK (recurrence_type IS NULL OR recurrence_type = ANY (ARRAY['daily','weekly','monthly','yearly','custom','days','weeks','months','years']));
