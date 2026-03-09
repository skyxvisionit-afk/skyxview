-- ============================================================
-- NOTICE PANEL — Important Notices & Class Schedules
-- Run this in Supabase SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. IMPORTANT NOTICES TABLE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notices (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'info',   -- info | warning | danger | success
  is_pinned   BOOLEAN NOT NULL DEFAULT false,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_by  UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 2. CLASS SCHEDULES TABLE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.class_schedules (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT NOT NULL,               -- Class title/subject
  teacher_name  TEXT NOT NULL,               -- Sir/Ma'am name
  description   TEXT,                        -- Optional description
  meet_link     TEXT NOT NULL,               -- Google Meet link
  start_time    TIMESTAMPTZ NOT NULL,        -- Class start time
  end_time      TIMESTAMPTZ NOT NULL,        -- Class end time
  is_recurring  BOOLEAN NOT NULL DEFAULT false,
  recurrence    TEXT,                        -- daily | weekly | monthly (if recurring)
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_by    UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 3. INDEXES
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notices_active     ON public.notices(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notices_pinned     ON public.notices(is_pinned, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_class_active       ON public.class_schedules(is_active, start_time);
CREATE INDEX IF NOT EXISTS idx_class_start        ON public.class_schedules(start_time);

-- ─────────────────────────────────────────────────────────────
-- 4. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────

-- Enable RLS
ALTER TABLE public.notices         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;

-- NOTICES: Admin can do everything
DROP POLICY IF EXISTS "admin_notices_all" ON public.notices;
CREATE POLICY "admin_notices_all" ON public.notices
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- NOTICES: All authenticated users can read active notices
DROP POLICY IF EXISTS "auth_notices_read" ON public.notices;
CREATE POLICY "auth_notices_read" ON public.notices
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND is_active = true
  );

-- CLASS SCHEDULES: Admin can do everything
DROP POLICY IF EXISTS "admin_classes_all" ON public.class_schedules;
CREATE POLICY "admin_classes_all" ON public.class_schedules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- CLASS SCHEDULES: All authenticated users can read active schedules
DROP POLICY IF EXISTS "auth_classes_read" ON public.class_schedules;
CREATE POLICY "auth_classes_read" ON public.class_schedules
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND is_active = true
  );

-- ─────────────────────────────────────────────────────────────
-- 5. UPDATED_AT AUTO-UPDATE TRIGGER
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notices_updated_at ON public.notices;
CREATE TRIGGER trg_notices_updated_at
  BEFORE UPDATE ON public.notices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_classes_updated_at ON public.class_schedules;
CREATE TRIGGER trg_classes_updated_at
  BEFORE UPDATE ON public.class_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────
-- DONE — Notice Panel schema installed successfully
-- ─────────────────────────────────────────────────────────────
