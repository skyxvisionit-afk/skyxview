import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/utils'
import { BookOpen, DollarSign, ArrowRightLeft, Clock } from 'lucide-react'

export default async function PassbookPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const { data: commissions } = await supabase
        .from('commissions')
        .select(`
            id, 
            amount, 
            type, 
            created_at, 
            source_user:source_user_id(full_name, whatsapp)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    const totalIncome = (commissions || []).reduce((s, c) => s + c.amount, 0)

    return (
        <div className="space-y-6 animate-fade-in-up pb-10">
            <div className="page-header">
                <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: '#e2e8f0' }}>
                    <BookOpen size={24} className="text-emerald-400" /> My Passbook
                </h1>
                <p className="text-sm mt-1" style={{ color: '#64748b' }}>Your complete income history and commission logs</p>
            </div>

            {/* Total Earnings */}
            <div className="glass-card p-6" style={{ borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.05)' }}>
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase mb-1" style={{ color: '#10b981' }}>TOTAL INCOME</p>
                        <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
                            {formatCurrency(totalIncome)}
                        </h2>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                        <DollarSign className="text-emerald-400" size={24} />
                    </div>
                </div>
            </div>

            {/* Income History */}
            <div className="glass-card overflow-hidden">
                <div className="p-5 border-b flex items-center gap-3" style={{ borderColor: '#1e3a5f' }}>
                    <ArrowRightLeft size={18} className="text-sky-400" />
                    <h2 className="font-bold text-white">Income History</h2>
                    <span className="ml-auto text-xs text-slate-500 font-semibold">{(commissions || []).length} records</span>
                </div>

                {(commissions || []).length === 0 ? (
                    <div className="p-16 text-center">
                        <DollarSign size={48} className="mx-auto mb-4 opacity-20 text-slate-400" />
                        <p className="text-slate-500 font-medium">No income records found.</p>
                        <p className="text-slate-600 text-sm mt-1">When you earn commissions, they will appear here.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {commissions!.map((c: any) => (
                            <div key={c.id} className="p-4 sm:p-5 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                                {/* Type Icon */}
                                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border bg-emerald-500/10 border-emerald-500/20">
                                    <DollarSign size={18} className="text-emerald-400" />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <div className="font-bold text-[15px] flex items-center gap-2 capitalize" style={{ color: '#e2e8f0' }}>
                                            {c.type === 'REFERRAL' ? 'Referral Income' 
                                            : c.type === 'TASK' ? 'Task Income' 
                                            : c.type === 'BONUS' ? 'System Bonus'
                                            : c.type.toLowerCase().replace('_', ' ')}
                                            
                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                                                c.type === 'REFERRAL' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 
                                                c.type === 'TASK' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                c.type === 'BONUS' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                            }`}>
                                                {c.type.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <div className="font-black text-emerald-400">
                                            +{formatCurrency(c.amount)}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1 text-slate-400 text-xs">
                                        <Clock size={11} />
                                        <span>{formatDate(c.created_at)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
