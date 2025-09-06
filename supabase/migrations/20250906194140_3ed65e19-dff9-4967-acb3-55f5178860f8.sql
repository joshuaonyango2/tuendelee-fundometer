-- Fix security issue: Prevent public access to donor personal information
-- The event_pledges table should only be directly accessible by admins
-- Public users should only see anonymized data through the get_public_pledges function

-- First, let's ensure RLS is enabled (it should already be)
ALTER TABLE public.event_pledges ENABLE ROW LEVEL SECURITY;

-- Add explicit policy to deny public SELECT access
-- This ensures that only authenticated admins can directly query the table
-- The existing "Admins can view all pledge details" policy already handles admin access
-- We need to explicitly deny all other SELECT access

-- Drop any potential conflicting policies first (if they exist)
DROP POLICY IF EXISTS "Public can view pledges" ON public.event_pledges;
DROP POLICY IF EXISTS "Anyone can view pledges" ON public.event_pledges;

-- The existing policies are:
-- 1. "Admins can view all pledge details" - SELECT (for admins only)
-- 2. "Anyone can create pledges for active events" - INSERT (for creating pledges)

-- Since PostgreSQL RLS works on a "deny by default" basis when RLS is enabled,
-- and we only have a SELECT policy for admins, public users are already blocked
-- from directly selecting from the table.

-- However, let's add an explicit comment and ensure the function is the only way
-- for public access to pledge data

-- Verify the get_public_pledges function has proper security
-- It should already be SECURITY DEFINER which allows it to bypass RLS
-- and return only anonymized data

-- Add a comment to document the security model
COMMENT ON TABLE public.event_pledges IS 'Contains sensitive donor information. Direct access restricted to admins only. Public access is provided through get_public_pledges() function which returns anonymized data.';

-- Ensure the function permissions are correct
-- Grant execute to anon and authenticated roles (if not already granted)
GRANT EXECUTE ON FUNCTION public.get_public_pledges(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_pledges(uuid) TO authenticated;

-- Revoke any direct SELECT permissions that might have been granted
REVOKE SELECT ON public.event_pledges FROM anon;
REVOKE SELECT ON public.event_pledges FROM authenticated;

-- Note: The admin check in the existing policy ensures only the event admin
-- can see full pledge details, not just any authenticated user