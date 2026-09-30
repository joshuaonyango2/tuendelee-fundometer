CREATE TABLE public.mpesa_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.fundraising_events(id) ON DELETE CASCADE,
  pledge_id uuid REFERENCES public.event_pledges(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'stk',
  phone text,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'KES',
  merchant_request_id text,
  checkout_request_id text,
  mpesa_receipt text,
  status text NOT NULL DEFAULT 'pending',
  result_code integer,
  result_desc text,
  raw_callback jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX mpesa_transactions_receipt_key
  ON public.mpesa_transactions (upper(mpesa_receipt))
  WHERE mpesa_receipt IS NOT NULL;

CREATE UNIQUE INDEX mpesa_transactions_checkout_key
  ON public.mpesa_transactions (checkout_request_id)
  WHERE checkout_request_id IS NOT NULL;

CREATE INDEX mpesa_transactions_event_idx ON public.mpesa_transactions (event_id, created_at DESC);

GRANT SELECT ON public.mpesa_transactions TO authenticated;
GRANT ALL ON public.mpesa_transactions TO service_role;

ALTER TABLE public.mpesa_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event admins can view mpesa transactions"
ON public.mpesa_transactions
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.fundraising_events e
  WHERE e.id = mpesa_transactions.event_id AND e.admin_id = auth.uid()
));

CREATE TRIGGER update_mpesa_transactions_updated_at
BEFORE UPDATE ON public.mpesa_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.claim_mpesa_payment(
  p_pledge_id uuid,
  p_code text,
  p_amount numeric,
  p_phone text,
  p_session_token text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  IF v_event_id IS NULL THEN
    RAISE EXCEPTION 'Pledge not found.';
  END IF;

  SELECT event_id INTO v_session_event
  FROM public.event_sessions
  WHERE session_token = p_session_token;

  IF v_session_event IS NULL OR v_session_event <> v_event_id THEN
    RAISE EXCEPTION 'Session expired. Please rejoin the event and try again.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.mpesa_transactions WHERE upper(mpesa_receipt) = v_code
  ) OR EXISTS (
    SELECT 1 FROM public.event_pledges
    WHERE upper(coalesce(payment_reference, '')) = v_code AND id <> p_pledge_id
  ) THEN
    RAISE EXCEPTION 'This M-Pesa code has already been recorded.';
  END IF;

  INSERT INTO public.mpesa_transactions (
    event_id, pledge_id, source, phone, amount, currency, mpesa_receipt, status
  ) VALUES (
    v_event_id, p_pledge_id, 'manual', p_phone, p_amount, 'KES', v_code, 'awaiting_verification'
  );

  UPDATE public.event_pledges
  SET payment_method = 'mpesa',
      payment_reference = v_code,
      donor_phone = coalesce(p_phone, donor_phone),
      verification_status = 'pending'
  WHERE id = p_pledge_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_mpesa_payment(uuid, text, numeric, text, text) TO anon, authenticated;
