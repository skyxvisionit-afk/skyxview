import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { BookOpen, Users, UserCheck, Phone, User } from 'lucide-react'

export default async function TrainerMemberBook() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    // Get Teams the trainer belongs to
    const { data: myTeams } = await supabase.from('team_trainers').select('team_id').eq('trainer_id', user.id)
    const teamIds = (myTeams || []).map(t => t.team_id)

    // Fetch all members under this trainer (direct or via team)
    let query = supabase
        .from('users')
        .select(`
            id, full_name, whatsapp, status, created_at,
            referred_by_user:referred_by(full_name, whatsapp)
        `)
        .eq('role', 'MEMBER')

    if (teamIds.length > 0) {
        query = query.or(`trainer_id.eq.${user.id},team_id.in.(${teamIds.join(',')})`)
    } else {
        query = query.eq('trainer_id', user.id)
    }

    const { data: members } = await query.order('created_at', { ascending: false })

    // Also fetch members who came through form fillup (submitted_by)
    const { data: formMembers } = await supabase
        .from('registration_forms')
        .select(`
            id, full_name, account_number, employee_id, status, created_at,
            submitter:submitted_by(full_name, whatsapp)
        `)
        .eq('status', 'ACCOUNT_CREATED')
        .order('created_at', { ascending: false })

    const allMembers = members || []

    return (
        <div className="space-y-6 animate-fade-in-up pb-10">
            <div className="page-header">
                <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: '#e2e8f0' }}>
                    <BookOpen size={24} className="text-sky-400" /> Member Book
                </h1>
                <p className="text-sm mt-1" style={{ color: '#64748b' }}>All members who joined through your referrals or form submissions</p>
            </div>

            {/* Stats */}
            <div className="grid sm:grid-cols-2 gap-4">
                <div className="stat-card">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold uppercase" style={{ color: '#64748b' }}>Total in Book</span>
                        <Users size={16} className="text-sky-400" />
                    </div>
                    <div className="text-2xl font-bold text-sky-400">{allMembers.length}</div>
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
                    <BookOpen size={18} className="text-sky-400" />
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
                                    style={{ background: `hsl(${(i * 47) % 360}, 50%, 20%)`, color: `hsl(${(i * 47) % 360}, 70%, 60%)` }}>
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
                                    {m.referred_by_user && (
                                        <div className="flex items-center gap-1.5 mt-1 text-sky-500/70 text-xs">
                                            <User size={11} />
                                            <span>Referred by: <span className="font-semibold">{m.referred_by_user.full_name}</span></span>
                                        </div>
                                    )}
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
