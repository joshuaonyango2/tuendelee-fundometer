-- 1. Pledge columns
ALTER TABLE public.event_pledges
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by uuid,
  ADD COLUMN IF NOT EXISTS verification_note text,
  ADD COLUMN IF NOT EXISTS possible_duplicate_of uuid,
  ADD COLUMN IF NOT EXISTS badge_rank integer,
  ADD COLUMN IF NOT EXISTS reminder_half_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_final_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS thank_you_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS receipt_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- 2. Event template for bulk thank-you
ALTER TABLE public.fundraising_events
  ADD COLUMN IF NOT EXISTS template_thank_you_all text DEFAULT 'Dear ${name}, thank you for standing with the Tuendelee Foundation. Your contribution of ${amount} ${currency} helps a bright Kenyan student stay in school. With gratitude, The Tuendelee Team.',
  ADD COLUMN IF NOT EXISTS thank_you_all_sent_at timestamptz;

-- 3. Admin notification feed
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  event_id uuid REFERENCES public.fundraising_events(id) ON DELETE CASCADE,
  pledge_id uuid REFERENCES public.event_pledges(id) ON DELETE SET NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  severity text NOT NULL DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.admin_notifications TO authenticated;
GRANT ALL ON public.admin_notifications TO service_role;

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view their notifications" ON public.admin_notifications;
CREATE POLICY "Admins can view their notifications"
  ON public.admin_notifications FOR SELECT TO authenticated
  USING (admin_id = auth.uid());

DROP POLICY IF EXISTS "Admins can mark their notifications read" ON public.admin_notifications;
CREATE POLICY "Admins can mark their notifications read"
  ON public.admin_notifications FOR UPDATE TO authenticated
  USING (admin_id = auth.uid())
  WITH CHECK (admin_id = auth.uid());

CREATE INDEX IF NOT EXISTS admin_notifications_admin_idx
  ON public.admin_notifications (admin_id, is_read, created_at DESC);

ALTER TABLE public.admin_notifications REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'admin_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;
  END IF;
END $$;

-- 4. Payment reference format validation
CREATE OR REPLACE FUNCTION public.validate_payment_reference(p_method text, p_reference text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_ref text := upper(regexp_replace(coalesce(p_reference, ''), '[\s\-]', '', 'g'));
  v_method text := lower(coalesce(p_method, ''));
BEGIN
  IF v_ref = '' THEN
    RETURN false;
  END IF;

  IF v_method LIKE 'mpesa%' THEN
    -- Safaricom receipt numbers: 10 chars, letters + digits
    RETURN v_ref ~ '^[A-Z0-9]{10}$' AND v_ref ~ '[A-Z]' AND v_ref ~ '[0-9]';
  ELSIF v_method LIKE 'paypal%' THEN
    -- PayPal transaction IDs: 17 alphanumeric chars
    RETURN v_ref ~ '^[A-Z0-9]{17}$';
  ELSIF v_method LIKE 'bank%' THEN
    RETURN length(v_ref) BETWEEN 6 AND 40 AND v_ref ~ '^[A-Z0-9/]+$';
  ELSIF v_method LIKE 'benevity%' THEN
    RETURN length(v_ref) BETWEEN 4 AND 60;
  END IF;

  RETURN length(v_ref) BETWEEN 4 AND 60;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_payment_reference(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_payment_reference(text, text) TO anon, authenticated, service_role;

-- 5. Trigger: admin notifications, badges, reference checks, duplicate flagging
CREATE OR REPLACE FUNCTION public.handle_pledge_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid;
  v_event_title text;
  v_badges integer;
  v_dupe uuid;
  v_newly_confirmed boolean;
BEGIN
  SELECT fe.admin_id, fe.title INTO v_admin_id, v_event_title
  FROM public.fundraising_events fe WHERE fe.id = NEW.event_id;

  v_newly_confirmed := coalesce(NEW.is_confirmed, false)
    AND (TG_OP = 'INSERT' OR coalesce(OLD.is_confirmed, false) = false);

  -- Reference genuineness check
  IF NEW.payment_reference IS NOT NULL AND btrim(NEW.payment_reference) <> '' THEN
    IF public.validate_payment_reference(NEW.payment_method, NEW.payment_reference) THEN
      IF NEW.verification_status = 'unverified' THEN
        NEW.verification_status := 'reference_ok';
      END IF;
    ELSE
      NEW.verification_status := 'reference_invalid';
    END IF;

    -- Same reference already used on this event => possible duplicate
    SELECT ep.id INTO v_dupe
    FROM public.event_pledges ep
    WHERE ep.event_id = NEW.event_id
      AND ep.id <> NEW.id
      AND upper(regexp_replace(coalesce(ep.payment_reference, ''), '[\s\-]', '', 'g'))
          = upper(regexp_replace(NEW.payment_reference, '[\s\-]', '', 'g'))
    LIMIT 1;

    IF v_dupe IS NOT NULL THEN
      NEW.possible_duplicate_of := v_dupe;
      NEW.verification_status := 'duplicate_suspect';
    END IF;
  END IF;

  -- Badge for the first three confirmed donors
  IF v_newly_confirmed AND NEW.badge_rank IS NULL THEN
    SELECT count(*) INTO v_badges
    FROM public.event_pledges ep
    WHERE ep.event_id = NEW.event_id AND ep.badge_rank IS NOT NULL;
    IF v_badges < 3 THEN
      NEW.badge_rank := v_badges + 1;
    END IF;
  END IF;

  IF v_admin_id IS NOT NULL THEN
    IF TG_OP = 'INSERT' THEN
      INSERT INTO public.admin_notifications (admin_id, event_id, pledge_id, type, title, body)
      VALUES (v_admin_id, NEW.event_id, NEW.id, 'pledge_created',
        'New pledge: ' || NEW.name,
        NEW.name || ' pledged ' || NEW.amount::text || ' ' || NEW.currency
          || ' on ' || coalesce(v_event_title, 'your event') || '.');
    END IF;

    IF v_newly_confirmed THEN
      INSERT INTO public.admin_notifications (admin_id, event_id, pledge_id, type, title, body)
      VALUES (v_admin_id, NEW.event_id, NEW.id, 'payment_confirmed',
        'Payment reported: ' || NEW.name,
        NEW.name || ' reported paying ' || NEW.amount::text || ' ' || NEW.currency
          || ' via ' || coalesce(NEW.payment_method, 'unknown method')
          || ' (ref ' || coalesce(NEW.payment_reference, 'none') || ').');
    END IF;

    IF NEW.verification_status = 'duplicate_suspect'
       AND (TG_OP = 'INSERT' OR coalesce(OLD.verification_status, '') <> 'duplicate_suspect') THEN
      INSERT INTO public.admin_notifications (admin_id, event_id, pledge_id, type, title, body, severity)
      VALUES (v_admin_id, NEW.event_id, NEW.id, 'duplicate_suspect',
        'Possible duplicate payment: ' || NEW.name,
        'The reference ' || coalesce(NEW.payment_reference, '') || ' was already used on this event.',
        'warning');
    ELSIF NEW.verification_status = 'reference_invalid'
       AND (TG_OP = 'INSERT' OR coalesce(OLD.verification_status, '') <> 'reference_invalid') THEN
      INSERT INTO public.admin_notifications (admin_id, event_id, pledge_id, type, title, body, severity)
      VALUES (v_admin_id, NEW.event_id, NEW.id, 'reference_invalid',
        'Reference needs review: ' || NEW.name,
        'The reference ' || coalesce(NEW.payment_reference, '')
          || ' does not match the expected format for ' || coalesce(NEW.payment_method, 'the chosen method') || '.',
        'warning');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pledge_activity_trigger ON public.event_pledges;
CREATE TRIGGER pledge_activity_trigger
  BEFORE INSERT OR UPDATE ON public.event_pledges
  FOR EACH ROW EXECUTE FUNCTION public.handle_pledge_activity();

-- 6. Admin verification action
CREATE OR REPLACE FUNCTION public.set_pledge_verification(p_pledge_id uuid, p_status text, p_note text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_status NOT IN ('unverified', 'reference_ok', 'reference_invalid', 'duplicate_suspect', 'verified', 'rejected') THEN
    RAISE EXCEPTION 'Invalid verification status';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.event_pledges ep
    JOIN public.fundraising_events fe ON fe.id = ep.event_id
    WHERE ep.id = p_pledge_id AND fe.admin_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized to verify this pledge';
  END IF;

  UPDATE public.event_pledges
  SET verification_status = p_status,
      verification_note = NULLIF(btrim(coalesce(p_note, '')), ''),
      verified_at = now(),
      verified_by = auth.uid(),
      is_confirmed = CASE WHEN p_status = 'verified' THEN true ELSE is_confirmed END,
      confirmed_at = CASE WHEN p_status = 'verified' AND confirmed_at IS NULL THEN now() ELSE confirmed_at END
  WHERE id = p_pledge_id;
END;
$$;

REVOKE ALL ON FUNCTION public.set_pledge_verification(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_pledge_verification(uuid, text, text) TO authenticated, service_role;

-- 7. Duplicate / multiple payment detection
CREATE OR REPLACE FUNCTION public.find_duplicate_payments(p_event_id uuid)
RETURNS TABLE(
  group_key text,
  pledge_id uuid,
  name text,
  email text,
  donor_phone text,
  amount numeric,
  currency text,
  payment_method text,
  payment_reference text,
  is_confirmed boolean,
  verification_status text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.fundraising_events fe
    WHERE fe.id = p_event_id AND fe.admin_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized to view this event';
  END IF;

  RETURN QUERY
  WITH base AS (
    SELECT ep.*,
      upper(regexp_replace(coalesce(ep.payment_reference, ''), '[\s\-]', '', 'g')) AS norm_ref,
      lower(btrim(coalesce(ep.email, ''))) AS norm_email
    FROM public.event_pledges ep
    WHERE ep.event_id = p_event_id AND ep.is_archived = false
  ),
  ref_groups AS (
    SELECT 'ref:' || norm_ref AS gk, id FROM base
    WHERE norm_ref <> ''
      AND norm_ref IN (SELECT norm_ref FROM base WHERE norm_ref <> '' GROUP BY norm_ref HAVING count(*) > 1)
  ),
  donor_groups AS (
    SELECT 'donor:' || norm_email || ':' || amount::text AS gk, id FROM base
    WHERE norm_email <> ''
      AND (norm_email, amount) IN (
        SELECT norm_email, amount FROM base WHERE norm_email <> ''
        GROUP BY norm_email, amount HAVING count(*) > 1
      )
  ),
  all_groups AS (
    SELECT * FROM ref_groups UNION SELECT * FROM donor_groups
  )
  SELECT g.gk, b.id, b.name, b.email, b.donor_phone, b.amount, b.currency,
         b.payment_method, b.payment_reference, b.is_confirmed, b.verification_status, b.created_at
  FROM all_groups g
  JOIN base b ON b.id = g.id
  ORDER BY g.gk, b.created_at;
END;
$$;

REVOKE ALL ON FUNCTION public.find_duplicate_payments(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_duplicate_payments(uuid) TO authenticated, service_role;

-- 8. Post-event cleanup (archive) initiated by the admin
CREATE OR REPLACE FUNCTION public.archive_event_fundraising(p_event_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.fundraising_events fe
    WHERE fe.id = p_event_id AND fe.admin_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized to clean up this event';
  END IF;

  UPDATE public.event_pledges
  SET is_archived = true, archived_at = now()
  WHERE event_id = p_event_id AND is_archived = false;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  UPDATE public.fundraising_events
  SET is_active = false, status = 'completed'
  WHERE id = p_event_id;

  INSERT INTO public.admin_notifications (admin_id, event_id, type, title, body)
  SELECT fe.admin_id, fe.id, 'cleanup',
    'Fundraising closed: ' || fe.title,
    v_count::text || ' pledge records archived and the event was marked completed.'
  FROM public.fundraising_events fe WHERE fe.id = p_event_id;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.archive_event_fundraising(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.archive_event_fundraising(uuid) TO authenticated, service_role;