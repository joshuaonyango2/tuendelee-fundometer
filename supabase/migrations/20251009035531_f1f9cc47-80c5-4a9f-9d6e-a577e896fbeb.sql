-- Drop and recreate get_public_pledges to include is_confirmed field
-- This allows participants to see all pledges including admin-added ones
-- and properly calculate paid vs unpaid amounts in the thermometer

DROP FUNCTION IF EXISTS public.get_public_pledges(uuid);

CREATE FUNCTION public.get_public_pledges(p_event_id uuid)
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
  is_confirmed boolean,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Return anonymized pledge data for any valid event
  -- Removed is_active check so participants can see pledges even after event ends
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
    ep.is_confirmed,
    ep.created_at
  FROM public.event_pledges ep
  WHERE ep.event_id = p_event_id
  ORDER BY ep.created_at DESC;
END;
$$;