-- Remove the overly restrictive policy that blocks all direct access
DROP POLICY IF EXISTS "Deny direct public access to pledge data" ON public.event_pledges;

-- Ensure the admin policy is permissive (not restrictive)
DROP POLICY IF EXISTS "Only event admins can view full pledge details" ON public.event_pledges;

CREATE POLICY "Event admins can view full pledge details"
ON public.event_pledges
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.fundraising_events fe
    WHERE fe.id = event_pledges.event_id 
    AND fe.admin_id = auth.uid()
  )
);