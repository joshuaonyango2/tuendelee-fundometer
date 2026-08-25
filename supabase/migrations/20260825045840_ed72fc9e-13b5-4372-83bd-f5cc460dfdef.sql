REVOKE ALL ON FUNCTION public.archive_event_fundraising(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.find_duplicate_payments(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.set_pledge_verification(uuid, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.handle_pledge_activity() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.can_view_public_pledges(uuid) FROM PUBLIC, anon, authenticated;

REVOKE ALL (host_url, passcode) ON TABLE public.event_meetings FROM anon;