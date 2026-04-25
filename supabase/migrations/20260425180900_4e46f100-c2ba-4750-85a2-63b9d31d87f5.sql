CREATE TABLE public.okr_objectives (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  area TEXT NOT NULL,
  owner TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'area',
  parent_id TEXT,
  progress INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  contributors TEXT[] NOT NULL DEFAULT '{}',
  key_results JSONB NOT NULL DEFAULT '[]'::jsonb,
  quarter TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.okr_objectives ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_okr_objectives_tenant ON public.okr_objectives (tenant_id);
CREATE INDEX idx_okr_objectives_updated_at ON public.okr_objectives (updated_at DESC);

CREATE OR REPLACE FUNCTION public.update_okr_objectives_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_okr_objectives_updated_at
BEFORE UPDATE ON public.okr_objectives
FOR EACH ROW
EXECUTE FUNCTION public.update_okr_objectives_updated_at();

CREATE POLICY "Authenticated users can read tenant OKRs"
ON public.okr_objectives
FOR SELECT
TO authenticated
USING (tenant_id IN ('inhr', 'inovahr'));

CREATE POLICY "Authenticated users can create tenant OKRs"
ON public.okr_objectives
FOR INSERT
TO authenticated
WITH CHECK (tenant_id IN ('inhr', 'inovahr'));

CREATE POLICY "Authenticated users can update tenant OKRs"
ON public.okr_objectives
FOR UPDATE
TO authenticated
USING (tenant_id IN ('inhr', 'inovahr'))
WITH CHECK (tenant_id IN ('inhr', 'inovahr'));

CREATE POLICY "Authenticated users can delete tenant OKRs"
ON public.okr_objectives
FOR DELETE
TO authenticated
USING (tenant_id IN ('inhr', 'inovahr'));

CREATE POLICY "Demo tenant OKRs are public"
ON public.okr_objectives
FOR ALL
TO anon, authenticated
USING (tenant_id = 'quimetal')
WITH CHECK (tenant_id = 'quimetal');