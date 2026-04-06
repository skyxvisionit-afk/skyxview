'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, getStatusColor, getRoleColor, getRoleLabel, cn } from '@/lib/utils'
import type { UserProfile } from '@/lib/types'
import {
    Users, Search, Filter, UserCheck, UserX, Ban,
    ChevronDown, CheckCircle, AlertCircle, X, Edit2, Trash2, Activity
} from 'lucide-react'
import UserRecordModal from './UserRecordModal'
import { getBadgeColor } from '@/lib/badgeUtils'

const ROLES = ['MEMBER', 'TEAM_TRAINER', 'TEAM_LEADER', 'ADMIN'] as const
const STATUSES = ['INACTIVE', 'ACTIVE', 'SUSPENDED', 'BANNED'] as const

export default function AdminUsersPage() {
    const supabase = createClient()
    const [users, setUsers] = useState<UserProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterStatus, setFilterStatus] = useState('')
    const [filterRole, setFilterRole] = useState('')
    const [editUser, setEditUser] = useState<UserProfile | null>(null)
    const [recordUser, setRecordUser] = useState<UserProfile | null>(null)
    const [editForm, setEditForm] = useState({ role: '', status: '', trainer_id: '', leader_id: '', team_id: '', created_at: '' })
    const [trainers, setTrainers] = useState<UserProfile[]>([])
    const [leaders, setLeaders] = useState<UserProfile[]>([])
    const [teams, setTeams] = useState<any[]>([])
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })

    const load = useCallback(async () => {
        setLoading(true)
        let q = supabase.from('users').select('*').order('created_at', { ascending: false })
        if (filterStatus) q = q.eq('status', filterStatus)
        if (filterRole) q = q.eq('role', filterRole)
        const { data } = await q
        setUsers((data || []) as UserProfile[])

        const { data: trainerData } = await supabase.from('users').select('*').eq('role', 'TEAM_TRAINER').eq('status', 'ACTIVE')
        const { data: leaderData } = await supabase.from('users').select('*').eq('role', 'TEAM_LEADER').eq('status', 'ACTIVE')
        const { data: teamsData } = await supabase.from('teams').select('*')
        
        setTrainers((trainerData || []) as UserProfile[])
        setLeaders((leaderData || []) as UserProfile[])
        setTeams(teamsData || [])
        setLoading(false)
    }, [filterStatus, filterRole])

    useEffect(() => { load() }, [load])

    const openEdit = (u: UserProfile) => {
        setEditUser(u)
        setEditForm({ 
            role: u.role, 
            status: u.status, 
            trainer_id: u.trainer_id || '', 
            leader_id: u.leader_id || '', 
            team_id: u.team_id || '',
            created_at: u.created_at ? new Date(u.created_at).toISOString().slice(0, 16) : ''
        })
        setMessage({ type: '', text: '' })
    }

    const saveUser = async () => {
        if (!editUser) return
        setSaving(true)
        setMessage({ type: '', text: '' })

        // Auto-resolve leader_id from trainer if not manually set
        let resolvedLeaderId = editForm.leader_id || null
        if (editForm.trainer_id && !editForm.leader_id) {
            // Check if the selected trainer belongs to a leader
            const selectedTrainer = users.find(u => u.id === editForm.trainer_id)
            if (selectedTrainer?.leader_id) {
                resolvedLeaderId = selectedTrainer.leader_id
            }
        }

        const updates: any = {
            role: editForm.role,
            status: editForm.status,
            trainer_id: editForm.trainer_id || null,
            leader_id: resolvedLeaderId,
            team_id: editForm.team_id || null,
            created_at: editForm.created_at ? new Date(editForm.created_at).toISOString() : editUser.created_at
        }

        // Automatic Team Management
        if (editForm.role === 'TEAM_LEADER' && editUser.role !== 'TEAM_LEADER') {
            // Check if they already have a team
            const existingTeam = teams.find(t => t.leader_id === editUser.id)
            if (!existingTeam) {
                const { data: newTeam } = await supabase.from('teams').insert({
                    name: `${editUser.full_name}'s Team`,
                    leader_id: editUser.id
                }).select().single()
                if (newTeam) updates.team_id = newTeam.id
            }
        }
        
        if (editUser.role === 'TEAM_LEADER' && editForm.role !== 'TEAM_LEADER') {
            await supabase.from('teams').delete().eq('leader_id', editUser.id)
            // Users assigned to this team will have team_id set to NULL auto via ON DELETE SET NULL
        }

        if (editForm.role === 'TEAM_TRAINER' && updates.team_id) {
            // Ensure they are mapped as a trainer for this team
            const { data: existingTT } = await supabase.from('team_trainers').select('*').eq('trainer_id', editUser.id).eq('team_id', updates.team_id).single()
            if (!existingTT) {
                // Remove from previous teams
                await supabase.from('team_trainers').delete().eq('trainer_id', editUser.id)
                await supabase.from('team_trainers').insert({ team_id: updates.team_id, trainer_id: editUser.id })
            }
        }
        
        if (editUser.role === 'TEAM_TRAINER' && editForm.role !== 'TEAM_TRAINER') {
            await supabase.from('team_trainers').delete().eq('trainer_id', editUser.id)
        }

        // If activating, create commissions
        if (editForm.status === 'ACTIVE' && editUser.status !== 'ACTIVE') {
            // Get settings
            const { data: s } = await supabase.from('system_settings').select('*').single()
            const settings = s as any

            if (editUser.referred_by && settings) {
                // Referral commission
                await supabase.from('commissions').insert({
                    user_id: editUser.referred_by,
                    source_user_id: editUser.id,
                    amount: settings.activation_fee * (settings.referral_percentage / 100),
                    type: 'REFERRAL',
                })
            }

            if (editForm.trainer_id && settings) {
                // Trainer commission
                await supabase.from('commissions').insert({
                    user_id: editForm.trainer_id,
                    source_user_id: editUser.id,
                    amount: settings.activation_fee * (settings.trainer_percentage / 100),
                    type: 'TRAINER',
                })
            }

            if (resolvedLeaderId && settings) {
                // Leader commission
                await supabase.from('commissions').insert({
                    user_id: resolvedLeaderId,
                    source_user_id: editUser.id,
                    amount: settings.activation_fee * (settings.leader_percentage / 100),
                    type: 'LEADER',
                })
            }
        }

        const { error } = await supabase.from('users').update(updates).eq('id', editUser.id)

        if (error) {
            setMessage({ type: 'error', text: 'Failed to update user.' })
        } else {
            setMessage({ type: 'success', text: 'User updated successfully!' })
            load()
            setTimeout(() => setEditUser(null), 1200)
        }
        setSaving(false)
    }

    const filtered = users.filter(u =>
        search === '' ||
        u.full_name.toLowerCase().includes(search.toLowerCase()) ||
        u.whatsapp.includes(search) ||
        (u.email || '').toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="page-header">
                <h1 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>Manage Users</h1>
                <p className="text-sm mt-1" style={{ color: '#64748b' }}>{users.length} total users</p>
            </div>

            {/* Filters */}
            <div className="glass-card p-4 flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-48">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }} />
                    <input id="user-search" type="text" className="input-field" style={{ paddingLeft: '2.25rem' }}
                        placeholder="Search by name, phone, email..."
                        value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select id="filter-status" className="select-field" style={{ width: 'auto', minWidth: '140px' }}
                    value={filterStatus} onChange={e => { setFilterStatus(e.target.value); }}>
                    <option value="">All Statuses</option>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select id="filter-role" className="select-field" style={{ width: 'auto', minWidth: '140px' }}
                    value={filterRole} onChange={e => { setFilterRole(e.target.value); }}>
                    <option value="">All Roles</option>
                    {ROLES.map(r => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
                </select>
                <button className="btn-outline" style={{ padding: '0.5rem 1rem' }} onClick={load}>
                    <Filter size={14} /> Apply
                </button>
            </div>

            {/* Table */}
            <div className="glass-card overflow-hidden">
                <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                    {loading ? (
                        <div className="p-10 text-center" style={{ color: '#64748b' }}>
                            <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
                            Loading users...
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Name</th>
                                    <th>WhatsApp</th>
                                    <th>Role</th>
                                    <th>Badge</th>
                                    <th>Status</th>
                                    <th>Referral Code</th>
                                    <th>Joined</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={8} className="py-10 text-center" style={{ color: '#64748b' }}>No users found.</td></tr>
                                ) : filtered.map((u, i) => (
                                    <tr key={u.id}>
                                        <td style={{ color: '#64748b', fontSize: '0.75rem' }}>{i + 1}</td>
                                        <td>
                                            <div className="font-medium" style={{ color: '#e2e8f0' }}>{u.full_name}</div>
                                            <div className="text-xs" style={{ color: '#64748b' }}>{u.email}</div>
                                        </td>
                                        <td style={{ color: '#94a3b8' }}>{u.whatsapp}</td>
                                        <td><span className={cn('badge', getRoleColor(u.role))}>{getRoleLabel(u.role)}</span></td>
                                        <td>
                                            <span className={cn('badge text-[0.65rem] border truncate inline-block max-w-[100px]', getBadgeColor(u.badge))}>
                                                {u.badge || 'Newbie'}
                                            </span>
                                        </td>
                                        <td><span className={cn('badge', getStatusColor(u.status))}>{u.status}</span></td>
                                        <td>
                                            <span className="font-mono text-xs" style={{ color: '#10b981' }}>{u.referral_code || '—'}</span>
                                        </td>
                                        <td style={{ color: '#64748b', fontSize: '0.75rem' }}>{formatDate(u.created_at)}</td>
                                        <td>
                                            <div className="flex flex-wrap gap-2">
                                                <button className="btn-outline flex-1 sm:flex-none justify-center" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                                                    onClick={() => openEdit(u)}>
                                                    <Edit2 size={12} /> Edit
                                                </button>
                                                <button className="btn-outline flex-1 sm:flex-none justify-center" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', borderColor: 'green' }}
                                                    onClick={() => setRecordUser(u)}>
                                                    <Activity size={12} className="text-emerald-400" /> Record
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {editUser && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
                    <div className="glass-card p-6 w-full max-w-md my-6 sm:my-12 shadow-2xl" style={{ background: '#0d1530' }}>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="font-bold text-lg" style={{ color: '#e2e8f0' }}>Edit User</h2>
                            <button onClick={() => setEditUser(null)} style={{ color: '#64748b' }}><X size={20} /></button>
                        </div>

                        <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)' }}>
                            <div className="font-semibold" style={{ color: '#e2e8f0' }}>{editUser.full_name}</div>
                            <div className="text-xs" style={{ color: '#64748b' }}>{editUser.whatsapp} · {editUser.email}</div>
                        </div>

                        {message.text && (
                            <div className={message.type === 'success' ? 'alert-success mb-4' : 'alert-error mb-4'}>
                                {message.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                {message.text}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="form-label">Role</label>
                                <select id="edit-role" className="select-field"
                                    value={editForm.role}
                                    onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))}>
                                    {ROLES.map(r => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="form-label">Joining Date</label>
                                <input 
                                    type="datetime-local" 
                                    className="input-field"
                                    value={editForm.created_at}
                                    onChange={e => setEditForm(p => ({ ...p, created_at: e.target.value }))}
                                />
                                <p className="text-[10px] text-slate-500 mt-1">Change this to backdate the user's registration.</p>
                            </div>

                            <div>
                                <label className="form-label">Status</label>
                                <select id="edit-status" className="select-field"
                                    value={editForm.status}
                                    onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}>
                                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                {editForm.status === 'ACTIVE' && editUser.status !== 'ACTIVE' && (
                                    <p className="text-xs mt-1" style={{ color: '#f59e0b' }}>
                                        ⚡ Activating will automatically distribute commissions to referrer, trainer, and leader.
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="form-label">Assign Trainer</label>
                                <select id="edit-trainer" className="select-field"
                                    value={editForm.trainer_id}
                                    onChange={e => setEditForm(p => ({ ...p, trainer_id: e.target.value }))}>
                                    <option value="">No Trainer</option>
                                    {trainers.map(t => <option key={t.id} value={t.id}>{t.full_name} ({t.whatsapp})</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="form-label">Assign Leader</label>
                                <select id="edit-leader" className="select-field"
                                    value={editForm.leader_id}
                                    onChange={e => setEditForm(p => ({ ...p, leader_id: e.target.value }))}>
                                    <option value="">No Leader</option>
                                    {leaders.map(l => <option key={l.id} value={l.id}>{l.full_name} ({l.whatsapp})</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="form-label">Assign to Team</label>
                                <select id="edit-team" className="select-field"
                                    value={editForm.team_id}
                                    onChange={e => setEditForm(p => ({ ...p, team_id: e.target.value }))}
                                    disabled={editForm.role === 'TEAM_LEADER'} // Leaders own a team implicitly
                                >
                                    <option value="">No Team</option>
                                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                                {editForm.role === 'TEAM_LEADER' && (
                                    <p className="text-[10px] mt-1 text-sky-400">Team Leaders automatically get their own team created.</p>
                                )}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button className="btn-primary flex-1" style={{ justifyContent: 'center' }}
                                    onClick={saveUser} disabled={saving}>
                                    {saving ? (
                                        <span className="flex items-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Saving...
                                        </span>
                                    ) : <><CheckCircle size={14} /> Save Changes</>}
                                </button>
                                <button className="btn-outline" style={{ padding: '0.625rem 1rem' }}
                                    onClick={() => setEditUser(null)}>
                                    Cancel
                                </button>
                            </div>

                            <div className="pt-4 border-t" style={{ borderColor: 'rgba(239, 68, 68, 0.1)' }}>
                                <button
                                    className="w-full py-2.5 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-all text-sm font-bold flex items-center justify-center gap-2"
                                    onClick={async () => {
                                        if (confirm(`Are you absolutely sure you want to delete ${editUser.full_name}? This action cannot be undone.`)) {
                                            setSaving(true);
                                            // Call the RPC function to delete account from both tables
                                            const { error } = await supabase.rpc('delete_user_by_admin', {
                                                target_user_id: editUser.id
                                            });

                                            if (error) {
                                                console.error('Delete error:', error);
                                                setMessage({ type: 'error', text: 'Failed to delete user. Make sure the SQL script is run.' });
                                            } else {
                                                setMessage({ type: 'success', text: 'User deleted successfully from system.' });
                                                load();
                                                setTimeout(() => setEditUser(null), 1200);
                                            }
                                            setSaving(false);
                                        }
                                    }}
                                    disabled={saving}
                                >
                                    <Trash2 size={16} /> Delete User Permanent
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Record Modal */}
            {recordUser && (
                <UserRecordModal user={recordUser} onClose={() => setRecordUser(null)} />
            )}
        </div>
    )
}
