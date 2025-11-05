-- Add message templates and sender configuration to fundraising_events
ALTER TABLE fundraising_events
ADD COLUMN sender_email text,
ADD COLUMN sender_phone text,
ADD COLUMN template_pledge_created text DEFAULT 'Thank you for pledging ${amount} ${currency}! Your pledge ID is ${pledge_id}. Payment is due by ${deadline}.',
ADD COLUMN template_payment_confirmed text DEFAULT 'Thank you for your generous donation of ${amount} ${currency}! Your payment has been confirmed. Receipt: ${receipt_url}',
ADD COLUMN template_payment_reminder text DEFAULT 'Reminder: Your pledge of ${amount} ${currency} is due tomorrow (${deadline}). Please complete your payment. Pledge ID: ${pledge_id}';

-- Add phone number to event_pledges for notifications
ALTER TABLE event_pledges
ADD COLUMN country_code text DEFAULT '+254';

-- Create notifications tracking table
CREATE TABLE IF NOT EXISTS pledge_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pledge_id uuid NOT NULL REFERENCES event_pledges(id) ON DELETE CASCADE,
  notification_type text NOT NULL, -- 'pledge_created', 'payment_confirmed', 'payment_reminder'
  channel text NOT NULL, -- 'email', 'sms', 'whatsapp'
  recipient text NOT NULL,
  message text NOT NULL,
  sent_at timestamp with time zone DEFAULT now(),
  status text DEFAULT 'sent', -- 'sent', 'failed'
  error_message text
);

-- Enable RLS on notifications table
ALTER TABLE pledge_notifications ENABLE ROW LEVEL SECURITY;

-- Admin can view notifications for their events
CREATE POLICY "Admins can view notifications for their event pledges"
ON pledge_notifications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM event_pledges ep
    JOIN fundraising_events fe ON fe.id = ep.event_id
    WHERE ep.id = pledge_notifications.pledge_id
    AND fe.admin_id = auth.uid()
  )
);

-- Create index for efficient queries
CREATE INDEX idx_pledge_notifications_pledge_id ON pledge_notifications(pledge_id);
CREATE INDEX idx_pledge_notifications_sent_at ON pledge_notifications(sent_at);