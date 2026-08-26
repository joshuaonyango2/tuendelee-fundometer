ALTER TABLE public.event_pledges
  ADD COLUMN IF NOT EXISTS proof_path text,
  ADD COLUMN IF NOT EXISTS proof_uploaded_at timestamptz;

CREATE TABLE IF NOT EXISTS public.site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_key text NOT NULL,
  locale text NOT NULL DEFAULT 'en',
  value text NOT NULL DEFAULT '',
  is_hidden boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (content_key, locale)
);

GRANT SELECT ON public.site_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site content"
ON public.site_content FOR SELECT
USING (true);

CREATE POLICY "Admins can insert site content"
ON public.site_content FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_profiles ap WHERE ap.user_id = auth.uid()));

CREATE POLICY "Admins can update site content"
ON public.site_content FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_profiles ap WHERE ap.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_profiles ap WHERE ap.user_id = auth.uid()));

CREATE POLICY "Admins can delete site content"
ON public.site_content FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_profiles ap WHERE ap.user_id = auth.uid()));

CREATE TRIGGER update_site_content_updated_at
BEFORE UPDATE ON public.site_content
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.attach_payment_proof(
  p_pledge_id uuid,
  p_proof_path text,
  p_session_token text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF p_pledge_id IS NULL OR p_session_token IS NULL OR length(p_session_token) < 24 THEN
    RAISE EXCEPTION 'Invalid parameters';
  END IF;

  IF p_proof_path IS NULL OR btrim(p_proof_path) = '' OR length(p_proof_path) > 500 THEN
    RAISE EXCEPTION 'Invalid proof path';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.event_sessions es
    JOIN public.event_pledges ep ON ep.event_id = es.event_id
    WHERE ep.id = p_pledge_id
      AND es.session_token = p_session_token
      AND es.last_activity > now() - interval '2 hours'
  ) THEN
    RAISE EXCEPTION 'Invalid or expired session token';
  END IF;

  UPDATE public.event_pledges
  SET proof_path = btrim(p_proof_path),
      proof_uploaded_at = now()
  WHERE id = p_pledge_id;
END;
$$;

REVOKE ALL ON FUNCTION public.attach_payment_proof(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.attach_payment_proof(uuid, text, text) TO anon, authenticated, service_role;