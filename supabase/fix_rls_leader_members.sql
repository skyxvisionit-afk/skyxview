-- ============================================================
-- FIX: Leader can see members under their trainers
-- (Uses SECURITY DEFINER function to avoid RLS recursion)
-- Run this in Supabase SQL Editor
-- ============================================================

-- Step 1: Create a helper function that bypasses RLS
-- This safely returns trainer IDs that belong to the current leader
CREATE OR REPLACE FUNCTION public.get_trainer_ids_for_leader()
RETURNS SETOF UUID AS $$
  SELECT id FROM public.users
  WHERE leader_id = auth.uid() AND role = 'TEAM_TRAINER';
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Step 2: Drop the old policy and recreate with the safe function
DROP POLICY IF EXISTS "management_select" ON public.users;

CREATE POLICY "management_select" ON public.users
  FOR SELECT USING (
    trainer_id = auth.uid()
    OR leader_id = auth.uid()
    OR trainer_id IN (SELECT * FROM public.get_trainer_ids_for_leader())
  );
