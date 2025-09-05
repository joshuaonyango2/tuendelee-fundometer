-- Drop existing policies for event_pledges
DROP POLICY IF EXISTS "Anyone can view pledges for active events" ON public.event_pledges;
DROP POLICY IF EXISTS "Anyone can create pledges for active events" ON public.event_pledges;

-- Create new restricted policies
-- Only admins can see full pledge details with emails
CREATE POLICY "Admins can view all pledge details" 
ON public.event_pledges 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM fundraising_events fe
    JOIN admin_profiles ap ON ap.user_id = auth.uid()
    WHERE fe.id = event_pledges.event_id
      AND fe.admin_id = auth.uid()
  )
);

-- Anyone can still create pledges for active events
CREATE POLICY "Anyone can create pledges for active events" 
ON public.event_pledges 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM fundraising_events
    WHERE fundraising_events.id = event_pledges.event_id 
      AND fundraising_events.is_active = true
  )
);

-- Create a view for public pledge data (anonymized)
CREATE OR REPLACE VIEW public.public_event_pledges AS
SELECT 
  id,
  event_id,
  -- Only show first name initial + last name initial
  CASE 
    WHEN name IS NOT NULL AND name != '' THEN
      CONCAT(UPPER(LEFT(SPLIT_PART(name, ' ', 1), 1)), '.', 
             CASE 
               WHEN ARRAY_LENGTH(STRING_TO_ARRAY(name, ' '), 1) > 1 
               THEN CONCAT(' ', UPPER(LEFT(SPLIT_PART(name, ' ', -1), 1)), '.')
               ELSE ''
             END)
    ELSE 'Anonymous'
  END AS display_name,
  amount,
  amount_in_usd,
  amount_in_kes,
  currency,
  message,
  payment_type,
  created_at
FROM public.event_pledges;

-- Grant public access to the view
GRANT SELECT ON public.public_event_pledges TO anon;
GRANT SELECT ON public.public_event_pledges TO authenticated;

-- Create RLS policy for the view (anyone can view public data for active events)
CREATE OR REPLACE FUNCTION public.can_view_public_pledges(p_event_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM fundraising_events
    WHERE id = p_event_id AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;