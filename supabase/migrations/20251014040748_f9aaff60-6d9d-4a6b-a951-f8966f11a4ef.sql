-- Add pledge_duration_days column to event_pledges table
-- For pledges (not immediate payments), this stores the number of days until payment deadline
-- Maximum 30 days (1 month) as per requirements
ALTER TABLE event_pledges 
ADD COLUMN pledge_duration_days integer,
ADD COLUMN payment_deadline timestamp with time zone;

-- Add check constraint to ensure duration is between 1 and 30 days
ALTER TABLE event_pledges 
ADD CONSTRAINT check_pledge_duration_days 
CHECK (pledge_duration_days IS NULL OR (pledge_duration_days >= 1 AND pledge_duration_days <= 30));