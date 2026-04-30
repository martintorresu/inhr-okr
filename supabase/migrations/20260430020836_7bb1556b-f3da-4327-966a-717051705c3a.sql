CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_tenant_id text;
  v_team_role text;
  v_app_role app_role;
  v_valid_tenants text[] := ARRAY['inhr', 'inovahr', 'grupoactitud'];
BEGIN
  -- Read tenant_id from signup metadata, fallback to 'inovahr' if missing/invalid
  v_tenant_id := COALESCE(NEW.raw_user_meta_data->>'tenant_id', 'inovahr');
  IF NOT (v_tenant_id = ANY(v_valid_tenants)) THEN
    v_tenant_id := 'inovahr';
  END IF;

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