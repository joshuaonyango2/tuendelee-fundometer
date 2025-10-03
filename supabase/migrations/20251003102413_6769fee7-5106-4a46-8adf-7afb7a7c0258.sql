-- Implement RBAC and secure pledge confirmation RPC, plus function hardening

-- 1) Roles enum and user_roles table
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- 2) Role check function (security definer, fixed search_path)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- 3) Allow event admins to update pledges (keep general public updates disabled)
DROP POLICY IF EXISTS "Event admins can update pledges" ON public.event_pledges;
CREATE POLICY "Event admins can update pledges"
ON public.event_pledges
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.fundraising_events fe
    WHERE fe.id = event_pledges.event_id AND fe.admin_id = auth.uid()
  )
);

-- 4) Secure RPC for confirming pledge payments using session token binding
CREATE OR REPLACE FUNCTION public.confirm_pledge_payment(
  p_pledge_id uuid,
  p_payment_method text,
  p_payment_reference text,
  p_donor_phone text,
  p_donor_address text,
  p_session_token text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Basic input validation
  IF p_pledge_id IS NULL OR p_session_token IS NULL OR length(p_session_token) < 24 THEN
    RAISE EXCEPTION 'Invalid parameters';
  END IF;

  -- Ensure pledge belongs to an active event
  IF NOT EXISTS (
    SELECT 1
    FROM public.event_pledges ep
    JOIN public.fundraising_events fe ON fe.id = ep.event_id
    WHERE ep.id = p_pledge_id
      AND fe.is_active = true
  ) THEN
    RAISE EXCEPTION 'Pledge not found for active event';
  END IF;

  -- Ensure there is a recent valid session for the pledge's event and provided token
  IF NOT EXISTS (
    SELECT 1
    FROM public.event_sessions es
    JOIN public.event_pledges ep ON ep.event_id = es.event_id
    WHERE ep.id = p_pledge_id
      AND es.session_token = p_session_token
      AND es.last_activity > now() - interval '2 hours'
  ) THEN
    RAISE EXCEPTION 'Invalid or expired session token';
  END IF;

  -- Update limited set of fields and mark as confirmed if not already
  UPDATE public.event_pledges ep
  SET
    payment_method = p_payment_method,
    payment_reference = NULLIF(trim(p_payment_reference), ''),
    donor_phone = NULLIF(trim(p_donor_phone), ''),
    donor_address = NULLIF(trim(p_donor_address), ''),
    is_confirmed = true,
    confirmed_at = now()
  WHERE ep.id = p_pledge_id
    AND (ep.is_confirmed IS FALSE OR ep.is_confirmed IS NULL);
END;
$$;

-- 5) Harden existing SECURITY DEFINER functions with parameter checks
CREATE OR REPLACE FUNCTION public.get_session_by_token(p_session_token text)
RETURNS TABLE(id uuid, event_id uuid, attendee_name text, session_token text, joined_at timestamptz, last_activity timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_session_token IS NULL OR length(p_session_token) < 24 THEN
    RAISE EXCEPTION 'Invalid session token';
  END IF;

  RETURN QUERY
  SELECT 
    es.id,
    es.event_id,
    es.attendee_name,
    es.session_token,
    es.joined_at,
    es.last_activity
  FROM public.event_sessions es
  WHERE es.session_token = p_session_token
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_session_activity(p_session_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_session_token IS NULL OR length(p_session_token) < 24 THEN
    RAISE EXCEPTION 'Invalid session token';
  END IF;

  UPDATE public.event_sessions
  SET last_activity = now()
  WHERE session_token = p_session_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.count_active_sessions(p_event_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_count integer;
BEGIN
  IF p_event_id IS NULL THEN
    RETURN 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.fundraising_events 
    WHERE id = p_event_id AND is_active = true
  ) THEN
    RETURN 0;
  END IF;

  SELECT COUNT(*) INTO session_count
  FROM public.event_sessions
  WHERE event_id = p_event_id
    AND last_activity > (now() - interval '30 minutes');
  
  RETURN COALESCE(session_count, 0);
END;
$$;