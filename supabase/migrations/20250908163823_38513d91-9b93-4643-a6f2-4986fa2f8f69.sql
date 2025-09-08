-- Enhanced security for event_pledges table to protect donor information
-- The table already has RLS enabled, but let's make the security model more explicit

-- First, let's review and enhance the existing RLS policies
-- Drop existing policies to recreate with better security
DROP POLICY IF EXISTS "Admins can view all pledge details" ON public.event_pledges;
DROP POLICY IF EXISTS "Anyone can create pledges for active events" ON public.event_pledges;

-- Create new, more explicit policies

-- 1. Only event admins can view full pledge details (including emails)
CREATE POLICY "Only event admins can view full pledge details" 
ON public.event_pledges 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.fundraising_events fe
    WHERE fe.id = event_pledges.event_id 
    AND fe.admin_id = auth.uid()
  )
);

-- 2. Anonymous users and authenticated users can create pledges for active events
-- But they cannot read back what they created (protecting donor privacy)
CREATE POLICY "Anyone can create pledges for active events" 
ON public.event_pledges 
FOR INSERT 
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.fundraising_events
    WHERE fundraising_events.id = event_pledges.event_id 
    AND fundraising_events.is_active = true
  )
);

-- 3. Explicitly deny direct SELECT access to anonymous users
-- This is redundant (no permissive policy means no access) but makes security explicit
CREATE POLICY "Deny direct public access to pledge data" 
ON public.event_pledges 
FOR SELECT 
TO anon
USING (false);

-- Update the get_public_pledges function to add extra security checks
-- and ensure it never returns email addresses
CREATE OR REPLACE FUNCTION public.get_public_pledges(p_event_id uuid)
RETURNS TABLE(
  id uuid,
  event_id uuid, 
  display_name text,
  amount numeric,
  amount_in_usd numeric,
  amount_in_kes numeric,
  currency text,
  message text,
  payment_type text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Security check: Only return data for active events
  IF NOT EXISTS (
    SELECT 1 FROM public.fundraising_events 
    WHERE id = p_event_id AND is_active = true
  ) THEN
    -- Return empty result set for inactive events
    RETURN;
  END IF;

  -- Return anonymized pledge data
  -- IMPORTANT: Never include email addresses or other PII
  RETURN QUERY
  SELECT 
    ep.id,
    ep.event_id,
    -- Anonymize donor names to initials only
    CASE 
      WHEN ep.name IS NOT NULL AND ep.name != '' THEN
        CONCAT(
          UPPER(LEFT(SPLIT_PART(ep.name, ' ', 1), 1)), '.', 
          CASE 
            WHEN ARRAY_LENGTH(STRING_TO_ARRAY(ep.name, ' '), 1) > 1 
            THEN CONCAT(' ', UPPER(LEFT(SPLIT_PART(ep.name, ' ', -1), 1)), '.')
            ELSE ''
          END
        )
      ELSE 'Anonymous'
    END::text AS display_name,
    ep.amount,
    ep.amount_in_usd,
    ep.amount_in_kes,
    ep.currency,
    ep.message,
    ep.payment_type,
    ep.created_at
  FROM public.event_pledges ep
  WHERE ep.event_id = p_event_id
  ORDER BY ep.created_at DESC;
END;
$function$;

-- Add a comment to document the security model
COMMENT ON TABLE public.event_pledges IS 'Contains donor pledge information. Access restricted: Only event admins can view full details. Public access is only through get_public_pledges() function which returns anonymized data without emails.';

COMMENT ON FUNCTION public.get_public_pledges IS 'Returns anonymized pledge data for active events only. Never exposes email addresses or full names to protect donor privacy.';