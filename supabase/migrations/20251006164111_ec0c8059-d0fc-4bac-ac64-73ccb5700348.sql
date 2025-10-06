-- Fix the ambiguous column reference in get_public_pledges function
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
SET search_path TO 'public'
AS $$
BEGIN
  -- Security check: Only return data for active events
  IF NOT EXISTS (
    SELECT 1 FROM public.fundraising_events fe
    WHERE fe.id = p_event_id AND fe.is_active = true
  ) THEN
    -- Return empty result set for inactive events
    RETURN;
  END IF;

  -- Return anonymized pledge data
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
$$;

-- Enable realtime for event_pledges table
ALTER TABLE public.event_pledges REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_pledges;