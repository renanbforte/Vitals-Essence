
-- Arena Groups table
CREATE TABLE public.arena_groups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  avatar_url text,
  
  -- Duration
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  
  -- Type: private, public, hybrid
  group_type text NOT NULL DEFAULT 'private',
  
  -- Transparency: full, partial, discreet
  transparency_level text NOT NULL DEFAULT 'full',
  
  -- Pillars (at least 1 must be true)
  pillar_hydration boolean NOT NULL DEFAULT true,
  pillar_nutrition boolean NOT NULL DEFAULT true,
  pillar_workout boolean NOT NULL DEFAULT true,
  
  -- Rules
  photo_required boolean NOT NULL DEFAULT false,
  deadline_hour time,
  streak_breaks_on_fail boolean NOT NULL DEFAULT false,
  ranking_resets_weekly boolean NOT NULL DEFAULT false,
  
  -- Intensity: light, balanced, hardcore
  intensity text NOT NULL DEFAULT 'balanced',
  
  -- Ranking types (can enable multiple)
  ranking_total_score boolean NOT NULL DEFAULT true,
  ranking_evolution boolean NOT NULL DEFAULT false,
  ranking_streak boolean NOT NULL DEFAULT false,
  ranking_balance boolean NOT NULL DEFAULT false,
  
  -- Calendar visibility
  calendar_show_photos boolean NOT NULL DEFAULT true,
  calendar_show_daily_score boolean NOT NULL DEFAULT true,
  calendar_members_only boolean NOT NULL DEFAULT true,
  
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.arena_groups ENABLE ROW LEVEL SECURITY;

-- Arena Members table
CREATE TABLE public.arena_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES public.arena_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member', -- creator, admin, member
  status text NOT NULL DEFAULT 'pending', -- pending, accepted, rejected
  joined_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.arena_members ENABLE ROW LEVEL SECURITY;

-- Arena Daily Scores (computed from health data)
CREATE TABLE public.arena_daily_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES public.arena_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  
  -- Pillar scores (0-100 each)
  hydration_score integer DEFAULT 0,
  nutrition_score integer DEFAULT 0,
  workout_score integer DEFAULT 0,
  total_score integer DEFAULT 0,
  
  -- Streak
  current_streak integer DEFAULT 0,
  
  -- Photo proof
  photo_url text,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id, date)
);

ALTER TABLE public.arena_daily_scores ENABLE ROW LEVEL SECURITY;

-- Arena Feed Posts
CREATE TABLE public.arena_feed_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES public.arena_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  
  post_type text NOT NULL DEFAULT 'check_in', -- check_in, achievement, milestone
  content text,
  photo_url text,
  
  -- Snapshot of scores for this post
  hydration_score integer,
  nutrition_score integer,
  workout_score integer,
  total_score integer,
  
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.arena_feed_posts ENABLE ROW LEVEL SECURITY;

-- Arena Feed Reactions
CREATE TABLE public.arena_feed_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.arena_feed_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL DEFAULT '🔥',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, emoji)
);

ALTER TABLE public.arena_feed_reactions ENABLE ROW LEVEL SECURITY;

-- Security definer function to check arena membership
CREATE OR REPLACE FUNCTION public.is_arena_member(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM arena_members 
    WHERE group_id = p_group_id 
    AND user_id = p_user_id 
    AND status = 'accepted'
  ) OR EXISTS (
    SELECT 1 FROM arena_groups
    WHERE id = p_group_id
    AND creator_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_arena_creator(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM arena_groups
    WHERE id = p_group_id
    AND creator_id = p_user_id
  );
$$;

-- RLS Policies for arena_groups
CREATE POLICY "Public groups are visible to all" ON public.arena_groups
  FOR SELECT USING (group_type = 'public' OR group_type = 'hybrid');

CREATE POLICY "Members can view their groups" ON public.arena_groups
  FOR SELECT USING (is_arena_member(id, auth.uid()));

CREATE POLICY "Creator can manage group" ON public.arena_groups
  FOR ALL USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());

-- RLS Policies for arena_members
CREATE POLICY "Members can view group members" ON public.arena_members
  FOR SELECT USING (is_arena_member(group_id, auth.uid()));

CREATE POLICY "Users can join public groups" ON public.arena_members
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND (
      EXISTS (SELECT 1 FROM arena_groups WHERE id = group_id AND group_type IN ('public', 'hybrid'))
      OR is_arena_member(group_id, auth.uid())
    )
  );

CREATE POLICY "Creator can manage members" ON public.arena_members
  FOR ALL USING (is_arena_creator(group_id, auth.uid()));

CREATE POLICY "Users can leave groups" ON public.arena_members
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can update own membership" ON public.arena_members
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for arena_daily_scores
CREATE POLICY "Members can view group scores" ON public.arena_daily_scores
  FOR SELECT USING (is_arena_member(group_id, auth.uid()));

CREATE POLICY "Users can manage own scores" ON public.arena_daily_scores
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for arena_feed_posts
CREATE POLICY "Members can view feed" ON public.arena_feed_posts
  FOR SELECT USING (is_arena_member(group_id, auth.uid()));

CREATE POLICY "Members can post" ON public.arena_feed_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_arena_member(group_id, auth.uid()));

CREATE POLICY "Users can delete own posts" ON public.arena_feed_posts
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for arena_feed_reactions
CREATE POLICY "Members can view reactions" ON public.arena_feed_reactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM arena_feed_posts p WHERE p.id = post_id AND is_arena_member(p.group_id, auth.uid()))
  );

CREATE POLICY "Members can react" ON public.arena_feed_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own reactions" ON public.arena_feed_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Updated at triggers
CREATE TRIGGER update_arena_groups_updated_at BEFORE UPDATE ON public.arena_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_arena_members_updated_at BEFORE UPDATE ON public.arena_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_arena_daily_scores_updated_at BEFORE UPDATE ON public.arena_daily_scores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for feed and scores
ALTER PUBLICATION supabase_realtime ADD TABLE public.arena_feed_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.arena_daily_scores;
ALTER PUBLICATION supabase_realtime ADD TABLE public.arena_members;
