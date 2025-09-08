-- Create tables for meeting integrations
CREATE TABLE public.meeting_platforms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  icon_url TEXT,
  oauth_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default meeting platforms
INSERT INTO public.meeting_platforms (name, display_name, oauth_url) VALUES
  ('zoom', 'Zoom', 'https://zoom.us/oauth/authorize'),
  ('google_meet', 'Google Meet', 'https://accounts.google.com/o/oauth2/v2/auth'),
  ('teams', 'Microsoft Teams', 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'),
  ('webex', 'Cisco Webex', 'https://webexapis.com/v1/authorize');

-- Create table for admin meeting integrations
CREATE TABLE public.admin_meeting_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform_id UUID NOT NULL REFERENCES public.meeting_platforms(id),
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_connected BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(admin_id, platform_id)
);

-- Create table for event meetings
CREATE TABLE public.event_meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.fundraising_events(id) ON DELETE CASCADE,
  platform_id UUID NOT NULL REFERENCES public.meeting_platforms(id),
  meeting_id TEXT NOT NULL,
  meeting_url TEXT NOT NULL,
  join_url TEXT,
  passcode TEXT,
  host_url TEXT,
  start_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meeting_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_meeting_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_meetings ENABLE ROW LEVEL SECURITY;

-- Create policies for meeting_platforms (read-only for everyone)
CREATE POLICY "Everyone can view meeting platforms"
  ON public.meeting_platforms
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Create policies for admin_meeting_integrations
CREATE POLICY "Admins can view their own integrations"
  ON public.admin_meeting_integrations
  FOR SELECT
  TO authenticated
  USING (admin_id = auth.uid());

CREATE POLICY "Admins can insert their own integrations"
  ON public.admin_meeting_integrations
  FOR INSERT
  TO authenticated
  WITH CHECK (admin_id = auth.uid());

CREATE POLICY "Admins can update their own integrations"
  ON public.admin_meeting_integrations
  FOR UPDATE
  TO authenticated
  USING (admin_id = auth.uid());

CREATE POLICY "Admins can delete their own integrations"
  ON public.admin_meeting_integrations
  FOR DELETE
  TO authenticated
  USING (admin_id = auth.uid());

-- Create policies for event_meetings
CREATE POLICY "Event admins can view their event meetings"
  ON public.event_meetings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.fundraising_events
      WHERE fundraising_events.id = event_meetings.event_id
      AND fundraising_events.admin_id = auth.uid()
    )
  );

CREATE POLICY "Event admins can create meetings for their events"
  ON public.event_meetings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.fundraising_events
      WHERE fundraising_events.id = event_meetings.event_id
      AND fundraising_events.admin_id = auth.uid()
    )
  );

CREATE POLICY "Event admins can update their event meetings"
  ON public.event_meetings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.fundraising_events
      WHERE fundraising_events.id = event_meetings.event_id
      AND fundraising_events.admin_id = auth.uid()
    )
  );

CREATE POLICY "Event admins can delete their event meetings"
  ON public.event_meetings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.fundraising_events
      WHERE fundraising_events.id = event_meetings.event_id
      AND fundraising_events.admin_id = auth.uid()
    )
  );

-- Public users can view meeting info for active events
CREATE POLICY "Public can view meetings for active events"
  ON public.event_meetings
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.fundraising_events
      WHERE fundraising_events.id = event_meetings.event_id
      AND fundraising_events.is_active = true
    )
  );

-- Add triggers for updated_at
CREATE TRIGGER update_admin_meeting_integrations_updated_at
  BEFORE UPDATE ON public.admin_meeting_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_meetings_updated_at
  BEFORE UPDATE ON public.event_meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();