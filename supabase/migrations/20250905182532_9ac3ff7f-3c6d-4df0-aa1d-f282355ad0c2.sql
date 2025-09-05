-- Drop the view and recreate as a function to avoid security definer view warning
DROP VIEW IF EXISTS public.public_event_pledges;

-- Create a function to get anonymized pledge data instead of a view
CREATE OR REPLACE FUNCTION public.get_public_pledges(p_event_id uuid)
RETURNS TABLE (
  id uuid,
  event_id uuid,
  display_name text,
  amount numeric,
  amount_in_usd numeric,
  amount_in_kes numeric,
  currency text,
  message text,
  payment_type text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if event is active
  IF NOT EXISTS (
    SELECT 1 FROM public.fundraising_events 
    WHERE id = p_event_id AND is_active = true
  ) THEN
    RETURN;
  END IF;

  -- Return anonymized pledge data
  RETURN QUERY
  SELECT 
    ep.id,
    ep.event_id,
    CASE 
      WHEN ep.name IS NOT NULL AND ep.name != '' THEN
        CONCAT(UPPER(LEFT(SPLIT_PART(ep.name, ' ', 1), 1)), '.', 
               CASE 
                 WHEN ARRAY_LENGTH(STRING_TO_ARRAY(ep.name, ' '), 1) > 1 
                 THEN CONCAT(' ', UPPER(LEFT(SPLIT_PART(ep.name, ' ', -1), 1)), '.')
                 ELSE ''
               END)
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
$$;

-- Grant execute permission to anon role
GRANT EXECUTE ON FUNCTION public.get_public_pledges(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_pledges(uuid) TO authenticated;