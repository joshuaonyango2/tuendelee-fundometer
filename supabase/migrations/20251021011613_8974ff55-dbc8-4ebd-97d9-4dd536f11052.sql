-- Replace find_my_pledges with a SQL function to avoid ambiguous identifiers
DROP FUNCTION IF EXISTS public.find_my_pledges(uuid, text);

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
LANGUAGE sql
SECURITY DEFINER
SET search_path TO public
AS $$
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
    AND EXISTS (
      SELECT 1 FROM public.fundraising_events fe
      WHERE fe.id = p_event_id AND fe.is_active = true
    )
    AND (
      LOWER(ep.email) = LOWER(trim(p_search_term))
      OR LOWER(ep.name) = LOWER(trim(p_search_term))
      OR ep.donor_phone = trim(p_search_term)
    )
  ORDER BY ep.created_at DESC;
$$;