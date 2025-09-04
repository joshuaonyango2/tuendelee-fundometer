-- Create admin profiles table
CREATE TABLE public.admin_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fundraising events table
CREATE TABLE public.fundraising_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  goal_amount NUMERIC(10,2) NOT NULL DEFAULT 50000,
  passcode TEXT NOT NULL,
  share_link TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event pledges table
CREATE TABLE public.event_pledges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.fundraising_events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  amount_in_usd NUMERIC(10,2) NOT NULL,
  amount_in_kes NUMERIC(10,2) NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('cash', 'pledge')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event sessions table for tracking attendees
CREATE TABLE public.event_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.fundraising_events(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  attendee_name TEXT,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fundraising_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_pledges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_sessions ENABLE ROW LEVEL SECURITY;

-- Admin profiles policies
CREATE POLICY "Admins can view their own profile"
  ON public.admin_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update their own profile"
  ON public.admin_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Fundraising events policies
CREATE POLICY "Admins can manage their own events"
  ON public.fundraising_events FOR ALL
  USING (auth.uid() = admin_id);

CREATE POLICY "Public can view active events via share link"
  ON public.fundraising_events FOR SELECT
  USING (is_active = true);

-- Event pledges policies
CREATE POLICY "Anyone can create pledges for active events"
  ON public.event_pledges FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.fundraising_events
      WHERE id = event_id AND is_active = true
    )
  );

CREATE POLICY "Anyone can view pledges for active events"
  ON public.event_pledges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.fundraising_events
      WHERE id = event_id AND is_active = true
    )
  );

-- Event sessions policies
CREATE POLICY "Anyone can create sessions for active events"
  ON public.event_sessions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.fundraising_events
      WHERE id = event_id AND is_active = true
    )
  );

CREATE POLICY "Anyone can view their own session"
  ON public.event_sessions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update their own session"
  ON public.event_sessions FOR UPDATE
  USING (true);

-- Function to handle new admin user
CREATE OR REPLACE FUNCTION public.handle_new_admin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.admin_profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new admin creation
CREATE TRIGGER on_auth_admin_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_admin();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_admin_profiles_updated_at
  BEFORE UPDATE ON public.admin_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fundraising_events_updated_at
  BEFORE UPDATE ON public.fundraising_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for better performance
CREATE INDEX idx_events_share_link ON public.fundraising_events(share_link);
CREATE INDEX idx_events_status ON public.fundraising_events(status);
CREATE INDEX idx_events_admin ON public.fundraising_events(admin_id);
CREATE INDEX idx_pledges_event ON public.event_pledges(event_id);
CREATE INDEX idx_sessions_event ON public.event_sessions(event_id);
CREATE INDEX idx_sessions_token ON public.event_sessions(session_token);