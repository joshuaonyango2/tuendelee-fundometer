-- Create payment methods table for admin configuration
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('mpesa', 'paypal', 'bank_transfer', 'benevity')),
  account_details JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Policies for payment methods
CREATE POLICY "Anyone can view active payment methods" 
ON public.payment_methods 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Only admins can manage payment methods" 
ON public.payment_methods 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM admin_profiles WHERE user_id = auth.uid()
));

-- Update event_pledges to track payment confirmation
ALTER TABLE public.event_pledges 
ADD COLUMN payment_method TEXT,
ADD COLUMN payment_reference TEXT,
ADD COLUMN is_confirmed BOOLEAN DEFAULT false,
ADD COLUMN confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN donor_phone TEXT,
ADD COLUMN donor_address TEXT;

-- Create view for admin to see event participants
CREATE OR REPLACE VIEW event_participants AS
SELECT DISTINCT ON (es.attendee_name, es.event_id)
  es.event_id,
  es.attendee_name,
  es.joined_at,
  es.last_activity,
  COALESCE(pledge_summary.total_pledged, 0) as total_pledged,
  COALESCE(pledge_summary.pledge_count, 0) as pledge_count
FROM event_sessions es
LEFT JOIN (
  SELECT 
    event_id,
    name as attendee_name,
    SUM(amount_in_usd) as total_pledged,
    COUNT(*) as pledge_count
  FROM event_pledges
  GROUP BY event_id, name
) pledge_summary ON es.event_id = pledge_summary.event_id 
  AND es.attendee_name = pledge_summary.attendee_name
ORDER BY es.attendee_name, es.event_id, es.joined_at DESC;

-- Grant access to the view
GRANT SELECT ON event_participants TO authenticated;

-- Add trigger to update updated_at
CREATE TRIGGER update_payment_methods_updated_at
BEFORE UPDATE ON public.payment_methods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();