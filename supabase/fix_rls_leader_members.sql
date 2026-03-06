-- ============================================================
-- FIX: Leader can see members under their trainers
-- Run this in Supabase SQL Editor
-- ============================================================

-- Drop the old management_select policy
DROP POLICY IF EXISTS "management_select" ON public.users;

-- Recreate with expanded access:
-- 1. Trainers can see their own assigned members (trainer_id = auth.uid())
-- 2. Leaders can see their own assigned trainers (leader_id = auth.uid())
-- 3. Leaders can ALSO see members whose trainer_id belongs to one of their trainers
CREATE POLICY "management_select" ON public.users
  FOR SELECT USING (
    trainer_id = auth.uid()
    OR leader_id = auth.uid()
    OR trainer_id IN (
      SELECT id FROM public.users WHERE leader_id = auth.uid()
    )
  );
