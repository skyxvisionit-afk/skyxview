import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDate, getStatusColor } from '@/lib/utils'
import { Users, UserCheck } from 'lucide-react'

export default async function LeaderTrainersPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    // Get trainers under this leader
    const { data: trainers } = await supabase
        .from('users')
        .select('id, full_name, whatsapp, email, status, created_at')
        .eq('leader_id', user.id)
        .eq('role', 'TEAM_TRAINER')
        .order('created_at', { ascending: false })

    // For each trainer, get their member count
    const trainerIds = (trainers || []).map(t => t.id)
    const { data: allMembers } = trainerIds.length
        ? await supabase
            .from('users')
            .select('id, trainer_id')
            .in('trainer_id', trainerIds)
        : { data: [] }

    const memberCountMap: Record<string, number> = {}
    for (const m of (allMembers || [])) {
        memberCountMap[m.trainer_id] = (memberCountMap[m.trainer_id] || 0) + 1
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="page-header">
                <h1 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>My Trainers</h1>
                <p className="text-sm mt-1" style={{ color: '#64748b' }}>All trainers assigned under your leadership</p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
                {[
                    { label: 'Total Trainers', value: (trainers || []).length, color: '#0ea5e9' },
                    { label: 'Active', value: (trainers || []).filter(t => t.status === 'ACTIVE').length, color: '#10b981' },
                    { label: 'Total Members', value: (allMembers || []).length, color: '#8b5cf6' },
                ].map(s => (
                    <div key={s.label} className="stat-card">
                        <div className="text-xs font-semibold mb-2 uppercase" style={{ color: '#64748b' }}>{s.label}</div>
                        <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                    </div>
                ))}
            </div>

            <div className="glass-card overflow-hidden">
                <div className="p-5 border-b" style={{ borderColor: '#1e3a5f' }}>
                    <h2 className="section-title" style={{ fontSize: '1rem' }}>
                        <Users size={18} style={{ color: '#0ea5e9' }} />
                        Trainer Directory
                    </h2>
                </div>
                {(trainers || []).length === 0 ? (
                    <div className="p-10 text-center">
                        <Users size={40} className="mx-auto mb-3 opacity-30" style={{ color: '#64748b' }} />
                        <p style={{ color: '#64748b' }}>No trainers assigned yet.</p>
                    </div>
                ) : (
                    <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                        <table>
                            <thead><tr><th>#</th><th>Name</th><th>WhatsApp</th><th>Email</th><th>Members</th><th>Status</th><th>Joined</th></tr></thead>
                            <tbody>
                                {(trainers || []).map((t, i) => (
                                    <tr key={t.id}>
                                        <td style={{ color: '#64748b' }}>{i + 1}</td>
                                        <td className="font-medium" style={{ color: '#e2e8f0' }}>{t.full_name}</td>
                                        <td style={{ color: '#94a3b8' }}>{t.whatsapp}</td>
                                        <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{t.email}</td>
                                        <td>
                                            <span className="badge text-purple-400 bg-purple-400/10">
                                                <UserCheck size={12} /> {memberCountMap[t.id] || 0}
                                            </span>
                                        </td>
                                        <td><span className={`badge ${getStatusColor(t.status)}`}>{t.status}</span></td>
                                        <td style={{ color: '#64748b', fontSize: '0.75rem' }}>{formatDate(t.created_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
