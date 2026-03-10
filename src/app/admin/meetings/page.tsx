import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MeetingManager from '@/components/MeetingManager'

export default async function AdminMeetingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    return (
        <div className="container mx-auto max-w-5xl">
            <MeetingManager userId={user.id} role="ADMIN" />
        </div>
    )
}
