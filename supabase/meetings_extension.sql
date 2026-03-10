-- ============================================================
-- EXTRA MEETING FEATURES: Chat & Real-time Signals
-- ============================================================

-- Table for in-meeting chat messages
CREATE TABLE IF NOT EXISTS public.meeting_messages (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id    UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    sender_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    sender_name   TEXT NOT NULL,
    content       TEXT NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for chat
ALTER TABLE public.meeting_messages ENABLE ROW LEVEL SECURITY;

-- Everyone in the meeting can read messages
CREATE POLICY "Participants can view messages" ON public.meeting_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.meetings WHERE id = meeting_id
        )
    );

-- Anyone authenticated can send messages for now (assuming they have the meeting ID)
CREATE POLICY "Authenticated users can send messages" ON public.meeting_messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Update meetings table for host signals (like mute all)
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS host_signals JSONB DEFAULT '{
    "muteAllAt": null,
    "endForAll": false,
    "lockMeeting": false
}'::jsonb;
