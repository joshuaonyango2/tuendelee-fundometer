-- Update payment_type check constraint to allow 'immediate' payment type
-- Drop the old constraint
ALTER TABLE event_pledges DROP CONSTRAINT IF EXISTS event_pledges_payment_type_check;

-- Add new constraint with 'immediate', 'cash', and 'pledge' as valid values
ALTER TABLE event_pledges 
ADD CONSTRAINT event_pledges_payment_type_check 
CHECK (payment_type IN ('immediate', 'cash', 'pledge'));