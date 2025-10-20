-- Create function to find pledges by email, name, or phone
CREATE OR REPLACE FUNCTION public.find_my_pledges(
  p_event_id uuid,
  p_search_term text
)
RETURNS TABLE(
  id uuid,
  name text,
  amount numeric,
  currency text,
  payment_type text,
  is_confirmed boolean,
  created_at timestamp with time zone,
  payment_deadline timestamp with time zone,
  message text,
  payment_method text,
  payment_reference text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate inputs
  IF p_event_id IS NULL OR p_search_term IS NULL OR trim(p_search_term) = '' THEN
    RAISE EXCEPTION 'Invalid search parameters';
  END IF;

  -- Ensure event exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM public.fundraising_events
    WHERE id = p_event_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Event not found or inactive';
  END IF;

  -- Return pledges matching email, name, or phone (case insensitive)
  RETURN QUERY
  SELECT 
    ep.id,
    ep.name,
    ep.amount,
    ep.currency,
    ep.payment_type,
    ep.is_confirmed,
    ep.created_at,
    ep.payment_deadline,
    ep.message,
    ep.payment_method,
    ep.payment_reference
  FROM public.event_pledges ep
  WHERE ep.event_id = p_event_id
    AND (
      LOWER(ep.email) = LOWER(trim(p_search_term))
      OR LOWER(ep.name) = LOWER(trim(p_search_term))
      OR ep.donor_phone = trim(p_search_term)
    )
  ORDER BY ep.created_at DESC;
END;
$function$;