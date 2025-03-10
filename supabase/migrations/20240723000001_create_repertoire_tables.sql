-- Create pieces table
CREATE TABLE IF NOT EXISTS pieces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  composer TEXT NOT NULL,
  period TEXT,
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 10),
  instrument TEXT NOT NULL,
  genre TEXT,
  description TEXT,
  average_duration INTEGER, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_pieces table to track user's repertoire
CREATE TABLE IF NOT EXISTS user_pieces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  piece_id UUID REFERENCES pieces(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('current', 'mastered', 'wishlist')),
  progress INTEGER CHECK (progress BETWEEN 0 AND 100),
  notes TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  mastered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, piece_id)
);

-- Create practice_sessions table
CREATE TABLE IF NOT EXISTS practice_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  piece_id UUID REFERENCES pieces(id) ON DELETE CASCADE,
  duration INTEGER NOT NULL, -- in seconds
  notes TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  category TEXT,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Create challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  goal INTEGER NOT NULL,
  goal_type TEXT NOT NULL, -- e.g., 'minutes', 'days', 'pieces'
  duration INTEGER, -- in days
  achievement_id UUID REFERENCES achievements(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE
);

-- Create user_challenges table
CREATE TABLE IF NOT EXISTS user_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, challenge_id)
);

-- Create practice_streaks table
CREATE TABLE IF NOT EXISTS practice_streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_practice_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create user_events table
CREATE TABLE IF NOT EXISTS user_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- Add RLS policies
ALTER TABLE pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

-- Pieces policies
DROP POLICY IF EXISTS "Pieces are viewable by everyone" ON pieces;
CREATE POLICY "Pieces are viewable by everyone" ON pieces FOR SELECT USING (true);

-- User pieces policies
DROP POLICY IF EXISTS "Users can view own pieces" ON user_pieces;
CREATE POLICY "Users can view own pieces" ON user_pieces FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own pieces" ON user_pieces;
CREATE POLICY "Users can insert own pieces" ON user_pieces FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own pieces" ON user_pieces;
CREATE POLICY "Users can update own pieces" ON user_pieces FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own pieces" ON user_pieces;
CREATE POLICY "Users can delete own pieces" ON user_pieces FOR DELETE USING (auth.uid() = user_id);

-- Practice sessions policies
DROP POLICY IF EXISTS "Users can view own practice sessions" ON practice_sessions;
CREATE POLICY "Users can view own practice sessions" ON practice_sessions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own practice sessions" ON practice_sessions;
CREATE POLICY "Users can insert own practice sessions" ON practice_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own practice sessions" ON practice_sessions;
CREATE POLICY "Users can update own practice sessions" ON practice_sessions FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own practice sessions" ON practice_sessions;
CREATE POLICY "Users can delete own practice sessions" ON practice_sessions FOR DELETE USING (auth.uid() = user_id);

-- Achievements policies
DROP POLICY IF EXISTS "Achievements are viewable by everyone" ON achievements;
CREATE POLICY "Achievements are viewable by everyone" ON achievements FOR SELECT USING (true);

-- User achievements policies
DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
CREATE POLICY "Users can view own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);

-- Challenges policies
DROP POLICY IF EXISTS "Challenges are viewable by everyone" ON challenges;
CREATE POLICY "Challenges are viewable by everyone" ON challenges FOR SELECT USING (true);

-- User challenges policies
DROP POLICY IF EXISTS "Users can view own challenges" ON user_challenges;
CREATE POLICY "Users can view own challenges" ON user_challenges FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own challenges" ON user_challenges;
CREATE POLICY "Users can insert own challenges" ON user_challenges FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own challenges" ON user_challenges;
CREATE POLICY "Users can update own challenges" ON user_challenges FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own challenges" ON user_challenges;
CREATE POLICY "Users can delete own challenges" ON user_challenges FOR DELETE USING (auth.uid() = user_id);

-- Practice streaks policies
DROP POLICY IF EXISTS "Users can view own practice streaks" ON practice_streaks;
CREATE POLICY "Users can view own practice streaks" ON practice_streaks FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own practice streaks" ON practice_streaks;
CREATE POLICY "Users can insert own practice streaks" ON practice_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own practice streaks" ON practice_streaks;
CREATE POLICY "Users can update own practice streaks" ON practice_streaks FOR UPDATE USING (auth.uid() = user_id);

-- Events policies
DROP POLICY IF EXISTS "Events are viewable by everyone" ON events;
CREATE POLICY "Events are viewable by everyone" ON events FOR SELECT USING (true);

-- User events policies
DROP POLICY IF EXISTS "Users can view own event registrations" ON user_events;
CREATE POLICY "Users can view own event registrations" ON user_events FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own event registrations" ON user_events;
CREATE POLICY "Users can insert own event registrations" ON user_events FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own event registrations" ON user_events;
CREATE POLICY "Users can delete own event registrations" ON user_events FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for all tables
alter publication supabase_realtime add table pieces;
alter publication supabase_realtime add table user_pieces;
alter publication supabase_realtime add table practice_sessions;
alter publication supabase_realtime add table achievements;
alter publication supabase_realtime add table user_achievements;
alter publication supabase_realtime add table challenges;
alter publication supabase_realtime add table user_challenges;
alter publication supabase_realtime add table practice_streaks;
alter publication supabase_realtime add table events;
alter publication supabase_realtime add table user_events;