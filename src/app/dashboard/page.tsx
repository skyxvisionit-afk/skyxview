import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatCurrency, formatDateTime, getStatusColor, cn } from '@/lib/utils'
import type { UserProfile, Commission, WithdrawRequest } from '@/lib/types'
import {
    DollarSign, Users, TrendingUp, Calendar, Clock,
    Copy, AlertCircle, MessageCircle, Award
} from 'lucide-react'

async function getDashboardStats(userId: string) {
    const supabase = await createClient()

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)

    // All commissions
    const { data: commissions } = await supabase
        .from('commissions')
        .select('amount, created_at')
        .eq('user_id', userId)

    const allCommissions = commissions || []
    const total_income = allCommissions.reduce((s, c) => s + c.amount, 0)
    const today_income = allCommissions
        .filter(c => new Date(c.created_at) >= today)
        .reduce((s, c) => s + c.amount, 0)
    const yesterday_income = allCommissions
        .filter(c => {
            const d = new Date(c.created_at)
            return d >= yesterday && d < today
        })
        .reduce((s, c) => s + c.amount, 0)
    const weekly_income = allCommissions
        .filter(c => new Date(c.created_at) >= weekAgo)
        .reduce((s, c) => s + c.amount, 0)

    // Referrals
    const { count: referral_count } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('referred_by', userId)

    const { count: activated_referral_count } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('referred_by', userId)
        .eq('status', 'ACTIVE')

    // Paid withdrawals
    const { data: paidWithdrawals } = await supabase
        .from('withdraw_requests')
        .select('amount')
        .eq('user_id', userId)
        .eq('status', 'PAID')
    const paid = (paidWithdrawals || []).reduce((s, w) => s + w.amount, 0)

    return {
        total_income,
        today_income,
        yesterday_income,
        weekly_income,
        referral_count: referral_count || 0,
        activated_referral_count: activated_referral_count || 0,
        withdrawable_balance: total_income - paid,
    }
}

import ReferralBanner from '@/components/ReferralBanner'

export default async function MemberDashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const { data: profile } = await supabase
        .from('users').select('*').eq('id', user.id).single()
    if (!profile) redirect('/auth/login')

    const p = profile as UserProfile

    // Recent commissions
    const { data: recentCommissions } = await supabase
        .from('commissions')
        .select('*, source_user:source_user_id(full_name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

    // Recent withdrawals
    const { data: recentWithdrawals } = await supabase
        .from('withdraw_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

    if (p.status !== 'ACTIVE') {
        // Show activation pending screen
        return (
            <div className="max-w-2xl mx-auto py-10">
                <div className="glass-card p-8 md:p-12 text-center animate-fade-in-up border-amber-500/20 shadow-2xl shadow-amber-500/5">
                    <div className="w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 relative"
                        style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.05))' }}>
                        <div className="absolute inset-0 border-2 border-amber-500/30 rounded-[2rem] animate-pulse" />
                        <AlertCircle size={44} style={{ color: '#f59e0b' }} />
                    </div>
                    <h1 className="text-3xl font-extrabold mb-4 tracking-tight" style={{ color: '#e2e8f0' }}>Account Inactive</h1>
                    <p className="mb-10 text-lg leading-relaxed max-w-lg mx-auto" style={{ color: '#94a3b8' }}>
                        Your account is pending activation. Complete your <span className="text-amber-400 font-bold">one-time activation payment</span>
                        to unlock your dashboard, referral code, and all earning features.
                    </p>

                    <div className="glass-card p-6 md:p-8 mb-10 text-left relative overflow-hidden group"
                        style={{ borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.05)' }}>
                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                        <h3 className="font-bold text-xl mb-6 flex items-center gap-2" style={{ color: '#10b981' }}>
                            <Award size={20} /> Activation Steps:
                        </h3>
                        <div className="space-y-5">
                            {[
                                { step: 1, text: 'Send activation fee via Bkash / Nagad / Rocket' },
                                { step: 2, text: 'Save the transaction ID' },
                                { step: 3, text: 'WhatsApp admin with your transaction ID' },
                                { step: 4, text: 'Admin will verify and activate within 24 hours' },
                            ].map(item => (
                                <div key={item.step} className="flex items-start gap-4 transition-transform group-hover:translate-x-1 duration-300">
                                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-xs font-black text-emerald-400 flex-shrink-0 mt-0.5">
                                        {item.step}
                                    </div>
                                    <span style={{ color: '#cbd5e1' }} className="font-medium">{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <a href="https://wa.me/8801313961899?text=Hello%2C%20I%20want%20to%20activate%20my%20SkyX%20Vision%20It%20account"
                        target="_blank" rel="noopener noreferrer"
                        className="btn-accent w-full h-14 text-lg shadow-lg hover:shadow-emerald-500/20" style={{ justifyContent: 'center' }}>
                        <MessageCircle size={22} className="mr-2" />
                        Chat Admin: 01313961899
                    </a>
                </div>
            </div>
        )
    }

    const stats = await getDashboardStats(user.id)

    const mainStats = [
        { label: 'Withdrawable Balance', value: formatCurrency(stats.withdrawable_balance), icon: DollarSign, color: '#10b981', main: true },
        { label: 'Total Income', value: formatCurrency(stats.total_income), icon: DollarSign, color: '#0ea5e9' },
        { label: "Today's Income", value: formatCurrency(stats.today_income), icon: TrendingUp, color: '#10b981' },
    ]

    const subStats = [
        { label: "Yesterday", value: formatCurrency(stats.yesterday_income), icon: Calendar, color: '#8b5cf6' },
        { label: 'Weekly', value: formatCurrency(stats.weekly_income), icon: Clock, color: '#f59e0b' },
        { label: 'Total Team', value: stats.referral_count.toString(), icon: Users, color: '#06b6d4' },
        { label: 'Activated', value: stats.activated_referral_count.toString(), icon: Award, color: '#10b981' },
    ]

    return (
        <div className="space-y-8 animate-fade-in-up pb-10">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-1">
                    <p className="text-[0.65rem] font-black uppercase tracking-[0.25em] text-slate-500">Welcome Home</p>
                    <h1 className="text-3xl font-black tracking-tight" style={{ color: '#e2e8f0' }}>
                        {p.full_name.split(' ')[0]}<span className="gradient-text">_Welcome</span> 👋
                    </h1>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-800 shadow-inner">
                    <Clock size={16} className="text-sky-400" />
                    <span className="text-xs font-bold text-slate-300 tracking-wide">{new Date().toLocaleDateString('en-BD', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
                </div>
            </div>

            {/* Referral Code Banner */}
            <ReferralBanner code={p.referral_code || ''} />

            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {mainStats.map((card) => (
                    <div key={card.label} className={cn(
                        "stat-card group relative p-6 h-full",
                        card.main ? "ring-2 ring-emerald-500/20 bg-emerald-500/[0.03]" : ""
                    )}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500"
                                style={{ background: `${card.color}15` }}>
                                <card.icon size={22} style={{ color: card.color }} />
                            </div>
                            <span className="text-[0.65rem] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/5 border border-white/5" style={{ color: '#64748b' }}>
                                {card.label}
                            </span>
                        </div>
                        <div className="text-3xl font-black tracking-tighter" style={{ color: card.color }}>
                            {card.value}
                        </div>
                        <div className="mt-2 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-current opacity-20" style={{ width: '60%', color: card.color }}></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {subStats.map((card) => (
                    <div key={card.label} className="stat-card p-4 hover:border-sky-500/30 transition-all duration-300">
                        <div className="flex items-center gap-3 mb-2">
                            <card.icon size={16} style={{ color: card.color }} />
                            <span className="text-[0.6rem] font-bold uppercase tracking-widest text-slate-500">{card.label}</span>
                        </div>
                        <div className="text-xl font-black text-slate-200">{card.value}</div>
                    </div>
                ))}
            </div>

            {/* Bottom Grid */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Commissions */}
                <div className="glass-card p-5">
                    <h2 className="section-title mb-4" style={{ fontSize: '1rem' }}>
                        <DollarSign size={18} style={{ color: '#0ea5e9' }} />
                        Recent Commissions
                    </h2>
                    {(recentCommissions || []).length === 0 ? (
                        <p className="text-sm text-center py-6" style={{ color: '#64748b' }}>No commissions yet. Start referring!</p>
                    ) : (
                        <div className="space-y-3">
                            {(recentCommissions as Commission[]).map(c => (
                                <div key={c.id} className="flex items-center justify-between py-2 border-b"
                                    style={{ borderColor: 'rgba(30,58,95,0.3)' }}>
                                    <div>
                                        <div className="text-sm font-medium" style={{ color: '#e2e8f0' }}>
                                            {c.source_user?.full_name || 'Unknown Member'}
                                        </div>
                                        <div className="text-xs capitalize" style={{ color: '#64748b' }}>
                                            {c.type.toLowerCase()} commission • {formatDateTime(c.created_at)}
                                        </div>
                                    </div>
                                    <span className="font-bold text-sm" style={{ color: '#10b981' }}>
                                        +{formatCurrency(c.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Withdrawals */}
                <div className="glass-card p-5">
                    <h2 className="section-title mb-4" style={{ fontSize: '1rem' }}>
                        <TrendingUp size={18} style={{ color: '#0ea5e9' }} />
                        Recent Withdrawals
                    </h2>
                    {(recentWithdrawals || []).length === 0 ? (
                        <p className="text-sm text-center py-6" style={{ color: '#64748b' }}>No withdrawals yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {(recentWithdrawals as WithdrawRequest[]).map(w => (
                                <div key={w.id} className="flex items-center justify-between py-2 border-b"
                                    style={{ borderColor: 'rgba(30,58,95,0.3)' }}>
                                    <div>
                                        <div className="text-sm font-medium" style={{ color: '#e2e8f0' }}>
                                            {formatCurrency(w.amount)} via {w.method}
                                        </div>
                                        <div className="text-xs" style={{ color: '#64748b' }}>{formatDateTime(w.created_at)}</div>
                                    </div>
                                    <span className={`badge ${getStatusColor(w.status)}`}>{w.status}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
