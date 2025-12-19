-- Trigger function to auto-create member record when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if member already exists
  IF NOT EXISTS (SELECT 1 FROM members WHERE email = NEW.email) THEN
    -- Auto-create member record with 'member' class
    -- Custodian should be created manually or via migration
    INSERT INTO members (email, name, member_class)
    VALUES (
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
      CASE 
        WHEN NEW.email = 'custodian@inquiry.institute' THEN 'custodian'
        ELSE 'member'
      END
    )
    ON CONFLICT (email) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users (if we have access)
-- Note: This might need to be set up via Supabase Dashboard > Database > Triggers
-- Or via Supabase CLI if you have the right permissions

-- Alternative: Create a function that can be called from the frontend
CREATE OR REPLACE FUNCTION ensure_member_exists()
RETURNS VOID AS $$
DECLARE
  user_email TEXT;
BEGIN
  user_email := auth.jwt() ->> 'email';
  
  IF user_email IS NOT NULL THEN
    INSERT INTO members (email, name, member_class)
    VALUES (
      user_email,
      COALESCE(auth.jwt() ->> 'name', user_email),
      CASE 
        WHEN user_email = 'custodian@inquiry.institute' THEN 'custodian'
        ELSE 'member'
      END
    )
    ON CONFLICT (email) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION ensure_member_exists() TO authenticated;
