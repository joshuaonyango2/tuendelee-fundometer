-- Update the pledge admin update function to use new exchange rates
-- 1 USD = 127 KES, 1 EUR = 147 KES, 1 GBP = 170 KES

CREATE OR REPLACE FUNCTION public.update_pledge_by_admin(
  p_pledge_id uuid, 
  p_name text, 
  p_email text, 
  p_amount numeric, 
  p_currency text, 
  p_payment_method text, 
  p_payment_reference text, 
  p_donor_phone text, 
  p_donor_address text, 
  p_message text, 
  p_is_confirmed boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_event_id uuid;
  v_amount_usd numeric;
  v_amount_kes numeric;
BEGIN
  -- Get the event_id and verify admin owns this event
  SELECT ep.event_id INTO v_event_id
  FROM public.event_pledges ep
  JOIN public.fundraising_events fe ON fe.id = ep.event_id
  WHERE ep.id = p_pledge_id AND fe.admin_id = auth.uid();

  IF v_event_id IS NULL THEN
    RAISE EXCEPTION 'Not authorized to update this pledge';
  END IF;

  -- Calculate USD and KES amounts based on currency
  -- Exchange rates: 1 USD = 127 KES, 1 EUR = 147 KES, 1 GBP = 170 KES
  IF p_currency = 'USD' THEN
    v_amount_usd := p_amount;
    v_amount_kes := p_amount * 127;
  ELSIF p_currency = 'KES' THEN
    v_amount_kes := p_amount;
    v_amount_usd := p_amount / 127;
  ELSIF p_currency = 'EUR' THEN
    v_amount_usd := p_amount * (147.0 / 127.0);
    v_amount_kes := p_amount * 147;
  ELSIF p_currency = 'GBP' THEN
    v_amount_usd := p_amount * (170.0 / 127.0);
    v_amount_kes := p_amount * 170;
  ELSE
    RAISE EXCEPTION 'Invalid currency';
  END IF;

  -- Update the pledge
  UPDATE public.event_pledges
  SET
    name = p_name,
    email = NULLIF(trim(p_email), ''),
    amount = p_amount,
    amount_in_usd = v_amount_usd,
    amount_in_kes = v_amount_kes,
    currency = p_currency,
    payment_method = NULLIF(trim(p_payment_method), ''),
    payment_reference = NULLIF(trim(p_payment_reference), ''),
    donor_phone = NULLIF(trim(p_donor_phone), ''),
    donor_address = NULLIF(trim(p_donor_address), ''),
    message = NULLIF(trim(p_message), ''),
    is_confirmed = p_is_confirmed,
    confirmed_at = CASE 
      WHEN p_is_confirmed = true AND is_confirmed = false THEN now()
      WHEN p_is_confirmed = false THEN NULL
      ELSE confirmed_at
    END
  WHERE id = p_pledge_id;
END;
$$;