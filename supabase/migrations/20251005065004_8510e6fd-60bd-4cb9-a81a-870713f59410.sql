-- Fix RLS policy to allow admins to update pledges for their events
-- The current policy checks for admin_id on fundraising_events, but we need to ensure it works properly

-- Drop the existing update policy
DROP POLICY IF EXISTS "Event admins can update pledges" ON public.event_pledges;

-- Recreate with proper admin check
CREATE POLICY "Event admins can update pledges"
ON public.event_pledges
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.fundraising_events fe
    WHERE fe.id = event_pledges.event_id 
    AND fe.admin_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.fundraising_events fe
    WHERE fe.id = event_pledges.event_id 
    AND fe.admin_id = auth.uid()
  )
);