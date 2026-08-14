
create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  chave text not null unique,
  descricao text,
  revogada boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);
grant select, insert, update, delete on public.api_keys to authenticated;
grant all on public.api_keys to service_role;
alter table public.api_keys enable row level security;
create policy "admins read api keys" on public.api_keys for select to authenticated
  using (public.has_role(auth.uid(),'ADMINISTRADOR'));
create policy "admins manage api keys" on public.api_keys for all to authenticated
  using (public.has_role(auth.uid(),'ADMINISTRADOR')) with check (public.has_role(auth.uid(),'ADMINISTRADOR'));
