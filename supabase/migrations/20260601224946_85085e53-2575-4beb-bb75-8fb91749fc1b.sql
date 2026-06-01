CREATE TABLE public.okr_change_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id text NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  entity_title text NOT NULL DEFAULT '',
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_user_id uuid,
  actor_name text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.okr_change_log TO authenticated;
GRANT ALL ON public.okr_change_log TO anon;
GRANT ALL ON public.okr_change_log TO service_role;

ALTER TABLE public.okr_change_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Demo change log public"
ON public.okr_change_log
FOR ALL
TO anon, authenticated
USING (tenant_id = 'quimetal'::text)
WITH CHECK (tenant_id = 'quimetal'::text);

CREATE POLICY "Read change log in tenant"
ON public.okr_change_log
FOR SELECT
TO authenticated
USING (tenant_id = ANY (ARRAY['inhr'::text, 'inovahr'::text, 'grupoactitud'::text]));

CREATE POLICY "Admins can insert change log"
ON public.okr_change_log
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = ANY (ARRAY['inhr'::text, 'inovahr'::text, 'grupoactitud'::text])
  AND is_tenant_admin(tenant_id)
);

CREATE INDEX idx_okr_change_log_tenant ON public.okr_change_log (tenant_id, created_at DESC);