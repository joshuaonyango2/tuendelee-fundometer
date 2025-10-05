-- Allow admins to insert pledges for their events regardless of event active status
CREATE POLICY "Admins can create pledges for their events"
ON public.event_pledges
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.fundraising_events fe
    WHERE fe.id = event_pledges.event_id
      AND fe.admin_id = auth.uid()
  )
);