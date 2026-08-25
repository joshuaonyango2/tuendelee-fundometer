-- Split the pledge activity trigger: field defaults BEFORE, notifications AFTER insert/update

CREATE OR REPLACE FUNCTION public.handle_pledge_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_badges integer;
  v_dupe uuid;
  v_newly_confirmed boolean;
BEGIN
  v_newly_confirmed := coalesce(NEW.is_confirmed, false)
    AND (TG_OP = 'INSERT' OR coalesce(OLD.is_confirmed, false) = false);

  IF NEW.payment_reference IS NOT NULL AND btrim(NEW.payment_reference) <> '' THEN
    IF public.validate_payment_reference(NEW.payment_method, NEW.payment_reference) THEN
      IF NEW.verification_status = 'unverified' THEN
        NEW.verification_status := 'reference_ok';
      END IF;
    ELSE
      NEW.verification_status := 'reference_invalid';
    END IF;

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

  IF v_newly_confirmed AND NEW.badge_rank IS NULL THEN
    SELECT count(*) INTO v_badges
    FROM public.event_pledges ep
    WHERE ep.event_id = NEW.event_id AND ep.badge_rank IS NOT NULL;
    IF v_badges < 3 THEN
      NEW.badge_rank := v_badges + 1;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_admin_pledge_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_admin_id uuid;
  v_event_title text;
  v_newly_confirmed boolean;
BEGIN
  SELECT fe.admin_id, fe.title INTO v_admin_id, v_event_title
  FROM public.fundraising_events fe WHERE fe.id = NEW.event_id;

  IF v_admin_id IS NULL THEN
    RETURN NULL;
  END IF;

  v_newly_confirmed := coalesce(NEW.is_confirmed, false)
    AND (TG_OP = 'INSERT' OR coalesce(OLD.is_confirmed, false) = false);

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

  RETURN NULL;
END;
$function$;

REVOKE ALL ON FUNCTION public.notify_admin_pledge_activity() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS pledge_activity_notify_trigger ON public.event_pledges;
CREATE TRIGGER pledge_activity_notify_trigger
AFTER INSERT OR UPDATE ON public.event_pledges
FOR EACH ROW EXECUTE FUNCTION public.notify_admin_pledge_activity();