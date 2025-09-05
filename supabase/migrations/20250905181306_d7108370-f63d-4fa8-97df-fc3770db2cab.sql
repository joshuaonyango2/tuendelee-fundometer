-- Create default admin user for Tuendelee Foundation
-- Email: admin@tuendeleefoundation.org
-- Default password: TuendeleeAdmin2025! (should be changed on first login)

-- First, check if admin already exists and insert if not
DO $$
BEGIN
  -- Create admin user if not exists
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@tuendeleefoundation.org'
  ) THEN
    -- Insert admin user with a secure default password
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role
    ) VALUES (
      gen_random_uuid(),
      'admin@tuendeleefoundation.org',
      crypt('TuendeleeAdmin2025!', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "Tuendelee Foundation Admin"}',
      false,
      'authenticated'
    );
  END IF;
END $$;