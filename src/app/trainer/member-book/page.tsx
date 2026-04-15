import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MemberBookClient from '@/components/MemberBookClient'

export default async function TrainerMemberBook() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    // Get Teams the trainer belongs to
    const { data: myTeams } = await supabase.from('team_trainers').select('team_id').eq('trainer_id', user.id)
    const teamIds = (myTeams || []).map(t => t.team_id)

    // Fetch all members under this trainer (direct referrals, direct trainer assignment, or via team)
    const orConditions = [`trainer_id.eq.${user.id}`, `referred_by.eq.${user.id}`]
    if (teamIds.length > 0) orConditions.push(`team_id.in.(${teamIds.join(',')})`)

    const { data: allMembers } = await supabase
        .from('users')
        .select(`
            id, full_name, whatsapp, status, created_at,
            referred_by_user:referred_by(full_name, whatsapp)
        `)
        .eq('role', 'MEMBER')
        .or(orConditions.join(','))
        .order('created_at', { ascending: false })

    return (
        <div className="pb-10 animate-fade-in-up">
            <MemberBookClient 
                initialMembers={allMembers || []}
                title="Trainer Member Book"
                subtitle="All members assigned to you or referred by you."
            />
        </div>
    )
}

