-- Add random colors to profiles that don't have a color set
UPDATE profiles
SET profile_color = CASE 
  WHEN random() < 0.125 THEN 'indigo'
  WHEN random() < 0.25 THEN 'purple'
  WHEN random() < 0.375 THEN 'blue'
  WHEN random() < 0.5 THEN 'green'
  WHEN random() < 0.625 THEN 'amber'
  WHEN random() < 0.75 THEN 'red'
  WHEN random() < 0.875 THEN 'pink'
  ELSE 'blue'
END
WHERE profile_color IS NULL;

-- Add random icons to profiles that don't have an icon set
UPDATE profiles
SET profile_icon = CASE 
  WHEN random() < 0.33 THEN 'music'
  WHEN random() < 0.66 THEN 'star'
  ELSE 'trophy'
END
WHERE profile_icon IS NULL;
