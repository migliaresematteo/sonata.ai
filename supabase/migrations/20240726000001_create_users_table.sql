-- Create users table for foreign key references
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users policies
DROP POLICY IF EXISTS "Users can view own user" ON users;
CREATE POLICY "Users can view own user" ON users 
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own user" ON users;
CREATE POLICY "Users can update own user" ON users 
  FOR UPDATE USING (auth.uid() = id);

-- Create trigger to automatically create a user record when a new auth user is created
CREATE OR REPLACE FUNCTION create_user_from_auth()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS create_user_on_signup ON auth.users;

-- Create the trigger
CREATE TRIGGER create_user_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_user_from_auth();

-- Enable realtime for users table
alter publication supabase_realtime add table users;
