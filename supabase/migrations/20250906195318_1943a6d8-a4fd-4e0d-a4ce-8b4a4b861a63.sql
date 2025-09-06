-- Clean up any existing admin account to allow fresh setup
-- First, let's check and delete any existing admin profiles
DELETE FROM public.admin_profiles 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email = 'admin@tuendeleefoundation.org'
);

-- Now delete the user from auth.users
-- Note: This requires a function since we can't directly delete from auth.users
CREATE OR REPLACE FUNCTION public.delete_admin_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete the admin user if it exists
  DELETE FROM auth.users 
  WHERE email = 'admin@tuendeleefoundation.org';
END;
$$;

-- Execute the function
SELECT public.delete_admin_user();

-- Drop the function as it's no longer needed
DROP FUNCTION public.delete_admin_user();