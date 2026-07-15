GRANT EXECUTE ON FUNCTION public.is_tenant_admin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text, public.app_role) TO authenticated;