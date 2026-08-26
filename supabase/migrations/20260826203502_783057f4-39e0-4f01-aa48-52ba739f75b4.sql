CREATE TABLE public.celebration_sounds (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  milestone integer NOT NULL UNIQUE CHECK (milestone IN (25, 50, 75, 100)),
  source_type text NOT NULL DEFAULT 'upload' CHECK (source_type IN ('upload', 'youtube')),
  audio_path text,
  youtube_url text,
  label text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.celebration_sounds TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.celebration_sounds TO authenticated;
GRANT ALL ON public.celebration_sounds TO service_role;

ALTER TABLE public.celebration_sounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active celebration sounds"
ON public.celebration_sounds FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Admins can view all celebration sounds"
ON public.celebration_sounds FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_profiles ap WHERE ap.user_id = auth.uid()));

CREATE POLICY "Admins can insert celebration sounds"
ON public.celebration_sounds FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_profiles ap WHERE ap.user_id = auth.uid()));

CREATE POLICY "Admins can update celebration sounds"
ON public.celebration_sounds FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_profiles ap WHERE ap.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_profiles ap WHERE ap.user_id = auth.uid()));

CREATE POLICY "Admins can delete celebration sounds"
ON public.celebration_sounds FOR DELETE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_profiles ap WHERE ap.user_id = auth.uid()));

CREATE TRIGGER update_celebration_sounds_updated_at
BEFORE UPDATE ON public.celebration_sounds
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();