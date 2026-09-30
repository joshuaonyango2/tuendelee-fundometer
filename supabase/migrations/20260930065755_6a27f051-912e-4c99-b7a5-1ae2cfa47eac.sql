DELETE FROM public.mpesa_transactions WHERE pledge_id IN (SELECT id FROM public.event_pledges WHERE name = 'TEST IGNORE - system check');
DELETE FROM public.pledge_notifications WHERE pledge_id IN (SELECT id FROM public.event_pledges WHERE name = 'TEST IGNORE - system check');
DELETE FROM public.admin_notifications WHERE pledge_id IN (SELECT id FROM public.event_pledges WHERE name = 'TEST IGNORE - system check');
DELETE FROM public.event_pledges WHERE name = 'TEST IGNORE - system check';
DELETE FROM public.event_sessions WHERE attendee_name = 'TEST IGNORE - system check';
