import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileSettings from '@/components/ProfileSettings'
import ReferralBanner from '@/components/ReferralBanner'
import type { UserProfile } from '@/lib/types'
import { Users, Award, DollarSign, TrendingUp } from 'lucide-react'

export default async function MemberProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const { data: profile } = await supabase
        .from('users').select('*').eq('id', user.id).single()
    if (!profile) redirect('/dashboard')

    // Get member stats
    const { count: referralCount } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('referred_by', user.id)

    const { count: activeReferrals } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('referred_by', user.id)
        .eq('status', 'ACTIVE')

    const { data: commissions } = await supabase
        .from('commissions')
        .select('amount')
        .eq('user_id', user.id)
    const totalIncome = (commissions || []).reduce((s, c) => s + c.amount, 0)

    const { data: paidWithdrawals } = await supabase
        .from('withdraw_requests')
        .select('amount')
        .eq('user_id', user.id)
        .eq('status', 'PAID')
    const totalPaid = (paidWithdrawals || []).reduce((s, w) => s + w.amount, 0)

    const stats = [
        { label: 'My Referrals', value: referralCount || 0, icon: 'users', color: '#06b6d4' },
        { label: 'Active Referrals', value: activeReferrals || 0, icon: 'award', color: '#10b981' },
        { label: 'Total Earned', value: `৳${totalIncome}`, icon: 'dollar', color: '#0ea5e9' },
        { label: 'Total Withdrawn', value: `৳${totalPaid}`, icon: 'trending', color: '#8b5cf6' },
    ]

    return (
        <div className="space-y-6 animate-fade-in-up pb-10">
            {/* Page Header */}
            <div className="page-header">
                <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-slate-500">Member Panel</p>
                <h1 className="text-2xl font-black tracking-tight" style={{ color: '#e2e8f0' }}>
                    My <span className="gradient-text">Profile</span>
                </h1>
                <p className="text-sm mt-1" style={{ color: '#64748b' }}>Manage your identity and view your performance.</p>
            </div>

            {/* Referral Code Banner */}
            <ReferralBanner code={(profile as UserProfile).referral_code || ''} />

            {/* Role-Specific Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {stats.map(s => (
                    <div key={s.label} className="stat-card p-4 hover:border-sky-500/20 transition-all group">
                        <div className="flex items-center gap-2 mb-2">
                            {s.icon === 'users' && <Users size={16} style={{ color: s.color }} />}
                            {s.icon === 'award' && <Award size={16} style={{ color: s.color }} />}
                            {s.icon === 'dollar' && <DollarSign size={16} style={{ color: s.color }} />}
                            {s.icon === 'trending' && <TrendingUp size={16} style={{ color: s.color }} />}
                            <span className="text-[0.6rem] font-bold uppercase tracking-widest text-slate-500">{s.label}</span>
                        </div>
                        <div className="text-xl font-black text-slate-200 group-hover:text-white transition-colors">{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Profile Settings Component */}
            <ProfileSettings profile={profile as UserProfile} />
        </div>
    )
}
