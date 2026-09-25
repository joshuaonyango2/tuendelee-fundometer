GRANT SELECT ON public.fundraising_events TO anon;
GRANT SELECT ON public.event_meetings TO anon;
GRANT SELECT ON public.event_pledges TO anon, authenticated;
GRANT SELECT, UPDATE ON public.event_sessions TO anon, authenticated;
GRANT INSERT ON public.event_sessions TO anon, authenticated;