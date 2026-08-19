-- 1. View respects caller permissions
ALTER VIEW public.event_participants SET (security_invoker = on);

-- 2. Column-level restriction for anonymous visitors on fundraising_events
REVOKE SELECT ON public.fundraising_events FROM anon;
GRANT SELECT (id, title, description, scheduled_at, duration_minutes, goal_amount, share_link, is_active, status, created_at, updated_at) ON public.fundraising_events TO anon;

-- 3. Column-level restriction for anonymous visitors on event_meetings (hide host_url)
REVOKE SELECT ON public.event_meetings FROM anon;
GRANT SELECT (id, event_id, platform_id, meeting_id, meeting_url, join_url, passcode, start_time, duration_minutes, status, created_at, updated_at) ON public.event_meetings TO anon;

-- 4. Fix misleading no-op join in event_sessions select policy
DROP POLICY IF EXISTS "Only admins can view sessions directly" ON public.event_sessions;
CREATE POLICY "Only admins can view sessions directly"
ON public.event_sessions
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.fundraising_events fe
  WHERE fe.id = event_sessions.event_id
    AND fe.admin_id = auth.uid()
));

-- 5. Lock down SECURITY DEFINER functions not meant to be called from the API
REVOKE ALL ON FUNCTION public.handle_new_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_admin_pledges(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.update_pledge_by_admin(uuid, text, text, numeric, text, text, text, text, text, text, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_view_public_pledges(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.count_active_sessions(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_session_by_token(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_session_activity(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_pledges(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.find_my_pledges(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.confirm_pledge_payment(uuid, text, text, text, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_pledges(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_pledge_by_admin(uuid, text, text, numeric, text, text, text, text, text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_active_sessions(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_session_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_session_activity(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_pledges(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_my_pledges(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_pledge_payment(uuid, text, text, text, text, text) TO anon, authenticated;