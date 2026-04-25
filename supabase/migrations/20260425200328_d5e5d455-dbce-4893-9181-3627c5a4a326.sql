-- Tabla de miembros del equipo por tenant
CREATE TABLE public.team_members (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  role text NOT NULL DEFAULT 'viewer',
  area text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_team_members_tenant ON public.team_members(tenant_id);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Tenants reales (autenticados)
CREATE POLICY "Authenticated users can read tenant team members"
ON public.team_members FOR SELECT TO authenticated
USING (tenant_id = ANY (ARRAY['inhr'::text, 'inovahr'::text]));

CREATE POLICY "Authenticated users can create tenant team members"
ON public.team_members FOR INSERT TO authenticated
WITH CHECK (tenant_id = ANY (ARRAY['inhr'::text, 'inovahr'::text]));

CREATE POLICY "Authenticated users can update tenant team members"
ON public.team_members FOR UPDATE TO authenticated
USING (tenant_id = ANY (ARRAY['inhr'::text, 'inovahr'::text]))
WITH CHECK (tenant_id = ANY (ARRAY['inhr'::text, 'inovahr'::text]));

CREATE POLICY "Authenticated users can delete tenant team members"
ON public.team_members FOR DELETE TO authenticated
USING (tenant_id = ANY (ARRAY['inhr'::text, 'inovahr'::text]));

-- Tenant demo (público)
CREATE POLICY "Demo tenant team members are public"
ON public.team_members FOR ALL TO anon, authenticated
USING (tenant_id = 'quimetal'::text)
WITH CHECK (tenant_id = 'quimetal'::text);

-- Trigger updated_at
CREATE TRIGGER update_team_members_updated_at
BEFORE UPDATE ON public.team_members
FOR EACH ROW EXECUTE FUNCTION public.update_okr_objectives_updated_at();