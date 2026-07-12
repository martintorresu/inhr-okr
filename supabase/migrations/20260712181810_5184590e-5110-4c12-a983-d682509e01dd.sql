-- =========================================================================
-- 1. Harden demo (quimetal) tenant policies: read-only for anon/authenticated
--    Previously these granted ALL (insert/update/delete) to anon, allowing
--    unauthenticated tampering. Restrict to SELECT only.
-- =========================================================================

DROP POLICY IF EXISTS "Demo tenant OKRs are public" ON public.okr_objectives;
CREATE POLICY "Demo tenant OKRs are readable"
  ON public.okr_objectives FOR SELECT
  TO anon, authenticated
  USING (tenant_id = 'quimetal'::text);

DROP POLICY IF EXISTS "Demo tenant team members are public" ON public.team_members;
CREATE POLICY "Demo tenant team members are readable"
  ON public.team_members FOR SELECT
  TO anon, authenticated
  USING (tenant_id = 'quimetal'::text);

DROP POLICY IF EXISTS "Demo tenant initiatives are public" ON public.okr_initiatives;
CREATE POLICY "Demo tenant initiatives are readable"
  ON public.okr_initiatives FOR SELECT
  TO anon, authenticated
  USING (tenant_id = 'quimetal'::text);

DROP POLICY IF EXISTS "Demo tenant roles are public" ON public.user_roles;
CREATE POLICY "Demo tenant roles are readable"
  ON public.user_roles FOR SELECT
  TO anon, authenticated
  USING (tenant_id = 'quimetal'::text);

DROP POLICY IF EXISTS "Demo schedules public" ON public.okr_checkin_schedules;
CREATE POLICY "Demo schedules readable"
  ON public.okr_checkin_schedules FOR SELECT
  TO anon, authenticated
  USING (tenant_id = 'quimetal'::text);

DROP POLICY IF EXISTS "Demo checkins public" ON public.okr_checkins;
CREATE POLICY "Demo checkins readable"
  ON public.okr_checkins FOR SELECT
  TO anon, authenticated
  USING (tenant_id = 'quimetal'::text);

DROP POLICY IF EXISTS "Demo change log public" ON public.okr_change_log;
CREATE POLICY "Demo change log readable"
  ON public.okr_change_log FOR SELECT
  TO anon, authenticated
  USING (tenant_id = 'quimetal'::text);

-- =========================================================================
-- 2. Set a fixed search_path on the pgmq wrapper functions (were mutable).
--    Definitions preserved verbatim; only SET search_path added.
-- =========================================================================

CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$function$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer)
 RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create(dlq_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete(source_queue, message_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  RETURN new_id;
END;
$function$;

-- =========================================================================
-- 3. Revoke public EXECUTE on SECURITY DEFINER functions that should only be
--    invoked by the service role (edge functions), cron, or triggers.
--    is_tenant_admin stays executable by authenticated because RLS policies
--    and an authenticated rpc() call depend on it; it safely checks auth.uid().
-- =========================================================================

-- Internal queue/cron functions: service role only.
REVOKE ALL ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;

REVOKE ALL ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;

REVOKE ALL ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;

REVOKE ALL ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;

REVOKE ALL ON FUNCTION public.email_queue_dispatch() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.email_queue_dispatch() TO service_role;

REVOKE ALL ON FUNCTION public.generate_due_checkins() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_due_checkins() TO service_role;

-- Trigger-only functions: no direct callers need EXECUTE.
REVOKE ALL ON FUNCTION public.email_queue_wake() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_okr_objectives_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_profiles_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Unused authorization helper: remove public/anon/authenticated access.
REVOKE ALL ON FUNCTION public.has_role(uuid, text, app_role) FROM PUBLIC, anon, authenticated;

-- Authorization helper required by RLS + authenticated rpc: remove anon only.
REVOKE ALL ON FUNCTION public.is_tenant_admin(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_tenant_admin(text) TO authenticated;