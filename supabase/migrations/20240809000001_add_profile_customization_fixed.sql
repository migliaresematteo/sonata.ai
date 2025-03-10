-- First check if the columns exist before adding them
DO $$ 
BEGIN
  -- Check if profile_color column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'profiles' 
                AND column_name = 'profile_color') THEN
    ALTER TABLE profiles ADD COLUMN profile_color TEXT;
  END IF;
  
  -- Check if profile_icon column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'profiles' 
                AND column_name = 'profile_icon') THEN
    ALTER TABLE profiles ADD COLUMN profile_icon TEXT;
  END IF;
  
  -- Check if profile_banner column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'profiles' 
                AND column_name = 'profile_banner') THEN
    ALTER TABLE profiles ADD COLUMN profile_banner TEXT;
  END IF;
  
  -- Check if profile_accessories column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'profiles' 
                AND column_name = 'profile_accessories') THEN
    ALTER TABLE profiles ADD COLUMN profile_accessories JSONB;
  END IF;
END $$;

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
