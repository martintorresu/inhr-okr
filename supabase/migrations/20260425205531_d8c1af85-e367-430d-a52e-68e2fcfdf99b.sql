-- Extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Generator function: creates pending check-ins for OKRs whose schedule is due.
CREATE OR REPLACE FUNCTION public.generate_due_checkins()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s RECORD;
  obj RECORD;
  new_id text;
  created_count integer := 0;
  interval_days integer;
BEGIN
  FOR s IN
    SELECT *
    FROM public.okr_checkin_schedules
    WHERE next_due_date IS NULL OR next_due_date <= CURRENT_DATE
  LOOP
    SELECT * INTO obj FROM public.okr_objectives
      WHERE id = s.objective_id AND tenant_id = s.tenant_id;
    IF NOT FOUND THEN CONTINUE; END IF;

    interval_days := CASE s.frequency
      WHEN 'weekly' THEN 7
      WHEN 'monthly' THEN 30
      ELSE 14
    END;

    new_id := 'ci-auto-' || gen_random_uuid()::text;

    INSERT INTO public.okr_checkins (
      id, tenant_id, objective_id, kr_id, author_name, author_user_id,
      checkin_date, status, progress_auto, progress_manual,
      score_auto, score_manual, confidence, trend
    ) VALUES (
      new_id, s.tenant_id, s.objective_id, NULL, obj.owner, NULL,
      CURRENT_DATE, 'pending', COALESCE(obj.progress, 0), COALESCE(obj.progress, 0),
      LEAST(1, GREATEST(0, COALESCE(obj.progress, 0) / 100.0)), NULL, 'green', 'flat'
    );

    UPDATE public.okr_checkin_schedules
    SET last_generated_at = NOW(),
        next_due_date = CURRENT_DATE + interval_days,
        updated_at = NOW()
    WHERE id = s.id;

    created_count := created_count + 1;
  END LOOP;

  RETURN created_count;
END;
$$;

-- Daily cron at 06:00 UTC
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'okr-generate-checkins') THEN
    PERFORM cron.unschedule('okr-generate-checkins');
  END IF;
  PERFORM cron.schedule(
    'okr-generate-checkins',
    '0 6 * * *',
    $cron$ SELECT public.generate_due_checkins(); $cron$
  );
END $$;