-- ============================================================
-- Updated Fix Commissions Table for Manual Passbook Entries
-- ============================================================

-- 1. Add new types to commission_type enum
ALTER TYPE commission_type ADD VALUE IF NOT EXISTS 'BONUS';
ALTER TYPE commission_type ADD VALUE IF NOT EXISTS 'TASK';
ALTER TYPE commission_type ADD VALUE IF NOT EXISTS 'MANUAL';
ALTER TYPE commission_type ADD VALUE IF NOT EXISTS 'FORM_FILLUP';
ALTER TYPE commission_type ADD VALUE IF NOT EXISTS 'PRODUCT_SELL';
ALTER TYPE commission_type ADD VALUE IF NOT EXISTS 'PHOTO_EDITING';
ALTER TYPE commission_type ADD VALUE IF NOT EXISTS 'VIDEO_EDITING';
ALTER TYPE commission_type ADD VALUE IF NOT EXISTS 'GRAPHIC_DESIGN';
ALTER TYPE commission_type ADD VALUE IF NOT EXISTS 'PEN_PACKAGING';
ALTER TYPE commission_type ADD VALUE IF NOT EXISTS 'SOAP_PACKAGING';
ALTER TYPE commission_type ADD VALUE IF NOT EXISTS 'SOCIAL_MEDIA';

-- 2. Make source_user_id nullable so system payments can be added without a source user
ALTER TABLE public.commissions ALTER COLUMN source_user_id DROP NOT NULL;

-- 3. Update RLS to ensure ADMIN can do everything
DROP POLICY IF EXISTS "admin_commissions_all" ON public.commissions;
CREATE POLICY "admin_commissions_all" ON public.commissions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
  );
