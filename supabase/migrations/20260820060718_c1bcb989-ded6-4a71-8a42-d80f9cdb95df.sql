CREATE TABLE public.impact_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  title_it TEXT,
  description_it TEXT,
  title_fr TEXT,
  description_fr TEXT,
  media_type TEXT NOT NULL DEFAULT 'youtube' CHECK (media_type IN ('youtube','video','audio','image')),
  media_url TEXT,
  image_url TEXT,
  audio_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.impact_stories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.impact_stories TO authenticated;
GRANT ALL ON public.impact_stories TO service_role;

ALTER TABLE public.impact_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active impact stories"
ON public.impact_stories FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Admins can view all impact stories"
ON public.impact_stories FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_profiles ap WHERE ap.user_id = auth.uid()));

CREATE POLICY "Admins can insert impact stories"
ON public.impact_stories FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_profiles ap WHERE ap.user_id = auth.uid()));

CREATE POLICY "Admins can update impact stories"
ON public.impact_stories FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_profiles ap WHERE ap.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_profiles ap WHERE ap.user_id = auth.uid()));

CREATE POLICY "Admins can delete impact stories"
ON public.impact_stories FOR DELETE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_profiles ap WHERE ap.user_id = auth.uid()));

CREATE TRIGGER update_impact_stories_updated_at
BEFORE UPDATE ON public.impact_stories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Anyone can read impact media"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'impact-media');

CREATE POLICY "Admins can upload impact media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'impact-media' AND EXISTS (SELECT 1 FROM public.admin_profiles ap WHERE ap.user_id = auth.uid()));

CREATE POLICY "Admins can update impact media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'impact-media' AND EXISTS (SELECT 1 FROM public.admin_profiles ap WHERE ap.user_id = auth.uid()));

CREATE POLICY "Admins can delete impact media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'impact-media' AND EXISTS (SELECT 1 FROM public.admin_profiles ap WHERE ap.user_id = auth.uid()));