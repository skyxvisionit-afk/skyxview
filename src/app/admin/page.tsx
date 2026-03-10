import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Users, DollarSign, TrendingUp, UserCheck, AlertCircle, Clock, Settings, BarChart2 } from 'lucide-react'
import Link from 'next/link'
import LiveMeetingBanner from '@/components/LiveMeetingBanner'

export default async function AdminDashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    // Aggregate stats
    const [
        { count: totalUsers },
        { count: activeUsers },
        { count: inactiveUsers },
        { count: pendingActivations },
        { count: pendingWithdrawals },
        { data: commissions },
        { data: recentUsers },
        { data: settings },
    ] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('status', 'INACTIVE'),
        supabase.from('activation_payments').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
        supabase.from('withdraw_requests').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
        supabase.from('commissions').select('amount'),
        supabase.from('users').select('id, full_name, whatsapp, role, status, created_at').order('created_at', { ascending: false }).limit(8),
        supabase.from('system_settings').select('*').single(),
    ])

    const totalCommissions = (commissions || []).reduce((s: number, c: any) => s + c.amount, 0)
    const { data: paidWD } = await supabase.from('withdraw_requests').select('amount').eq('status', 'PAID')
    const totalPaid = (paidWD || []).reduce((s: number, w: any) => s + w.amount, 0)

    const quickStats = [
        { label: 'Total Users', value: totalUsers || 0, icon: Users, color: '#0ea5e9', href: '/admin/users' },
        { label: 'Active Members', value: activeUsers || 0, icon: UserCheck, color: '#10b981', href: '/admin/users' },
        { label: 'Pending Activations', value: pendingActivations || 0, icon: AlertCircle, color: '#f59e0b', href: '/admin/activations' },
        { label: 'Pending Withdrawals', value: pendingWithdrawals || 0, icon: Clock, color: '#ef4444', href: '/admin/withdrawals' },
        { label: 'Total Commissions', value: formatCurrency(totalCommissions), icon: TrendingUp, color: '#8b5cf6', href: '/admin/commissions' },
        { label: 'Total Paid Out', value: formatCurrency(totalPaid), icon: DollarSign, color: '#06b6d4', href: '/admin/withdrawals' },
    ]

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="page-header">
                <h1 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>
                    Admin <span className="gradient-text">Control Panel</span>
                </h1>
                <p className="text-sm mt-1" style={{ color: '#64748b' }}>Full platform overview and management</p>
            </div>

            <LiveMeetingBanner />

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {quickStats.map(s => (
                    <Link key={s.label} href={s.href} className="stat-card" style={{ textDecoration: 'none' }}>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold uppercase" style={{ color: '#64748b' }}>{s.label}</span>
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${s.color}15` }}>
                                <s.icon size={18} style={{ color: s.color }} />
                            </div>
                        </div>
                        <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                    </Link>
                ))}
            </div>

            {/* Settings Summary */}
            {settings && (
                <div className="glass-card p-5" style={{ borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.04)' }}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="section-title" style={{ fontSize: '1rem' }}>
                            <Settings size={18} style={{ color: '#10b981' }} />
                            Current System Settings
                        </h2>
                        <Link href="/admin/settings" className="text-xs btn-outline" style={{ padding: '0.3rem 0.7rem' }}>
                            Edit Settings
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            { label: 'Activation Fee', value: `৳${(settings as any).activation_fee}` },
                            { label: 'Referral Commission', value: `${(settings as any).referral_percentage}%` },
                            { label: 'Trainer Commission', value: `${(settings as any).trainer_percentage}%` },
                            { label: 'Leader Commission', value: `${(settings as any).leader_percentage}%` },
                        ].map(s => (
                            <div key={s.label} className="text-center p-3 rounded-lg" style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)' }}>
                                <div className="text-xl font-bold" style={{ color: '#10b981' }}>{s.value}</div>
                                <div className="text-xs mt-1" style={{ color: '#64748b' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Nav + Recent Users */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <div className="glass-card p-5">
                    <h2 className="section-title mb-4" style={{ fontSize: '1rem' }}>
                        <BarChart2 size={18} style={{ color: '#0ea5e9' }} />
                        Quick Actions
                    </h2>
                    <div className="space-y-2">
                        {([
                            { label: '👥 Manage Users', href: '/admin/users', color: '#0ea5e9' },
                            { label: '✅ Approve Activations', href: '/admin/activations', color: '#10b981' },
                            { label: '💸 Process Withdrawals', href: '/admin/withdrawals', color: '#f59e0b' },
                            { label: '💰 View Commissions', href: '/admin/commissions', color: '#8b5cf6' },
                            { label: '⚙️ System Settings', href: '/admin/settings', color: '#06b6d4' },
                        ] as any[]).map(a => (
                            <Link key={a.href} href={a.href}
                                className="flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:opacity-80"
                                style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    border: `1px solid ${a.color}40`,
                                    textDecoration: 'none',
                                    color: '#cbd5e1'
                                }}>
                                <span className="text-sm font-medium">{a.label}</span>
                                <span style={{ color: a.color }}>→</span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Recent Users */}
                <div className="glass-card overflow-hidden lg:col-span-2">
                    <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: '#1e3a5f' }}>
                        <h2 className="section-title" style={{ fontSize: '1rem' }}>
                            <Users size={18} style={{ color: '#0ea5e9' }} />
                            Recently Joined Users
                        </h2>
                        <Link href="/admin/users" className="text-xs" style={{ color: '#0ea5e9' }}>View All →</Link>
                    </div>
                    <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                        <table>
                            <thead><tr><th>Name</th><th>WhatsApp</th><th>Role</th><th>Status</th><th>Joined</th></tr></thead>
                            <tbody>
                                {(recentUsers || []).map((u: any) => (
                                    <tr key={u.id}>
                                        <td className="font-medium" style={{ color: '#e2e8f0' }}>{u.full_name}</td>
                                        <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{u.whatsapp}</td>
                                        <td>
                                            <span className="badge text-xs capitalize"
                                                style={{ background: 'rgba(14,165,233,0.1)', color: '#0ea5e9' }}>
                                                {u.role.replace('TEAM_', '')}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="badge text-xs"
                                                style={u.status === 'ACTIVE'
                                                    ? { background: 'rgba(16,185,129,0.1)', color: '#10b981' }
                                                    : { background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                                                {u.status}
                                            </span>
                                        </td>
                                        <td style={{ color: '#64748b', fontSize: '0.75rem' }}>{formatDate(u.created_at)}</td>
                                    </tr>
                                ))}
                                {(recentUsers || []).length === 0 && (
                                    <tr><td colSpan={5} className="py-8 text-center" style={{ color: '#64748b' }}>No users yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
