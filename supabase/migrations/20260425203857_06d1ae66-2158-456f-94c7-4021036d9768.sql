-- ============================================
-- 1. Roles system
-- ============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'member');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  role public.app_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, tenant_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _tenant_id TEXT, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND tenant_id = _tenant_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_admin(_tenant_id TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND tenant_id = _tenant_id AND role = 'admin'
  )
$$;

CREATE POLICY "Users can view roles in their tenant"
ON public.user_roles FOR SELECT
TO authenticated
USING (tenant_id = ANY (ARRAY['inhr'::text, 'inovahr'::text]));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.is_tenant_admin(tenant_id))
WITH CHECK (public.is_tenant_admin(tenant_id));

CREATE POLICY "Demo tenant roles are public"
ON public.user_roles FOR ALL
TO anon, authenticated
USING (tenant_id = 'quimetal')
WITH CHECK (tenant_id = 'quimetal');

-- ============================================
-- 2. Check-in schedules (frequency config per OKR)
-- ============================================
CREATE TABLE public.okr_checkin_schedules (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  objective_id TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'biweekly' CHECK (frequency IN ('weekly','biweekly','monthly')),
  next_due_date DATE,
  last_generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, objective_id)
);

ALTER TABLE public.okr_checkin_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read schedules in tenant"
ON public.okr_checkin_schedules FOR SELECT
TO authenticated
USING (tenant_id = ANY (ARRAY['inhr'::text, 'inovahr'::text]));

CREATE POLICY "Manage schedules in tenant"
ON public.okr_checkin_schedules FOR ALL
TO authenticated
USING (tenant_id = ANY (ARRAY['inhr'::text, 'inovahr'::text]))
WITH CHECK (tenant_id = ANY (ARRAY['inhr'::text, 'inovahr'::text]));

CREATE POLICY "Demo schedules public"
ON public.okr_checkin_schedules FOR ALL
TO anon, authenticated
USING (tenant_id = 'quimetal')
WITH CHECK (tenant_id = 'quimetal');

-- ============================================
-- 3. Check-ins table
-- ============================================
CREATE TABLE public.okr_checkins (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  objective_id TEXT NOT NULL,
  kr_id TEXT,
  author_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','closed')),

  -- Progress (manual + auto)
  progress_manual INTEGER NOT NULL DEFAULT 0 CHECK (progress_manual BETWEEN 0 AND 100),
  progress_auto INTEGER NOT NULL DEFAULT 0 CHECK (progress_auto BETWEEN 0 AND 100),
  trend TEXT NOT NULL DEFAULT 'flat' CHECK (trend IN ('up','flat','down')),

  -- Scoring (0-1, Doerr style)
  score_manual NUMERIC(3,2) DEFAULT NULL CHECK (score_manual IS NULL OR (score_manual >= 0 AND score_manual <= 1)),
  score_auto NUMERIC(3,2) NOT NULL DEFAULT 0 CHECK (score_auto >= 0 AND score_auto <= 1),

  -- Confidence
  confidence TEXT NOT NULL DEFAULT 'green' CHECK (confidence IN ('green','yellow','red')),

  -- Structured fields (jsonb for flexibility)
  blockers JSONB NOT NULL DEFAULT '[]'::jsonb,        -- [{type, description}]
  next_commitments JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{title, due_date, completed}]
  initiative_snapshots JSONB NOT NULL DEFAULT '[]'::jsonb, -- snapshot of linked initiatives at checkin time
  insight TEXT NOT NULL DEFAULT '',
  leader_comment TEXT NOT NULL DEFAULT '',
  comment TEXT NOT NULL DEFAULT '',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_okr_checkins_tenant_objective ON public.okr_checkins(tenant_id, objective_id);
CREATE INDEX idx_okr_checkins_tenant_date ON public.okr_checkins(tenant_id, checkin_date DESC);
CREATE INDEX idx_okr_checkins_status ON public.okr_checkins(tenant_id, status);

ALTER TABLE public.okr_checkins ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at
CREATE TRIGGER update_okr_checkins_updated_at
BEFORE UPDATE ON public.okr_checkins
FOR EACH ROW
EXECUTE FUNCTION public.update_okr_objectives_updated_at();

CREATE TRIGGER update_okr_checkin_schedules_updated_at
BEFORE UPDATE ON public.okr_checkin_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_okr_objectives_updated_at();

-- RLS policies
CREATE POLICY "Read checkins in tenant"
ON public.okr_checkins FOR SELECT
TO authenticated
USING (tenant_id = ANY (ARRAY['inhr'::text, 'inovahr'::text]));

CREATE POLICY "Create own checkins"
ON public.okr_checkins FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = ANY (ARRAY['inhr'::text, 'inovahr'::text])
  AND (author_user_id = auth.uid() OR author_user_id IS NULL OR public.is_tenant_admin(tenant_id))
);

CREATE POLICY "Update own checkins or admin"
ON public.okr_checkins FOR UPDATE
TO authenticated
USING (
  tenant_id = ANY (ARRAY['inhr'::text, 'inovahr'::text])
  AND (author_user_id = auth.uid() OR public.is_tenant_admin(tenant_id))
)
WITH CHECK (
  tenant_id = ANY (ARRAY['inhr'::text, 'inovahr'::text])
);

CREATE POLICY "Admins can delete checkins"
ON public.okr_checkins FOR DELETE
TO authenticated
USING (
  tenant_id = ANY (ARRAY['inhr'::text, 'inovahr'::text])
  AND public.is_tenant_admin(tenant_id)
);

CREATE POLICY "Demo checkins public"
ON public.okr_checkins FOR ALL
TO anon, authenticated
USING (tenant_id = 'quimetal')
WITH CHECK (tenant_id = 'quimetal');