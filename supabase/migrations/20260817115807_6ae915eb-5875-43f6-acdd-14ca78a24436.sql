create or replace function public.is_dev(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(_user_id, 'ADMINISTRADOR_DEV')
$$;

create or replace function public.is_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(_user_id, 'ADMINISTRADOR') or public.has_role(_user_id, 'ADMINISTRADOR_DEV')
$$;

create or replace function public.can_edit(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(_user_id,'ADMINISTRADOR') or public.has_role(_user_id,'EDITOR') or public.has_role(_user_id,'ADMINISTRADOR_DEV')
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare cnt int;
begin
  insert into public.profiles (id, email, nome)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'nome', new.email));
  select count(*) into cnt from public.user_roles;
  insert into public.user_roles (user_id, role)
  values (new.id, case when cnt = 0 then 'ADMINISTRADOR_DEV'::public.app_role else 'VISUALIZADOR'::public.app_role end);
  return new;
end; $$;

revoke all on function public.is_dev(uuid) from public, anon;
revoke all on function public.is_admin(uuid) from public, anon;

drop policy if exists "admins manage api keys" on public.api_keys;
drop policy if exists "admins read api keys" on public.api_keys;
create policy "dev manage api keys" on public.api_keys for all to authenticated
  using (public.is_dev(auth.uid())) with check (public.is_dev(auth.uid()));

drop policy if exists "admins manage roles" on public.user_roles;
create policy "admins manage roles" on public.user_roles for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create table if not exists public.api_access_logs (
  id uuid primary key default gen_random_uuid(),
  tabela text not null,
  acessado_em timestamptz not null default now(),
  api_key_id uuid references public.api_keys(id) on delete set null
);
grant select on public.api_access_logs to authenticated;
grant all on public.api_access_logs to service_role;
alter table public.api_access_logs enable row level security;
create policy "dev reads api logs" on public.api_access_logs for select to authenticated
  using (public.is_dev(auth.uid()));