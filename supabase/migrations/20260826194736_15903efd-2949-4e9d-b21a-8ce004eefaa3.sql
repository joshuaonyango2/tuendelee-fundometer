CREATE OR REPLACE FUNCTION public.get_pledge_evidence(p_event_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  email text,
  donor_phone text,
  amount numeric,
  currency text,
  amount_in_usd numeric,
  payment_method text,
  payment_reference text,
  reference_valid boolean,
  is_confirmed boolean,
  confirmed_at timestamp with time zone,
  verification_status text,
  verification_note text,
  verified_at timestamp with time zone,
  possible_duplicate_of uuid,
  proof_path text,
  proof_uploaded_at timestamp with time zone,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.fundraising_events fe
    WHERE fe.id = p_event_id AND fe.admin_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized to view evidence for this event';
  END IF;

  RETURN QUERY
  SELECT
    ep.id,
    ep.name,
    ep.email,
    ep.donor_phone,
    ep.amount,
    ep.currency,
    ep.amount_in_usd,
    ep.payment_method,
    ep.payment_reference,
    public.validate_payment_reference(ep.payment_method, ep.payment_reference) AS reference_valid,
    ep.is_confirmed,
    ep.confirmed_at,
    ep.verification_status,
    ep.verification_note,
    ep.verified_at,
    ep.possible_duplicate_of,
    ep.proof_path,
    ep.proof_uploaded_at,
    ep.created_at
  FROM public.event_pledges ep
  WHERE ep.event_id = p_event_id
    AND ep.is_archived = false
  ORDER BY ep.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_pledge_evidence(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_pledge_evidence(uuid) TO authenticated, service_role;