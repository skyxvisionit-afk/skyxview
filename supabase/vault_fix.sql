-- Update system_settings table to support maintenance mode
ALTER TABLE public.system_settings 
ADD COLUMN IF NOT EXISTS is_maintenance_mode BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS maintenance_developer TEXT DEFAULT 'Admin';

-- Update users table to support avatars (expected by Vault UI)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Ensure at least one row exists in system_settings
-- We use a COALESCE logic to avoid duplicates if one already exists without an ID we know
INSERT INTO public.system_settings (id, activation_fee, is_maintenance_mode, maintenance_developer)
SELECT '00000000-0000-0000-0000-000000000000', 500, FALSE, 'Admin'
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings);

-- Enable Realtime for the system_settings table
-- This allows multiple admins to see the toggle change live
-- First, check if the publication exists (usually 'supabase_realtime')
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.system_settings;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Publication might not exist or table already added
    NULL;
END $$;
