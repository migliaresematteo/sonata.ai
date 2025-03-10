-- Add profile customization fields to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS profile_color TEXT,
  ADD COLUMN IF NOT EXISTS profile_icon TEXT,
  ADD COLUMN IF NOT EXISTS profile_banner TEXT,
  ADD COLUMN IF NOT EXISTS profile_accessories JSONB;

-- Add default values for existing users
UPDATE profiles
SET 
  profile_color = CASE 
    WHEN random() < 0.2 THEN 'indigo'
    WHEN random() < 0.4 THEN 'purple'
    WHEN random() < 0.6 THEN 'blue'
    WHEN random() < 0.8 THEN 'green'
    ELSE 'amber'
  END,
  profile_icon = CASE 
    WHEN random() < 0.33 THEN 'music'
    WHEN random() < 0.66 THEN 'star'
    ELSE 'trophy'
  END
WHERE profile_color IS NULL;

-- Profiles table is already in the realtime publication, no need to add it again
