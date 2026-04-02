import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { BookOpen, Users, UserCheck, Phone, User } from 'lucide-react'

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

    // Fetch all members under this leader (direct team or trainer)
    let allMembers: any[] = []
    const orConditions = []
    if (teamIds.length > 0) orConditions.push(`team_id.in.(${teamIds.join(',')})`)
    if (trainerIds.length > 0) orConditions.push(`trainer_id.in.(${trainerIds.join(',')})`)

    if (orConditions.length > 0) {
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
    }

    return (
        <div className="space-y-6 animate-fade-in-up pb-10">
            <div className="page-header">
                <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: '#e2e8f0' }}>
                    <BookOpen size={24} className="text-purple-400" /> Member Book
                </h1>
                <p className="text-sm mt-1" style={{ color: '#64748b' }}>All members under your leadership — via referral or form registration</p>
            </div>

            {/* Stats */}
            <div className="grid sm:grid-cols-2 gap-4">
                <div className="stat-card">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold uppercase" style={{ color: '#64748b' }}>Total in Book</span>
                        <Users size={16} className="text-purple-400" />
                    </div>
                    <div className="text-2xl font-bold text-purple-400">{allMembers.length}</div>
                </div>
                <div className="stat-card">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold uppercase" style={{ color: '#64748b' }}>Active Members</span>
                        <UserCheck size={16} className="text-emerald-400" />
                    </div>
                    <div className="text-2xl font-bold text-emerald-400">{allMembers.filter(m => m.status === 'ACTIVE').length}</div>
                </div>
            </div>

            {/* Member List */}
            <div className="glass-card overflow-hidden">
                <div className="p-5 border-b flex items-center gap-3" style={{ borderColor: '#1e3a5f' }}>
                    <BookOpen size={18} className="text-purple-400" />
                    <h2 className="font-bold text-white">Member Registry</h2>
                    <span className="ml-auto text-xs text-slate-500 font-semibold">{allMembers.length} entries</span>
                </div>

                {allMembers.length === 0 ? (
                    <div className="p-16 text-center">
                        <BookOpen size={48} className="mx-auto mb-4 opacity-20 text-slate-400" />
                        <p className="text-slate-500 font-medium">No members in your book yet.</p>
                        <p className="text-slate-600 text-sm mt-1">Members will appear here once they register or submit a form.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {allMembers.map((m: any, i: number) => (
                            <div key={m.id} className="p-4 sm:p-5 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                                {/* Serial */}
                                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-mono font-bold text-slate-500 shrink-0">
                                    {i + 1}
                                </div>

                                {/* Avatar */}
                                <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 font-bold text-lg"
                                    style={{ background: `hsl(${(i * 53) % 360}, 50%, 20%)`, color: `hsl(${(i * 53) % 360}, 70%, 60%)` }}>
                                    {m.full_name?.charAt(0).toUpperCase()}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-white text-sm">{m.full_name}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                                            {m.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1 text-slate-400 text-xs">
                                        <Phone size={11} />
                                        <span className="font-mono">{m.whatsapp || '—'}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-3 mt-1">
                                        {m.referred_by_user && (
                                            <div className="flex items-center gap-1.5 text-sky-500/70 text-xs">
                                                <User size={11} />
                                                <span>Referred by: <span className="font-semibold">{m.referred_by_user.full_name}</span></span>
                                            </div>
                                        )}
                                        {m.trainer && (
                                            <div className="flex items-center gap-1.5 text-purple-400/70 text-xs">
                                                <Users size={11} />
                                                <span>Trainer: <span className="font-semibold">{m.trainer.full_name}</span></span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Date */}
                                <div className="hidden sm:block text-right">
                                    <div className="text-xs text-slate-600">Joined</div>
                                    <div className="text-xs font-semibold text-slate-400">{formatDate(m.created_at)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
