ALTER TABLE public.okr_checkin_schedules
  ADD COLUMN IF NOT EXISTS kr_id TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_schedules_tenant_kr
  ON public.okr_checkin_schedules(tenant_id, kr_id);