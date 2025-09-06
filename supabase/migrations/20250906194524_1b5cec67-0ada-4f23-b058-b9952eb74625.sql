-- Fix security issue: Restrict access to event session tokens
-- Currently, the policies use "true" which allows anyone to access any session
-- We need to restrict access to only the session owner

-- Drop the existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can view their own session" ON public.event_sessions;
DROP POLICY IF EXISTS "Anyone can update their own session" ON public.event_sessions;

-- Create a new policy that only allows viewing your own session based on session_token
-- Since session tokens are unique and only known to the session owner, this ensures privacy
CREATE POLICY "Users can view only their own session" 
ON public.event_sessions 
FOR SELECT 
USING (
  -- Check if the session_token in the query matches the row's session_token
  -- This requires the client to provide the session_token to access the data
  EXISTS (
    SELECT 1 
    WHERE event_sessions.session_token = current_setting('request.headers', true)::json->>'x-session-token'
  )
  OR
  -- Allow event admins to view sessions for their events
  EXISTS (
    SELECT 1 
    FROM fundraising_events fe
    JOIN admin_profiles ap ON ap.user_id = auth.uid()
    WHERE fe.id = event_sessions.event_id 
    AND fe.admin_id = auth.uid()
  )
);

-- Create a policy for updating only your own session
CREATE POLICY "Users can update only their own session" 
ON public.event_sessions 
FOR UPDATE 
USING (
  -- Check if the session_token in the query matches the row's session_token
  EXISTS (
    SELECT 1 
    WHERE event_sessions.session_token = current_setting('request.headers', true)::json->>'x-session-token'
  )
);

-- Since we can't reliably use headers in RLS policies from the client,
-- let's use a different approach: filter by session_token in queries

-- Drop the previous policies
DROP POLICY IF EXISTS "Users can view only their own session" ON public.event_sessions;
DROP POLICY IF EXISTS "Users can update only their own session" ON public.event_sessions;

-- Create policies that require matching session_token in WHERE clause
CREATE POLICY "Users can view their own session by token" 
ON public.event_sessions 
FOR SELECT 
USING (
  -- This policy allows SELECT but the application must filter by session_token
  -- The policy itself just ensures RLS is active
  true
);

CREATE POLICY "Users can update their own session by token" 
ON public.event_sessions 
FOR UPDATE 
USING (
  -- This policy allows UPDATE but the application must filter by session_token
  true
);

-- Actually, let's do this properly by creating a secure function
-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Users can view their own session by token" ON public.event_sessions;
DROP POLICY IF EXISTS "Users can update their own session by token" ON public.event_sessions;

-- Create secure policies that actually restrict access
-- For SELECT: Only allow admins to directly query the table
CREATE POLICY "Only admins can view sessions directly" 
ON public.event_sessions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM fundraising_events fe
    JOIN admin_profiles ap ON ap.user_id = auth.uid()
    WHERE fe.id = event_sessions.event_id 
    AND fe.admin_id = auth.uid()
  )
);

-- For UPDATE: No one can update directly (must use functions)
-- Drop the update policy
DROP POLICY IF EXISTS "Users can update their own session by token" ON public.event_sessions;

-- Create a function to safely get session by token
CREATE OR REPLACE FUNCTION public.get_session_by_token(p_session_token text)
RETURNS TABLE(
  id uuid,
  event_id uuid,
  attendee_name text,
  session_token text,
  joined_at timestamp with time zone,
  last_activity timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Return the session only if the token matches
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

-- Create a function to safely update session activity
CREATE OR REPLACE FUNCTION public.update_session_activity(p_session_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the last_activity only if the token matches
  UPDATE public.event_sessions
  SET last_activity = now()
  WHERE session_token = p_session_token;
END;
$$;

-- Grant execute permissions to anon and authenticated
GRANT EXECUTE ON FUNCTION public.get_session_by_token(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_session_by_token(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_session_activity(text) TO anon;
GRANT EXECUTE ON FUNCTION public.update_session_activity(text) TO authenticated;

-- Add comment to document the security model
COMMENT ON TABLE public.event_sessions IS 'Contains event session data with tokens. Direct access restricted to admins only. Public access via get_session_by_token() function.';

-- Revoke any direct permissions that might have been granted
REVOKE SELECT ON public.event_sessions FROM anon;
REVOKE SELECT ON public.event_sessions FROM authenticated;
REVOKE UPDATE ON public.event_sessions FROM anon;
REVOKE UPDATE ON public.event_sessions FROM authenticated;