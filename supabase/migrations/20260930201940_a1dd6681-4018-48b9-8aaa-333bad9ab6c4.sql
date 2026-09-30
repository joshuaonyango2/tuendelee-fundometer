CREATE OR REPLACE FUNCTION public.claim_mpesa_payment(
  p_pledge_id uuid, p_code text, p_amount numeric, p_phone text, p_session_token text
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_event_id uuid;
  v_session_event uuid;
  v_code text;
BEGIN
  v_code := upper(trim(coalesce(p_code, '')));
  IF v_code !~ '^[A-Z0-9]{10}$' THEN
    RAISE EXCEPTION 'Invalid M-Pesa code. It must be 10 letters and numbers, e.g. QA12B3C4D5.';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Please enter the amount you paid.';
  END IF;
  SELECT event_id INTO v_event_id FROM public.event_pledges WHERE id = p_pledge_id;
  IF v_event_id IS NULL THEN RAISE EXCEPTION 'Pledge not found.'; END IF;
  SELECT event_id INTO v_session_event FROM public.event_sessions WHERE session_token = p_session_token;
  IF v_session_event IS NULL OR v_session_event <> v_event_id THEN
    RAISE EXCEPTION 'Session expired. Please rejoin the event and try again.';
  END IF;

  -- Block reuse on a different pledge only; same-pledge retries are allowed.
  IF EXISTS (
    SELECT 1 FROM public.mpesa_transactions
    WHERE upper(mpesa_receipt) = v_code AND pledge_id IS DISTINCT FROM p_pledge_id
  ) OR EXISTS (
    SELECT 1 FROM public.event_pledges
    WHERE upper(coalesce(payment_reference, '')) = v_code AND id <> p_pledge_id
  ) THEN
    RAISE EXCEPTION 'This M-Pesa code has already been recorded.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.mpesa_transactions
    WHERE upper(mpesa_receipt) = v_code AND pledge_id = p_pledge_id
  ) THEN
    UPDATE public.mpesa_transactions
    SET amount = p_amount, phone = coalesce(p_phone, phone), updated_at = now()
    WHERE upper(mpesa_receipt) = v_code AND pledge_id = p_pledge_id AND status <> 'success';
  ELSE
    INSERT INTO public.mpesa_transactions (event_id, pledge_id, source, phone, amount, currency, mpesa_receipt, status)
    VALUES (v_event_id, p_pledge_id, 'manual', p_phone, p_amount, 'KES', v_code, 'awaiting_verification');
  END IF;

  UPDATE public.event_pledges
  SET payment_method = 'mpesa', payment_reference = v_code,
      donor_phone = coalesce(p_phone, donor_phone), verification_status = 'pending'
  WHERE id = p_pledge_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.claim_mpesa_payment(uuid, text, numeric, text, text) TO anon, authenticated;