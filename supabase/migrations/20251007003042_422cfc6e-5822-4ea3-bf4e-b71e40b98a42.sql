-- Create an admin-only RPC to fetch full pledge details for a specific event
-- This function runs with SECURITY DEFINER to bypass table RLS, but enforces authorization by checking
-- the caller (auth.uid()) is the admin of the event.

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
  created_at timestamp with time zone
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
    ep.created_at
  FROM public.event_pledges ep
  WHERE ep.event_id = p_event_id
  ORDER BY ep.created_at DESC;
END;
$$;

-- Optional: add a comment for documentation
COMMENT ON FUNCTION public.get_admin_pledges(uuid) IS 'Returns full pledge details for a given event if the caller is the event admin. Bypasses RLS via SECURITY DEFINER with explicit auth check.';