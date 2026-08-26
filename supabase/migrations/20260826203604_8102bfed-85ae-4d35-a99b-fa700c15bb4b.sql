CREATE POLICY "Anyone can read celebration sounds"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'celebration-sounds');

CREATE POLICY "Admins can upload celebration sounds"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'celebration-sounds' AND EXISTS (SELECT 1 FROM public.admin_profiles ap WHERE ap.user_id = auth.uid()));

CREATE POLICY "Admins can update celebration sounds"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'celebration-sounds' AND EXISTS (SELECT 1 FROM public.admin_profiles ap WHERE ap.user_id = auth.uid()));

CREATE POLICY "Admins can delete celebration sounds"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'celebration-sounds' AND EXISTS (SELECT 1 FROM public.admin_profiles ap WHERE ap.user_id = auth.uid()));