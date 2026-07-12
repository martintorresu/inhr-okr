-- 1. Restrict demo tenant read policies to authenticated users only (remove anon).

DROP POLICY IF EXISTS "Demo tenant team members are readable" ON public.team_members;
CREATE POLICY "Demo tenant team members are readable"
  ON public.team_members FOR SELECT TO authenticated
  USING (tenant_id = 'quimetal'::text);

DROP POLICY IF EXISTS "Demo tenant roles are readable" ON public.user_roles;
CREATE POLICY "Demo tenant roles are readable"
  ON public.user_roles FOR SELECT TO authenticated
  USING (tenant_id = 'quimetal'::text);

DROP POLICY IF EXISTS "Demo tenant OKRs are readable" ON public.okr_objectives;
CREATE POLICY "Demo tenant OKRs are readable"
  ON public.okr_objectives FOR SELECT TO authenticated
  USING (tenant_id = 'quimetal'::text);

DROP POLICY IF EXISTS "Demo tenant initiatives are readable" ON public.okr_initiatives;
CREATE POLICY "Demo tenant initiatives are readable"
  ON public.okr_initiatives FOR SELECT TO authenticated
  USING (tenant_id = 'quimetal'::text);

DROP POLICY IF EXISTS "Demo checkins readable" ON public.okr_checkins;
CREATE POLICY "Demo checkins readable"
  ON public.okr_checkins FOR SELECT TO authenticated
  USING (tenant_id = 'quimetal'::text);

DROP POLICY IF EXISTS "Demo schedules readable" ON public.okr_checkin_schedules;
CREATE POLICY "Demo schedules readable"
  ON public.okr_checkin_schedules FOR SELECT TO authenticated
  USING (tenant_id = 'quimetal'::text);

DROP POLICY IF EXISTS "Demo change log readable" ON public.okr_change_log;
CREATE POLICY "Demo change log readable"
  ON public.okr_change_log FOR SELECT TO authenticated
  USING (tenant_id = 'quimetal'::text);

-- 2. Prevent signed-in users from directly executing the SECURITY DEFINER
--    admin helper. It remains usable inside RLS policy evaluation.
REVOKE EXECUTE ON FUNCTION public.is_tenant_admin(text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_tenant_admin(text) FROM PUBLIC;
