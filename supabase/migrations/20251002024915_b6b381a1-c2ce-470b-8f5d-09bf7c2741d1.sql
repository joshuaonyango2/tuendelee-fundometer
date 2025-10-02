-- Drop the view with SECURITY DEFINER
DROP VIEW IF EXISTS event_participants;

-- Recreate the view without SECURITY DEFINER
CREATE VIEW event_participants AS
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