-- Drop and recreate get_admin_pledges function to include payment_deadline
DROP FUNCTION IF EXISTS public.get_admin_pledges(uuid);

CREATE OR REPLACE FUNCTION public.get_admin_pledges(p_event_id uuid)
RETURNS TABLE(
  id uuid,
  event_id uuid,
  name text,
  email text,
  amount numeric,
  amount_in_usd numeric,
  amount_in_kes numeric,
  currency text,
  payment_type text,
  payment_method text,
  payment_reference text,
  is_confirmed boolean,
  confirmed_at timestamp with time zone,
  donor_phone text,
  donor_address text,
  message text,
  created_at timestamp with time zone,
  payment_deadline timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Authorization: only event admin can fetch full pledge details
  IF NOT EXISTS (
    SELECT 1 FROM public.fundraising_events fe
    WHERE fe.id = p_event_id AND fe.admin_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized to view pledges for this event';
  END IF;

  RETURN QUERY
  SELECT 
    ep.id,
    ep.event_id,
    ep.name,
    ep.email,
    ep.amount,
    ep.amount_in_usd,
    ep.amount_in_kes,
    ep.currency,
    ep.payment_type,
    ep.payment_method,
    ep.payment_reference,
    ep.is_confirmed,
    ep.confirmed_at,
    ep.donor_phone,
    ep.donor_address,
    ep.message,
    ep.created_at,
    ep.payment_deadline
  FROM public.event_pledges ep
  WHERE ep.event_id = p_event_id
  ORDER BY ep.created_at DESC;
END;
$$;