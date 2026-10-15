-- M3: modo de pontuação por métrica e convite por link.
alter table public.arena_groups
  add column if not exists scoring_mode text not null default 'pillars',
  add column if not exists invite_code text unique,
  add column if not exists is_team_based boolean not null default false;

-- M4: times do desafio
create table if not exists public.arena_teams (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.arena_groups(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
alter table public.arena_members add column if not exists team_id uuid references public.arena_teams(id) on delete set null;

-- M4: chat do grupo
create table if not exists public.arena_chat_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.arena_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.arena_teams to authenticated;
grant select, insert, update, delete on public.arena_chat_messages to authenticated;
grant all on public.arena_teams to service_role;
grant all on public.arena_chat_messages to service_role;

create index if not exists idx_arena_teams_group on public.arena_teams(group_id);
create index if not exists idx_arena_chat_group on public.arena_chat_messages(group_id, created_at);

alter table public.arena_teams enable row level security;
alter table public.arena_chat_messages enable row level security;

create policy "Members view teams" on public.arena_teams for select to authenticated
  using (public.is_arena_member(group_id, auth.uid()));
create policy "Members manage teams" on public.arena_teams for all to authenticated
  using (public.is_arena_member(group_id, auth.uid()))
  with check (public.is_arena_member(group_id, auth.uid()));

create policy "Members view chat" on public.arena_chat_messages for select to authenticated
  using (public.is_arena_member(group_id, auth.uid()));
create policy "Members send chat" on public.arena_chat_messages for insert to authenticated
  with check (auth.uid() = user_id and public.is_arena_member(group_id, auth.uid()));
create policy "Users delete own chat" on public.arena_chat_messages for delete to authenticated
  using (auth.uid() = user_id);
