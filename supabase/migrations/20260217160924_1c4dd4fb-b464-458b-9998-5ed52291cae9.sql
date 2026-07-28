
-- Add parent_expense_id to gathering_expenses for grouping items under a receipt/purchase
ALTER TABLE public.gathering_expenses 
ADD COLUMN parent_expense_id uuid REFERENCES public.gathering_expenses(id) ON DELETE CASCADE DEFAULT NULL;

-- Add label column to distinguish parent receipts (e.g. "Compras Mercado X") 
ALTER TABLE public.gathering_expenses
ADD COLUMN is_group boolean NOT NULL DEFAULT false;

-- Index for fast child lookups
CREATE INDEX idx_gathering_expenses_parent ON public.gathering_expenses(parent_expense_id) WHERE parent_expense_id IS NOT NULL;
