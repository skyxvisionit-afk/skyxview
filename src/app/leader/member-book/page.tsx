import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MemberBookClient from '@/components/MemberBookClient'

export default async function LeaderMemberBook() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    // Get Teams the leader manages
    const { data: myTeams } = await supabase.from('teams').select('id').eq('leader_id', user.id)
    const teamIds = (myTeams || []).map(t => t.id)

    // Get Trainers under the leader
    const { data: trainers } = await supabase.from('users').select('id').eq('leader_id', user.id).eq('role', 'TEAM_TRAINER')
    const trainerIds = (trainers || []).map(t => t.id)

    // Fetch all members under this leader:
    // 1. Members in teams managed by this leader
    // 2. Members under trainers managed by this leader
    // 3. Members directly referred by this leader
    let allMembers: any[] = []
    const orConditions = [`referred_by.eq.${user.id}`]
    
    if (teamIds.length > 0) orConditions.push(`team_id.in.(${teamIds.join(',')})`)
    if (trainerIds.length > 0) orConditions.push(`trainer_id.in.(${trainerIds.join(',')})`)

    const { data } = await supabase
        .from('users')
        .select(`
            id, full_name, whatsapp, status, created_at,
            referred_by_user:referred_by(full_name, whatsapp),
            trainer:trainer_id(full_name)
        `)
        .eq('role', 'MEMBER')
        .or(orConditions.join(','))
        .order('created_at', { ascending: false })
    
    allMembers = data || []

    return (
        <div className="pb-10 animate-fade-in-up">
            <MemberBookClient 
                initialMembers={allMembers}
                title="Leader Member Book"
                subtitle="All members under your leadership — direct referrals, team members, and trainer networks."
            />
        </div>
    )
}
