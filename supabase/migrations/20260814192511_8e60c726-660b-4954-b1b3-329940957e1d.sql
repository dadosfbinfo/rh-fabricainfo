
create type public.app_role as enum ('ADMINISTRADOR','EDITOR','VISUALIZADOR');
create type public.tipo_colaborador as enum ('OPERACAO','ADM','CLIENTE','CLIENTE VIP');
create type public.status_funcionario as enum ('ATIVO','DESLIGADO','FERIAS','LICENCA');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  nome text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles readable by authenticated" on public.profiles for select to authenticated using (true);
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'VISUALIZADOR',
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "roles readable by authenticated" on public.user_roles for select to authenticated using (true);
create policy "admins manage roles" on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(),'ADMINISTRADOR')) with check (public.has_role(auth.uid(),'ADMINISTRADOR'));

create or replace function public.can_edit(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(_user_id,'ADMINISTRADOR') or public.has_role(_user_id,'EDITOR')
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare cnt int;
begin
  insert into public.profiles (id, email, nome)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'nome', new.email));
  select count(*) into cnt from public.user_roles;
  insert into public.user_roles (user_id, role)
  values (new.id, case when cnt = 0 then 'ADMINISTRADOR'::public.app_role else 'VISUALIZADOR'::public.app_role end);
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- cadastros auxiliares
create table public.empresas (id uuid primary key default gen_random_uuid(), nome text not null unique, created_at timestamptz not null default now());
create table public.cargos (id uuid primary key default gen_random_uuid(), nome text not null unique, created_at timestamptz not null default now());
create table public.projetos (id uuid primary key default gen_random_uuid(), nome text not null unique, created_at timestamptz not null default now());
create table public.gestores (id uuid primary key default gen_random_uuid(), nome text not null unique, created_at timestamptz not null default now());

create table public.funcionarios (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references public.empresas(id),
  nome text not null,
  data_admissao date,
  cargo_id uuid references public.cargos(id),
  projeto_id uuid references public.projetos(id),
  gestor_id uuid references public.gestores(id),
  tipo_colaborador public.tipo_colaborador,
  status public.status_funcionario not null default 'ATIVO',
  data_desligamento date,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.info_school (
  id uuid primary key default gen_random_uuid(),
  mes date not null,
  funcionario_id uuid not null references public.funcionarios(id) on delete cascade,
  status_infoschool text,
  created_at timestamptz not null default now()
);

create table public.avaliacao_desempenho (
  id uuid primary key default gen_random_uuid(),
  funcionario_id uuid not null references public.funcionarios(id) on delete cascade,
  data_avaliacao date not null default current_date,
  hard_skill numeric(4,2),
  soft_skill numeric(4,2),
  nota_final numeric(5,3) generated always as ((coalesce(hard_skill,0)+coalesce(soft_skill,0))/2) stored,
  created_at timestamptz not null default now()
);

create table public.atestado (
  id uuid primary key default gen_random_uuid(),
  funcionario_id uuid not null references public.funcionarios(id) on delete cascade,
  cid text,
  data date not null,
  total_dias numeric(6,2),
  created_at timestamptz not null default now()
);

create table public.absenteismo (
  id uuid primary key default gen_random_uuid(),
  mes date not null,
  funcionario_id uuid not null references public.funcionarios(id) on delete cascade,
  setor text,
  horas_ausencia_txt text not null default '00:00:00',
  horas_previstas_txt text not null default '00:00:00',
  horas_ausencia_seg integer not null default 0,
  horas_previstas_seg integer not null default 0,
  horas_ausencia_num numeric(12,6) generated always as (horas_ausencia_seg::numeric/86400) stored,
  horas_previstas_num numeric(12,6) generated always as (horas_previstas_seg::numeric/86400) stored,
  percentual_absenteismo numeric(12,6) generated always as (case when horas_previstas_seg = 0 then null else horas_ausencia_seg::numeric/horas_previstas_seg::numeric end) stored,
  created_at timestamptz not null default now()
);

create table public.import_logs (
  id uuid primary key default gen_random_uuid(),
  tabela text not null,
  user_id uuid references auth.users(id) on delete set null,
  user_email text,
  linhas_importadas integer not null default 0,
  linhas_erro integer not null default 0,
  arquivo text,
  created_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['empresas','cargos','projetos','gestores','funcionarios','info_school','avaliacao_desempenho','atestado','absenteismo','import_logs'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "read for authenticated" on public.%I for select to authenticated using (true)', t);
    execute format('create policy "insert for editors" on public.%I for insert to authenticated with check (public.can_edit(auth.uid()))', t);
    execute format('create policy "update for editors" on public.%I for update to authenticated using (public.can_edit(auth.uid())) with check (public.can_edit(auth.uid()))', t);
    execute format('create policy "delete for editors" on public.%I for delete to authenticated using (public.can_edit(auth.uid()))', t);
  end loop;
end $$;

create index on public.funcionarios (status);
create index on public.info_school (funcionario_id);
create index on public.avaliacao_desempenho (funcionario_id);
create index on public.atestado (funcionario_id);
create index on public.absenteismo (funcionario_id);

insert into public.empresas (nome) values ('NC COMÉRCIO');
insert into public.cargos (nome) values ('ANALISTA'),('ASSISTENTE'),('COORDENADOR');
insert into public.projetos (nome) values ('PROJETO ALFA'),('PROJETO BETA');
insert into public.gestores (nome) values ('MARIA SILVA'),('JOÃO SOUZA');
