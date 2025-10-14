-- Set REPLICA IDENTITY to FULL for event_pledges table
-- This ensures all columns are included in realtime updates, enabling filtering
ALTER TABLE event_pledges REPLICA IDENTITY FULL;