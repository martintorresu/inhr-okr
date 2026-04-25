-- Tabla de iniciativas vinculadas a Key Results
CREATE TABLE public.okr_initiatives (
  id TEXT NOT NULL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  kr_id TEXT NOT NULL,
  objective_id TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  responsible TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  progress INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_progress',
  tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_okr_initiatives_tenant ON public.okr_initiatives(tenant_id);
CREATE INDEX idx_okr_initiatives_kr ON public.okr_initiatives(kr_id);
CREATE INDEX idx_okr_initiatives_end_date ON public.okr_initiatives(end_date);

ALTER TABLE public.okr_initiatives ENABLE ROW LEVEL SECURITY;

-- Tenants con auth real (inhr / inovahr): solo usuarios autenticados del tenant
CREATE POLICY "Authenticated users can read tenant initiatives"
ON public.okr_initiatives FOR SELECT
TO authenticated
USING (tenant_id = ANY (ARRAY['inhr'::text, 'inovahr'::text]));

CREATE POLICY "Authenticated users can create tenant initiatives"
ON public.okr_initiatives FOR INSERT
TO authenticated
WITH CHECK (tenant_id = ANY (ARRAY['inhr'::text, 'inovahr'::text]));

CREATE POLICY "Authenticated users can update tenant initiatives"
ON public.okr_initiatives FOR UPDATE
TO authenticated
USING (tenant_id = ANY (ARRAY['inhr'::text, 'inovahr'::text]))
WITH CHECK (tenant_id = ANY (ARRAY['inhr'::text, 'inovahr'::text]));

CREATE POLICY "Authenticated users can delete tenant initiatives"
ON public.okr_initiatives FOR DELETE
TO authenticated
USING (tenant_id = ANY (ARRAY['inhr'::text, 'inovahr'::text]));

-- Tenant demo (quimetal): acceso público, igual que okr_objectives
CREATE POLICY "Demo tenant initiatives are public"
ON public.okr_initiatives FOR ALL
TO anon, authenticated
USING (tenant_id = 'quimetal'::text)
WITH CHECK (tenant_id = 'quimetal'::text);

-- Trigger updated_at (reutiliza función existente)
CREATE TRIGGER update_okr_initiatives_updated_at
BEFORE UPDATE ON public.okr_initiatives
FOR EACH ROW
EXECUTE FUNCTION public.update_okr_objectives_updated_at();