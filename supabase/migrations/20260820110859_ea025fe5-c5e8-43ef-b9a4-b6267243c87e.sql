DROP POLICY IF EXISTS "admins manage roles" ON public.user_roles;

CREATE POLICY "dev manage all roles" ON public.user_roles
FOR ALL TO authenticated
USING (public.is_dev(auth.uid()))
WITH CHECK (public.is_dev(auth.uid()));

CREATE POLICY "admin insert non dev roles" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin(auth.uid())
  AND role <> 'ADMINISTRADOR_DEV'::public.app_role
  AND NOT public.is_dev(user_id)
);

CREATE POLICY "admin update non dev roles" ON public.user_roles
FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()) AND NOT public.is_dev(user_id))
WITH CHECK (
  public.is_admin(auth.uid())
  AND role <> 'ADMINISTRADOR_DEV'::public.app_role
  AND NOT public.is_dev(user_id)
);

CREATE POLICY "admin delete non dev roles" ON public.user_roles
FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()) AND NOT public.is_dev(user_id));