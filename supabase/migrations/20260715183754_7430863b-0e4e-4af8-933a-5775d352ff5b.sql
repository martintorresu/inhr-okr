ALTER TABLE public.okr_checkin_schedules
DROP CONSTRAINT IF EXISTS okr_checkin_schedules_tenant_id_objective_id_key;

DROP INDEX IF EXISTS okr_checkin_schedules_objective_unique_idx;
DROP INDEX IF EXISTS okr_checkin_schedules_kr_unique_idx;

CREATE UNIQUE INDEX okr_checkin_schedules_objective_unique_idx
ON public.okr_checkin_schedules (tenant_id, objective_id)
WHERE kr_id IS NULL;

CREATE UNIQUE INDEX okr_checkin_schedules_kr_unique_idx
ON public.okr_checkin_schedules (tenant_id, objective_id, kr_id)
WHERE kr_id IS NOT NULL;