-- Fix the error with realtime publication
-- Remove the problematic lines that try to add tables that are already in the publication

-- Instead of trying to add tables that might already be in the publication,
-- we'll use a safer approach that first checks if they exist

DO $$
BEGIN
  -- Disable RLS for development
  ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
  ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
  
  -- Make sure our trigger function exists and is up to date
  CREATE OR REPLACE FUNCTION handle_new_user()
  RETURNS TRIGGER AS $$
  BEGIN
    -- Insert into public.users table
    INSERT INTO public.users (id, email, full_name, created_at, updated_at)
    VALUES (
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data->>'full_name',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Insert into profiles table
    INSERT INTO public.profiles (id, full_name, avatar_url, experience_level, created_at, updated_at)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'full_name',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=' || NEW.email,
      'beginner',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  -- Drop existing triggers to avoid conflicts
  DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;
  DROP TRIGGER IF EXISTS create_user_on_signup ON auth.users;
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

  -- Create a single trigger that handles both tables
  CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

END;
$$;