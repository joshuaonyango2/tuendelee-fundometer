CREATE POLICY "Anyone can upload payment proofs"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'payment-proofs');

CREATE POLICY "Admins can read payment proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND EXISTS (SELECT 1 FROM public.admin_profiles ap WHERE ap.user_id = auth.uid())
);

CREATE POLICY "Admins can delete payment proofs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND EXISTS (SELECT 1 FROM public.admin_profiles ap WHERE ap.user_id = auth.uid())
);