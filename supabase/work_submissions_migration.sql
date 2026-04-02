-- Create work_submissions table
CREATE TABLE IF NOT EXISTS work_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    work_type TEXT NOT NULL,
    notes TEXT,
    file_url TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    admin_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE work_submissions ENABLE ROW LEVEL SECURITY;

-- Members can only see their own submissions
CREATE POLICY "Members can view own submissions"
ON work_submissions FOR SELECT
USING (auth.uid() = user_id);

-- Members can insert their own submissions
CREATE POLICY "Members can insert own submissions"
ON work_submissions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins have full access
CREATE POLICY "Admins have full access to work_submissions"
ON work_submissions FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
    )
);

-- Storage bucket for work files (run in Dashboard > Storage)
-- Create a bucket called: work-files
-- Set it as PUBLIC

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_work_submissions_user_id ON work_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_work_submissions_status ON work_submissions(status);
CREATE INDEX IF NOT EXISTS idx_work_submissions_created_at ON work_submissions(created_at DESC);
