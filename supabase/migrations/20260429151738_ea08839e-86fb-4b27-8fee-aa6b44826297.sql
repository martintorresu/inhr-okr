-- Add 'grupoactitud' tenant to RLS policies across all tenant tables

-- okr_objectives
DROP POLICY IF EXISTS "Authenticated users can create tenant OKRs" ON public.okr_objectives;
DROP POLICY IF EXISTS "Authenticated users can delete tenant OKRs" ON public.okr_objectives;
DROP POLICY IF EXISTS "Authenticated users can read tenant OKRs" ON public.okr_objectives;
DROP POLICY IF EXISTS "Authenticated users can update tenant OKRs" ON public.okr_objectives;

CREATE POLICY "Authenticated users can create tenant OKRs" ON public.okr_objectives
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = ANY (ARRAY['inhr','inovahr','grupoactitud']));
CREATE POLICY "Authenticated users can delete tenant OKRs" ON public.okr_objectives
  FOR DELETE TO authenticated
  USING (tenant_id = ANY (ARRAY['inhr','inovahr','grupoactitud']));
CREATE POLICY "Authenticated users can read tenant OKRs" ON public.okr_objectives
  FOR SELECT TO authenticated
  USING (tenant_id = ANY (ARRAY['inhr','inovahr','grupoactitud']));
CREATE POLICY "Authenticated users can update tenant OKRs" ON public.okr_objectives
  FOR UPDATE TO authenticated
  USING (tenant_id = ANY (ARRAY['inhr','inovahr','grupoactitud']))
  WITH CHECK (tenant_id = ANY (ARRAY['inhr','inovahr','grupoactitud']));

-- okr_initiatives
DROP POLICY IF EXISTS "Authenticated users can create tenant initiatives" ON public.okr_initiatives;
DROP POLICY IF EXISTS "Authenticated users can delete tenant initiatives" ON public.okr_initiatives;
DROP POLICY IF EXISTS "Authenticated users can read tenant initiatives" ON public.okr_initiatives;
DROP POLICY IF EXISTS "Authenticated users can update tenant initiatives" ON public.okr_initiatives;

CREATE POLICY "Authenticated users can create tenant initiatives" ON public.okr_initiatives
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = ANY (ARRAY['inhr','inovahr','grupoactitud']));
CREATE POLICY "Authenticated users can delete tenant initiatives" ON public.okr_initiatives
  FOR DELETE TO authenticated
  USING (tenant_id = ANY (ARRAY['inhr','inovahr','grupoactitud']));
CREATE POLICY "Authenticated users can read tenant initiatives" ON public.okr_initiatives
  FOR SELECT TO authenticated
  USING (tenant_id = ANY (ARRAY['inhr','inovahr','grupoactitud']));
CREATE POLICY "Authenticated users can update tenant initiatives" ON public.okr_initiatives
  FOR UPDATE TO authenticated
  USING (tenant_id = ANY (ARRAY['inhr','inovahr','grupoactitud']))
  WITH CHECK (tenant_id = ANY (ARRAY['inhr','inovahr','grupoactitud']));

-- team_members
DROP POLICY IF EXISTS "Authenticated users can create tenant team members" ON public.team_members;
DROP POLICY IF EXISTS "Authenticated users can delete tenant team members" ON public.team_members;
DROP POLICY IF EXISTS "Authenticated users can read tenant team members" ON public.team_members;
DROP POLICY IF EXISTS "Authenticated users can update tenant team members" ON public.team_members;

CREATE POLICY "Authenticated users can create tenant team members" ON public.team_members
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = ANY (ARRAY['inhr','inovahr','grupoactitud']));
CREATE POLICY "Authenticated users can delete tenant team members" ON public.team_members
  FOR DELETE TO authenticated
  USING (tenant_id = ANY (ARRAY['inhr','inovahr','grupoactitud']));
CREATE POLICY "Authenticated users can read tenant team members" ON public.team_members
  FOR SELECT TO authenticated
  USING (tenant_id = ANY (ARRAY['inhr','inovahr','grupoactitud']));
CREATE POLICY "Authenticated users can update tenant team members" ON public.team_members
  FOR UPDATE TO authenticated
  USING (tenant_id = ANY (ARRAY['inhr','inovahr','grupoactitud']))
  WITH CHECK (tenant_id = ANY (ARRAY['inhr','inovahr','grupoactitud']));

-- okr_checkins
DROP POLICY IF EXISTS "Admins can delete checkins" ON public.okr_checkins;
DROP POLICY IF EXISTS "Create own checkins" ON public.okr_checkins;
DROP POLICY IF EXISTS "Read checkins in tenant" ON public.okr_checkins;
DROP POLICY IF EXISTS "Update own checkins or admin" ON public.okr_checkins;

CREATE POLICY "Admins can delete checkins" ON public.okr_checkins
  FOR DELETE TO authenticated
  USING ((tenant_id = ANY (ARRAY['inhr','inovahr','grupoactitud'])) AND is_tenant_admin(tenant_id));
CREATE POLICY "Create own checkins" ON public.okr_checkins
  FOR INSERT TO authenticated
  WITH CHECK ((tenant_id = ANY (ARRAY['inhr','inovahr','grupoactitud'])) AND ((author_user_id = auth.uid()) OR (author_user_id IS NULL) OR is_tenant_admin(tenant_id)));
CREATE POLICY "Read checkins in tenant" ON public.okr_checkins
  FOR SELECT TO authenticated
  USING (tenant_id = ANY (ARRAY['inhr','inovahr','grupoactitud']));
CREATE POLICY "Update own checkins or admin" ON public.okr_checkins
  FOR UPDATE TO authenticated
  USING ((tenant_id = ANY (ARRAY['inhr','inovahr','grupoactitud'])) AND ((author_user_id = auth.uid()) OR is_tenant_admin(tenant_id)))
  WITH CHECK (tenant_id = ANY (ARRAY['inhr','inovahr','grupoactitud']));

-- okr_checkin_schedules
DROP POLICY IF EXISTS "Manage schedules in tenant" ON public.okr_checkin_schedules;
DROP POLICY IF EXISTS "Read schedules in tenant" ON public.okr_checkin_schedules;

CREATE POLICY "Manage schedules in tenant" ON public.okr_checkin_schedules
  FOR ALL TO authenticated
  USING (tenant_id = ANY (ARRAY['inhr','inovahr','grupoactitud']))
  WITH CHECK (tenant_id = ANY (ARRAY['inhr','inovahr','grupoactitud']));
CREATE POLICY "Read schedules in tenant" ON public.okr_checkin_schedules
  FOR SELECT TO authenticated
  USING (tenant_id = ANY (ARRAY['inhr','inovahr','grupoactitud']));

-- user_roles
DROP POLICY IF EXISTS "Users can view roles in their tenant" ON public.user_roles;
CREATE POLICY "Users can view roles in their tenant" ON public.user_roles
  FOR SELECT TO authenticated
  USING (tenant_id = ANY (ARRAY['inhr','inovahr','grupoactitud']));