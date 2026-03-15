-- ============================================================
-- NOTICE PDF SUPPORT — Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add pdf_url column to notices table
ALTER TABLE public.notices
ADD COLUMN IF NOT EXISTS pdf_url TEXT DEFAULT NULL;

-- 2. Create storage bucket for notice PDFs (run in SQL editor)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'notice-pdfs',
  'notice-pdfs',
  true,
  10485760,  -- 10MB limit
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage policies for notice-pdfs bucket

-- Admins can upload/manage files
DROP POLICY IF EXISTS "admin_notice_pdfs_all" ON storage.objects;
CREATE POLICY "admin_notice_pdfs_all" ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'notice-pdfs'
    AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
  )
  WITH CHECK (
    bucket_id = 'notice-pdfs'
    AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- All authenticated users can read PDFs
DROP POLICY IF EXISTS "auth_notice_pdfs_read" ON storage.objects;
CREATE POLICY "auth_notice_pdfs_read" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'notice-pdfs'
    AND auth.uid() IS NOT NULL
  );

-- ============================================================
-- DONE — Notice PDF migration complete
-- ============================================================
