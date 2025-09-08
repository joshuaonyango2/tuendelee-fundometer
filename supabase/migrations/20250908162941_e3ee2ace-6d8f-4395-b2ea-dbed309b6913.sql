-- Delete existing admin user to allow fresh setup
DELETE FROM auth.users WHERE email = 'joshuaonyango372@gmail.com';

-- Also clean up any admin profiles if they exist
DELETE FROM public.admin_profiles WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'joshuaonyango372@gmail.com'
);