-- Create a security definer function to allow admins to update pledges
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
SET search_path = 'public'
AS $function$
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
  IF p_currency = 'USD' THEN
    v_amount_usd := p_amount;
    v_amount_kes := p_amount * 128;
  ELSIF p_currency = 'KES' THEN
    v_amount_kes := p_amount;
    v_amount_usd := p_amount / 128;
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
$function$;