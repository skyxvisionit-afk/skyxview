import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatCurrency, formatDate, getStatusColor, getRoleLabel } from '@/lib/utils'
import { Users, DollarSign, TrendingUp, UserCheck, Award } from 'lucide-react'
import { evaluateAutoBadge } from '@/lib/badgeUtils'
import Link from 'next/link'
import LiveMeetingBanner from '@/components/LiveMeetingBanner'

export default async function LeaderDashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
    if (!profile) redirect('/auth/login')

    // Get Teams the leader manages
    const { data: myTeams } = await supabase.from('teams').select('id, name').eq('leader_id', user.id)
    const teamIds = (myTeams || []).map(t => t.id)

    // Get trainers under this leader
    const { data: trainers } = await supabase
        .from('users')
        .select('id, full_name, whatsapp, status, created_at')
        .eq('leader_id', user.id)
        .eq('role', 'TEAM_TRAINER')
        .order('created_at', { ascending: false })

    const trainerIds = (trainers || []).map(t => t.id)

    // Construct query for all members under teams or trainers
    let query = supabase
        .from('users')
        .select('id, full_name, whatsapp, status, trainer_id, created_at')
        .eq('role', 'MEMBER')
        
    const orConditions = []
    if (teamIds.length > 0) orConditions.push(`team_id.in.(${teamIds.join(',')})`)
    if (trainerIds.length > 0) orConditions.push(`trainer_id.in.(${trainerIds.join(',')})`)
    
    let allMembers: any[] = []
    if (orConditions.length > 0) {
        const { data } = await query.or(orConditions.join(',')).order('created_at', { ascending: false })
        allMembers = data || []
    }

    // Leader commissions
    const { data: commissions } = await supabase
        .from('commissions')
        .select('amount, type, created_at, source_user:source_user_id(full_name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    const totalCommissions = (commissions || []).reduce((s, c) => s + c.amount, 0)

    const { data: paidWD } = await supabase
        .from('withdraw_requests').select('amount').eq('user_id', user.id).eq('status', 'PAID')
    const paid = (paidWD || []).reduce((s, w) => s + w.amount, 0)
    const withdrawable = totalCommissions - paid

    const activeMembers = (allMembers || []).filter(m => m.status === 'ACTIVE').length
    const { data: badges } = await supabase.from('badges').select('*')

    // Auto Badge Assignment
    const evaluatedBadge = evaluateAutoBadge(profile.role, (allMembers || []).length, totalCommissions, profile.badge || null, (badges || []) as any)
    if (evaluatedBadge !== (profile.badge || 'Newbie') && evaluatedBadge !== profile.badge) {
        await supabase.from('users').update({ badge: evaluatedBadge }).eq('id', user.id)
        profile.badge = evaluatedBadge
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="page-header">
                <h1 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>Team Leader Dashboard</h1>
                <p className="text-sm mt-1" style={{ color: '#64748b' }}>Full visibility of your team hierarchy</p>
            </div>

            <LiveMeetingBanner />

            {/* Stats */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'My Trainers', value: (trainers || []).length, icon: Users, color: '#0ea5e9' },
                    { label: 'Active Members', value: activeMembers, icon: UserCheck, color: '#8b5cf6' },
                    { label: 'Withdrawable', value: formatCurrency(withdrawable), icon: TrendingUp, color: '#f59e0b' },
                ].map(s => (
                    <div key={s.label} className="stat-card">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold uppercase" style={{ color: '#64748b' }}>{s.label}</span>
                            <s.icon size={16} style={{ color: s.color }} />
                        </div>
                        <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Trainers */}
                <div className="glass-card overflow-hidden">
                    <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: '#1e3a5f' }}>
                        <h2 className="section-title" style={{ fontSize: '1rem' }}>
                            <Users size={18} style={{ color: '#0ea5e9' }} />
                            My Trainers ({(trainers || []).length})
                        </h2>
                        <Link href="/leader/trainers" className="text-xs" style={{ color: '#0ea5e9' }}>View All →</Link>
                    </div>
                    {(trainers || []).length === 0 ? (
                        <div className="p-8 text-center"><p style={{ color: '#64748b', fontSize: '0.875rem' }}>No trainers assigned yet.</p></div>
                    ) : (
                        <div className="overflow-y-auto" style={{ maxHeight: '280px' }}>
                            <table>
                                <thead><tr><th>Trainer</th><th>WhatsApp</th><th>Status</th></tr></thead>
                                <tbody>
                                    {(trainers || []).map(t => (
                                        <tr key={t.id}>
                                            <td>
                                                <div className="font-medium" style={{ color: '#e2e8f0' }}>{t.full_name}</div>
                                                <div className="text-xs" style={{ color: '#64748b' }}>{formatDate(t.created_at)}</div>
                                            </td>
                                            <td style={{ color: '#94a3b8' }}>{t.whatsapp}</td>
                                            <td><span className={`badge ${getStatusColor(t.status)}`}>{t.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Recent Commissions */}
                <div className="glass-card overflow-hidden">
                    <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: '#1e3a5f' }}>
                        <h2 className="section-title" style={{ fontSize: '1rem' }}>
                            <DollarSign size={18} style={{ color: '#0ea5e9' }} />
                            Commissions (Total: {formatCurrency(totalCommissions)})
                        </h2>
                        <Link href="/leader/commissions" className="text-xs" style={{ color: '#0ea5e9' }}>View All →</Link>
                    </div>
                    {(commissions || []).length === 0 ? (
                        <div className="p-8 text-center"><p style={{ color: '#64748b', fontSize: '0.875rem' }}>No commissions yet.</p></div>
                    ) : (
                        <div className="overflow-y-auto" style={{ maxHeight: '280px' }}>
                            <table>
                                <thead><tr><th>Member</th><th>Type</th><th>Amount</th></tr></thead>
                                <tbody>
                                    {(commissions || []).slice(0, 8).map((c: any) => (
                                        <tr key={c.id}>
                                            <td style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>{c.source_user?.full_name || '—'}</td>
                                            <td><span className="badge text-purple-400 bg-purple-400/10 capitalize">{c.type.toLowerCase()}</span></td>
                                            <td className="font-semibold" style={{ color: '#10b981' }}>+{formatCurrency(c.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* All Team Members Preview */}
            <div className="glass-card overflow-hidden">
                <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: '#1e3a5f' }}>
                    <h2 className="section-title" style={{ fontSize: '1rem' }}>
                        <Award size={18} style={{ color: '#0ea5e9' }} />
                        Team Members ({(allMembers || []).length})
                    </h2>
                    <Link href="/leader/members" className="text-xs" style={{ color: '#0ea5e9' }}>View All →</Link>
                </div>
                {(allMembers || []).length === 0 ? (
                    <div className="p-8 text-center"><p style={{ color: '#64748b', fontSize: '0.875rem' }}>No members in your team yet.</p></div>
                ) : (
                    <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                        <table>
                            <thead><tr><th>Name</th><th>WhatsApp</th><th>Status</th><th>Joined</th></tr></thead>
                            <tbody>
                                {(allMembers || []).slice(0, 8).map(m => (
                                    <tr key={m.id}>
                                        <td className="font-medium" style={{ color: '#e2e8f0' }}>{m.full_name}</td>
                                        <td style={{ color: '#94a3b8' }}>{m.whatsapp}</td>
                                        <td><span className={`badge ${getStatusColor(m.status)}`}>{m.status}</span></td>
                                        <td style={{ color: '#64748b', fontSize: '0.75rem' }}>{formatDate(m.created_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="glass-card p-5">
                <h2 className="section-title mb-4" style={{ fontSize: '1rem' }}>Quick Actions</h2>
                <div className="flex gap-3 flex-wrap">
                    <Link href="/leader/withdraw" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                        <DollarSign size={14} /> Request Withdrawal
                    </Link>
                    <Link href="/leader/members" className="btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                        <Users size={14} /> View All Members
                    </Link>
                </div>
            </div>
        </div>
    )
}
