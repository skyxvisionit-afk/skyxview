-- ============================================================
-- SkyX View — Profile & Security Update SQL
-- Run this in Supabase SQL Editor to enable new features
-- ============================================================

-- 1. Add extra fields to public.users table for a "more unique" profile
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT;

-- 2. Function to allow a user to delete their own account
-- This deletes from BOTH public.users (via cascade) and auth.users
CREATE OR REPLACE FUNCTION delete_own_account()
RETURNS void AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Function to allow an Admin to delete any user
-- This is secure because it checks the role of the person calling it
CREATE OR REPLACE FUNCTION delete_user_by_admin(target_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Perform security check: only allow if caller is an ADMIN
  IF (SELECT role FROM public.users WHERE id = auth.uid()) = 'ADMIN' THEN
    DELETE FROM auth.users WHERE id = target_user_id;
  ELSE
    RAISE EXCEPTION 'Access Denied: Only admins can perform this action';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Notifications table — Admin can send notifications to users
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'info',        -- info, success, warning, danger
  target_type TEXT NOT NULL DEFAULT 'all',         -- all, role, user
  target_role TEXT,                                 -- MEMBER, TEAM_TRAINER, TEAM_LEADER (when target_type='role')
  target_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- (when target_type='user')
  sender_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Notification read status (track which users have read which notifications)
CREATE TABLE IF NOT EXISTS public.notification_reads (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  read_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(notification_id, user_id)
);

-- 6. Indexes for fast notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_target    ON public.notifications(target_type);
CREATE INDEX IF NOT EXISTS idx_notifications_created   ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_reads_user ON public.notification_reads(user_id);

-- 7. RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

-- Everyone can read notifications that target them
CREATE POLICY "Users can view their notifications" ON public.notifications
  FOR SELECT USING (
    target_type = 'all'
    OR (target_type = 'role' AND target_role = (SELECT role::text FROM public.users WHERE id = auth.uid()))
    OR (target_type = 'user' AND target_user_id = auth.uid())
    OR sender_id = auth.uid()
  );

-- Only admins can insert notifications
CREATE POLICY "Admins can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'ADMIN'
  );

-- Only admins can delete notifications
CREATE POLICY "Admins can delete notifications" ON public.notifications
  FOR DELETE USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'ADMIN'
  );

-- Users can mark notifications as read
CREATE POLICY "Users can mark as read" ON public.notification_reads
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own reads" ON public.notification_reads
  FOR SELECT USING (user_id = auth.uid());
