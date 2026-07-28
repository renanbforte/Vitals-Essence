
-- 1. Food/grocery items table
CREATE TABLE public.trip_meals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  meal_date TEXT,
  cost NUMERIC DEFAULT 0,
  cost_mode TEXT DEFAULT 'total',
  quantity INTEGER DEFAULT 1,
  currency TEXT DEFAULT 'BRL',
  contact TEXT,
  email TEXT,
  link TEXT,
  notes TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.trip_meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage trip meals they have access to"
ON public.trip_meals FOR ALL
USING (public.has_trip_access(trip_id));

-- 2. External split participants (people not in the app)
CREATE TABLE public.trip_split_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.trip_split_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage split participants for their trips"
ON public.trip_split_participants FOR ALL
USING (public.has_trip_access(trip_id));

-- 3. Expense splits - tracks share and payment per person per expense
CREATE TABLE public.trip_expense_splits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID NOT NULL REFERENCES public.trip_expenses(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  participant_type TEXT NOT NULL DEFAULT 'member', -- 'member' or 'external'
  participant_user_id UUID, -- for trip members
  participant_external_id UUID REFERENCES public.trip_split_participants(id) ON DELETE CASCADE,
  share_amount NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.trip_expense_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage expense splits for their trips"
ON public.trip_expense_splits FOR ALL
USING (public.has_trip_access(trip_id));

-- 4. Add split tracking columns to expenses
ALTER TABLE public.trip_expenses ADD COLUMN IF NOT EXISTS split_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.trip_expenses ADD COLUMN IF NOT EXISTS paid_by_user_id UUID;
ALTER TABLE public.trip_expenses ADD COLUMN IF NOT EXISTS paid_by_external_id UUID REFERENCES public.trip_split_participants(id);
