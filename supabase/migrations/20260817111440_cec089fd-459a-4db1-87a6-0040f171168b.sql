
create or replace function public.tem_acesso(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id)
$$;
revoke all on function public.tem_acesso(uuid) from public, anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array['empresas','cargos','projetos','gestores','funcionarios','info_school','avaliacao_desempenho','atestado','absenteismo','import_logs'] loop
    execute format('drop policy if exists "read for authenticated" on public.%I', t);
    execute format('create policy "read for provisioned users" on public.%I for select to authenticated using (public.tem_acesso(auth.uid()))', t);
  end loop;
end $$;
