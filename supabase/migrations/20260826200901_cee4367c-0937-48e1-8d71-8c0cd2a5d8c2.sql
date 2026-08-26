ALTER TABLE public.fundraising_events
  ADD COLUMN IF NOT EXISTS meeting_link text,
  ADD COLUMN IF NOT EXISTS meeting_passcode text,
  ADD COLUMN IF NOT EXISTS powerbi_sync_frequency text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS powerbi_last_sync_at timestamptz;

GRANT SELECT (meeting_link, meeting_passcode) ON public.fundraising_events TO anon;
GRANT SELECT (meeting_link, meeting_passcode) ON public.fundraising_events TO authenticated;

ALTER TABLE public.admin_profiles
  ADD COLUMN IF NOT EXISTS org_name text,
  ADD COLUMN IF NOT EXISTS org_email text;

CREATE OR REPLACE FUNCTION public.auto_verify_reconciled_pledges(p_event_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count integer;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.fundraising_events fe
    WHERE fe.id = p_event_id AND fe.admin_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized to verify pledges for this event';
  END IF;

  UPDATE public.event_pledges ep
  SET verification_status = 'verified',
      verified_at = now(),
      verified_by = auth.uid(),
      verification_note = coalesce(ep.verification_note, 'Auto-verified: matched to bank statement entry'),
      is_confirmed = true,
      confirmed_at = coalesce(ep.confirmed_at, now())
  FROM public.bank_statement_entries e
  WHERE e.event_id = p_event_id
    AND e.matched_pledge_id = ep.id
    AND e.match_status = 'matched'
    AND ep.is_archived = false
    AND coalesce(ep.verification_status, '') <> 'verified';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN coalesce(v_count, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.auto_verify_reconciled_pledges(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.auto_verify_reconciled_pledges(uuid) TO authenticated, service_role;