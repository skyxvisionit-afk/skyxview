-- ============================================================
-- MEETING SYSTEM SCHEMA
-- ============================================================

-- Create the meetings table
CREATE TABLE IF NOT EXISTS public.meetings (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title          TEXT NOT NULL,
  description    TEXT,
  host_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  room_name      TEXT NOT NULL UNIQUE,
  status         TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'ended')),
  scheduled_at   TIMESTAMPTZ DEFAULT NOW(),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  settings       JSONB DEFAULT '{
    "muteOnStart": true,
    "startWithVideo": false,
    "allowChat": true
  }'::jsonb
);

-- Enable RLS
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- 1. SELECT: Everyone can see meetings
DROP POLICY IF EXISTS "Anyone can view meetings" ON public.meetings;
CREATE POLICY "Anyone can view meetings" ON public.meetings
  FOR SELECT USING (true);

-- 2. ALL: Only Admin, TL, and TR can manage meetings
DROP POLICY IF EXISTS "Hosts can manage meetings" ON public.meetings;
CREATE POLICY "Hosts can manage meetings" ON public.meetings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'TEAM_LEADER', 'TEAM_TRAINER')
    )
  );

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_meetings_status ON public.meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_host ON public.meetings(host_id);
