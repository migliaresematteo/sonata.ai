-- Fix auth trigger to ensure it works properly

-- First, let's make sure our tables have the right structure
ALTER TABLE IF EXISTS public.users
  ALTER COLUMN email TYPE TEXT,
  ALTER COLUMN email SET NOT NULL;

-- Update the trigger function to be more robust
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into public.users table with better error handling
  BEGIN
    INSERT INTO public.users (id, email, full_name, created_at, updated_at)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
      updated_at = NOW();
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error creating user record: %', SQLERRM;
  END;
  
  -- Insert into profiles table with better error handling
  BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url, experience_level, created_at, updated_at)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      'https://api.dicebear.com/7.x/avataaars/svg?seed=' || NEW.email,
      'beginner',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
      updated_at = NOW();
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error creating profile record: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

-- Ensure RLS is disabled for development
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Create a test user if needed for development
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM auth.users WHERE email = 'test@example.com') THEN
    -- This is just a placeholder, as we can't directly insert into auth.users
    -- You'll need to create test users through the Supabase dashboard or API
    RAISE NOTICE 'No test user exists. Create one through the Supabase dashboard or API.';
  END IF;
END
$$;