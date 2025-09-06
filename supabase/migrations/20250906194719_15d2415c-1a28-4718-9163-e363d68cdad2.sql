-- Add a function to safely count active sessions for an event
-- This allows public users to see the participant count without accessing session details
CREATE OR REPLACE FUNCTION public.count_active_sessions(p_event_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_count integer;
BEGIN
  -- Only count sessions for active events
  IF NOT EXISTS (
    SELECT 1 FROM public.fundraising_events 
    WHERE id = p_event_id AND is_active = true
  ) THEN
    RETURN 0;
  END IF;

  -- Count sessions that were active in the last 30 minutes
  SELECT COUNT(*)
  INTO session_count
  FROM public.event_sessions
  WHERE event_id = p_event_id
    AND last_activity > (now() - interval '30 minutes');
  
  RETURN COALESCE(session_count, 0);
END;
$$;

-- Grant execute permission to public
GRANT EXECUTE ON FUNCTION public.count_active_sessions(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.count_active_sessions(uuid) TO authenticated;