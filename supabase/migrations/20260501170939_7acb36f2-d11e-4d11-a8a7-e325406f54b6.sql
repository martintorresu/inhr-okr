CREATE TABLE public.okr_kr_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kr_id text NOT NULL,
  user_id uuid NOT NULL,
  score numeric(3,2) NOT NULL,
  level text NOT NULL,
  blocked boolean NOT NULL,
  smart_specific int NOT NULL,
  smart_measurable int NOT NULL,
  smart_achievable int NOT NULL,
  smart_relevant int NOT NULL,
  smart_timebound int NOT NULL,
  ai_review jsonb NOT NULL,
  source text NOT NULL CHECK (source IN ('auto','manual')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_okr_kr_reviews_kr_id ON public.okr_kr_reviews (kr_id);
CREATE INDEX idx_okr_kr_reviews_user_id ON public.okr_kr_reviews (user_id);
CREATE INDEX idx_okr_kr_reviews_created_at ON public.okr_kr_reviews (created_at DESC);

ALTER TABLE public.okr_kr_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own kr reviews"
ON public.okr_kr_reviews
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own kr reviews"
ON public.okr_kr_reviews
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);