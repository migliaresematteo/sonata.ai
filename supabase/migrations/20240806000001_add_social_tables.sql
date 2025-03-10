-- Create user_connections table to track connections between users
CREATE TABLE IF NOT EXISTS user_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  connected_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, connected_user_id)
);

-- Add social media links to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS discord_username TEXT,
  ADD COLUMN IF NOT EXISTS telegram_username TEXT,
  ADD COLUMN IF NOT EXISTS instagram_username TEXT,
  ADD COLUMN IF NOT EXISTS youtube_channel TEXT;

-- Enable row-level security
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own connections" ON user_connections;
CREATE POLICY "Users can view their own connections"
  ON user_connections FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = connected_user_id);

DROP POLICY IF EXISTS "Users can insert their own connections" ON user_connections;
CREATE POLICY "Users can insert their own connections"
  ON user_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own connections" ON user_connections;
CREATE POLICY "Users can update their own connections"
  ON user_connections FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = connected_user_id);

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE user_connections;
