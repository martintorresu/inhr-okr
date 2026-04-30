CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tenant_id text := 'inovahr';
  v_team_role text;
  v_app_role app_role;
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, tenant_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    v_tenant_id
  )
  ON CONFLICT (id) DO NOTHING;

  SELECT role INTO v_team_role
  FROM public.team_members
  WHERE tenant_id = v_tenant_id
    AND lower(email) = lower(NEW.email)
  LIMIT 1;

  v_app_role := CASE
    WHEN v_team_role = 'admin' THEN 'admin'::app_role
    ELSE 'member'::app_role
  END;

  INSERT INTO public.user_roles (user_id, tenant_id, role)
  VALUES (NEW.id, v_tenant_id, v_app_role)
  ON CONFLICT (user_id, tenant_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill founder as admin
INSERT INTO public.user_roles (user_id, tenant_id, role)
SELECT id, 'inovahr', 'admin'::app_role
FROM public.profiles
WHERE lower(email) = 'martin.torres.inovahr@gmail.com'
ON CONFLICT (user_id, tenant_id, role) DO NOTHING;

-- Backfill other existing users without any role in inovahr
INSERT INTO public.user_roles (user_id, tenant_id, role)
SELECT
  p.id,
  'inovahr',
  CASE WHEN tm.role = 'admin' THEN 'admin'::app_role ELSE 'member'::app_role END
FROM public.profiles p
LEFT JOIN public.team_members tm
  ON tm.tenant_id = 'inovahr' AND lower(tm.email) = lower(p.email)
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = p.id AND ur.tenant_id = 'inovahr'
)
ON CONFLICT (user_id, tenant_id, role) DO NOTHING;