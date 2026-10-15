-- Comentários no feed da Arena (as reações já existem em arena_feed_reactions).
create table public.arena_feed_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.arena_feed_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.arena_feed_comments to authenticated;
grant all on public.arena_feed_comments to service_role;

create index idx_arena_comments_post on public.arena_feed_comments(post_id, created_at);

alter table public.arena_feed_comments enable row level security;

create policy "Members can view comments" on public.arena_feed_comments
  for select to authenticated
  using (exists (
    select 1 from public.arena_feed_posts p
    where p.id = arena_feed_comments.post_id and public.is_arena_member(p.group_id, auth.uid())
  ));

create policy "Members can comment" on public.arena_feed_comments
  for insert to authenticated
  with check (auth.uid() = user_id and exists (
    select 1 from public.arena_feed_posts p
    where p.id = arena_feed_comments.post_id and public.is_arena_member(p.group_id, auth.uid())
  ));

create policy "Users can delete own comments" on public.arena_feed_comments
  for delete to authenticated
  using (auth.uid() = user_id);
