import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { Users, DollarSign, TrendingUp, UserCheck } from 'lucide-react'
import { evaluateAutoBadge } from '@/lib/badgeUtils'
import Link from 'next/link'
import LiveMeetingBanner from '@/components/LiveMeetingBanner'

export default async function TrainerDashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const p = user as any; // Need profile access
    const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
    if (!profile) redirect('/auth/login')

    // Get Teams the trainer belongs to
    const { data: myTeams } = await supabase.from('team_trainers').select('team_id').eq('trainer_id', user.id)
    const teamIds = (myTeams || []).map(t => t.team_id)

    let query = supabase
        .from('users')
        .select('id, full_name, whatsapp, status, created_at, referred_by')
        .eq('role', 'MEMBER')
        
    if (teamIds.length > 0) {
        query = query.or(`trainer_id.eq.${user.id},team_id.in.(${teamIds.join(',')})`)
    } else {
        query = query.eq('trainer_id', user.id)
    }

    const { data: members } = await query.order('created_at', { ascending: false })

    // Commissions
    const { data: commissions } = await supabase
        .from('commissions')
        .select('amount, type, created_at, source_user:source_user_id(full_name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    const totalCommissions = (commissions || []).reduce((s, c) => s + c.amount, 0)
    const activeMembers = (members || []).filter(m => m.status === 'ACTIVE').length
    const inactiveMembers = (members || []).filter(m => m.status !== 'ACTIVE').length

    // Paid withdrawals
    const { data: paidWD } = await supabase
        .from('withdraw_requests')
        .select('amount')
        .eq('user_id', user.id)
        .eq('status', 'PAID')
    const paid = (paidWD || []).reduce((s, w) => s + w.amount, 0)
    const withdrawable = totalCommissions - paid
    const { data: badges } = await supabase.from('badges').select('*')

    // Auto Badge Assignment
    const evaluatedBadge = evaluateAutoBadge(profile.role, members?.length || 0, totalCommissions, profile.badge || null, (badges || []) as any)
    if (evaluatedBadge !== (profile.badge || 'Newbie') && evaluatedBadge !== profile.badge) {
        await supabase.from('users').update({ badge: evaluatedBadge }).eq('id', user.id)
        profile.badge = evaluatedBadge
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="page-header">
                <h1 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>Trainer Dashboard</h1>
                <p className="text-sm mt-1" style={{ color: '#64748b' }}>Manage your members and track commissions</p>
            </div>

            <LiveMeetingBanner />

            {/* Stat Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Active Members', value: activeMembers, icon: UserCheck, color: '#10b981' },
                    { label: 'Total Commissions', value: formatCurrency(totalCommissions), icon: DollarSign, color: '#8b5cf6' },
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
                {/* Member List */}
                <div className="glass-card overflow-hidden">
                    <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: '#1e3a5f' }}>
                        <h2 className="section-title" style={{ fontSize: '1rem' }}>
                            <Users size={18} style={{ color: '#0ea5e9' }} />
                            My Members ({(members || []).length})
                        </h2>
                        <Link href="/trainer/members" className="text-xs" style={{ color: '#0ea5e9' }}>View All →</Link>
                    </div>
                    {(members || []).length === 0 ? (
                        <div className="p-8 text-center">
                            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>No members assigned yet.</p>
                        </div>
                    ) : (
                        <div className="overflow-y-auto" style={{ maxHeight: '300px' }}>
                            <table>
                                <thead><tr><th>Name</th><th>Status</th><th>Joined</th></tr></thead>
                                <tbody>
                                    {(members || []).slice(0, 10).map(m => (
                                        <tr key={m.id}>
                                            <td>
                                                <div className="font-medium" style={{ color: '#e2e8f0' }}>{m.full_name}</div>
                                                <div className="text-xs" style={{ color: '#64748b' }}>{m.whatsapp}</div>
                                            </td>
                                            <td><span className={`badge ${getStatusColor(m.status)}`}>{m.status}</span></td>
                                            <td style={{ color: '#64748b', fontSize: '0.75rem' }}>{formatDate(m.created_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Commission History */}
                <div className="glass-card overflow-hidden">
                    <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: '#1e3a5f' }}>
                        <h2 className="section-title" style={{ fontSize: '1rem' }}>
                            <DollarSign size={18} style={{ color: '#0ea5e9' }} />
                            Recent Commissions
                        </h2>
                        <Link href="/trainer/commissions" className="text-xs" style={{ color: '#0ea5e9' }}>View All →</Link>
                    </div>
                    {(commissions || []).length === 0 ? (
                        <div className="p-8 text-center">
                            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>No commissions yet.</p>
                        </div>
                    ) : (
                        <div className="overflow-y-auto" style={{ maxHeight: '300px' }}>
                            <table>
                                <thead><tr><th>Member</th><th>Type</th><th>Amount</th><th>Date</th></tr></thead>
                                <tbody>
                                    {(commissions || []).slice(0, 10).map((c: any) => (
                                        <tr key={c.id}>
                                            <td style={{ color: '#cbd5e1' }}>{c.source_user?.full_name || '—'}</td>
                                            <td><span className="badge text-cyan-400 bg-cyan-400/10 capitalize">{c.type.toLowerCase()}</span></td>
                                            <td className="font-semibold" style={{ color: '#10b981' }}>+{formatCurrency(c.amount)}</td>
                                            <td style={{ color: '#64748b', fontSize: '0.75rem' }}>{formatDate(c.created_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-card p-5">
                <h2 className="section-title mb-4" style={{ fontSize: '1rem' }}>Quick Actions</h2>
                <div className="flex gap-3 flex-wrap">
                    <Link href="/trainer/withdraw" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                        <DollarSign size={14} /> Request Withdrawal
                    </Link>
                    <Link href="/trainer/members" className="btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                        <Users size={14} /> View All Members
                    </Link>
                </div>
            </div>
        </div>
    )
}
