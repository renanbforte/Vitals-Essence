-- Entrar num desafio pelo código de convite. SECURITY DEFINER para achar o grupo
-- pelo código mesmo antes de o usuário ser membro; só adiciona o próprio usuário.
create or replace function public.join_arena_by_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group uuid;
  v_existing uuid;
begin
  select id into v_group from arena_groups where invite_code = upper(p_code) and status <> 'ended';
  if v_group is null then
    raise exception 'Código inválido ou desafio encerrado';
  end if;

  select id into v_existing from arena_members where group_id = v_group and user_id = auth.uid();
  if v_existing is not null then
    update arena_members set status = 'accepted', joined_at = coalesce(joined_at, now()) where id = v_existing;
  else
    insert into arena_members (group_id, user_id, role, status, joined_at)
    values (v_group, auth.uid(), 'member', 'accepted', now());
  end if;

  return v_group;
end $$;

grant execute on function public.join_arena_by_code(text) to authenticated;
