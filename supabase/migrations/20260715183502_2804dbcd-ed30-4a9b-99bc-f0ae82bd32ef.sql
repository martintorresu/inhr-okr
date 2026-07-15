DROP POLICY IF EXISTS "Update own checkins or admin" ON public.okr_checkins;

CREATE POLICY "Update own checkins or admin"
ON public.okr_checkins
FOR UPDATE
TO authenticated
USING (
  tenant_id = ANY (ARRAY['inhr'::text, 'inovahr'::text, 'grupoactitud'::text])
  AND (
    author_user_id = auth.uid()
    OR public.is_tenant_admin(tenant_id)
    OR (
      author_user_id IS NULL
      AND EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.tenant_id = okr_checkins.tenant_id
          AND lower(coalesce(p.full_name, '')) = lower(okr_checkins.author_name)
      )
    )
    OR (
      author_user_id IS NULL
      AND EXISTS (
        SELECT 1
        FROM public.profiles p
        JOIN public.team_members tm
          ON tm.tenant_id = okr_checkins.tenant_id
         AND lower(coalesce(tm.email, '')) = lower(coalesce(p.email, ''))
        WHERE p.id = auth.uid()
          AND p.tenant_id = okr_checkins.tenant_id
          AND lower(tm.name) = lower(okr_checkins.author_name)
      )
    )
  )
)
WITH CHECK (
  tenant_id = ANY (ARRAY['inhr'::text, 'inovahr'::text, 'grupoactitud'::text])
  AND (
    author_user_id = auth.uid()
    OR public.is_tenant_admin(tenant_id)
    OR (
      author_user_id IS NULL
      AND EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.tenant_id = okr_checkins.tenant_id
          AND lower(coalesce(p.full_name, '')) = lower(okr_checkins.author_name)
      )
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.tenant_id = okr_checkins.tenant_id
        AND author_user_id = p.id
    )
  )
);