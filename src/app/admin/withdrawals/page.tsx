'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDateTime, getStatusColor } from '@/lib/utils'
import { DollarSign, CheckCircle, AlertCircle, Clock, CreditCard, Plus, X, User, Calendar } from 'lucide-react'

const STATUS_FLOW = ['PENDING', 'APPROVED', 'PAID'] as const

export default function AdminWithdrawalsPage() {
    const supabase = createClient()
    const [withdrawals, setWithdrawals] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filterStatus, setFilterStatus] = useState('')
    const [updating, setUpdating] = useState<string | null>(null)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [showManualModal, setShowManualModal] = useState(false)
    const [users, setUsers] = useState<any[]>([])
    const [manualForm, setManualForm] = useState({
        user_id: '',
        amount: '',
        method: 'BKASH',
        account_number: '',
        created_at: new Date().toISOString().slice(0, 16) // Default to now (YYYY-MM-DDTHH:mm)
    })
    const [savingManual, setSavingManual] = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        let q = supabase
            .from('withdraw_requests')
            .select('*, users:user_id(full_name, whatsapp, email)')
            .order('created_at', { ascending: false })
        if (filterStatus) q = q.eq('status', filterStatus)
        const { data } = await q
        setWithdrawals(data || [])
        setLoading(false)
    }, [filterStatus])

    useEffect(() => { load() }, [load])

    const updateStatus = async (id: string, newStatus: string) => {
        setUpdating(id)
        setMessage({ type: '', text: '' })
        const { error } = await supabase
            .from('withdraw_requests')
            .update({ status: newStatus })
            .eq('id', id)

        if (error) {
            setMessage({ type: 'error', text: 'Failed to update status.' })
        } else {
            setMessage({ type: 'success', text: `Withdrawal marked as ${newStatus}.` })
            load()
        }
        setUpdating(null)
    }

    const loadUsers = async () => {
        const { data } = await supabase
            .from('users')
            .select('id, full_name, whatsapp')
            .order('full_name')
        setUsers(data || [])
    }

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSavingManual(true)
        setMessage({ type: '', text: '' })

        const { error } = await supabase
            .from('withdraw_requests')
            .insert({
                user_id: manualForm.user_id,
                amount: parseFloat(manualForm.amount),
                method: manualForm.method,
                account_number: manualForm.account_number,
                status: 'PAID',
                created_at: new Date(manualForm.created_at).toISOString()
            })

        if (error) {
            setMessage({ type: 'error', text: 'Failed to add manual payment.' })
        } else {
            setMessage({ type: 'success', text: 'Manual payment added successfully.' })
            setShowManualModal(false)
            setManualForm({
                user_id: '',
                amount: '',
                method: 'BKASH',
                account_number: '',
                created_at: new Date().toISOString().slice(0, 16)
            })
            load()
        }
        setSavingManual(false)
    }

    const pending = withdrawals.filter(w => w.status === 'PENDING')
    const approved = withdrawals.filter(w => w.status === 'APPROVED')
    const paid = withdrawals.filter(w => w.status === 'PAID')
    const totalPending = pending.reduce((s, w) => s + w.amount, 0)
    const totalPaid = paid.reduce((s, w) => s + w.amount, 0)

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="page-header flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>Withdrawal Requests</h1>
                    <p className="text-sm mt-1" style={{ color: '#64748b' }}>Review and process member withdrawal requests</p>
                </div>
                <button
                    className="btn-primary"
                    onClick={() => {
                        loadUsers()
                        setShowManualModal(true)
                    }}
                >
                    <Plus size={16} /> Add Manual Payment
                </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Pending', value: pending.length, sub: formatCurrency(totalPending), color: '#f59e0b' },
                    { label: 'Approved', value: approved.length, sub: '', color: '#0ea5e9' },
                    { label: 'Paid', value: paid.length, sub: formatCurrency(totalPaid), color: '#10b981' },
                    { label: 'Total Requests', value: withdrawals.length, sub: '', color: '#8b5cf6' },
                ].map(s => (
                    <div key={s.label} className="stat-card">
                        <div className="text-xs font-semibold mb-2 uppercase" style={{ color: '#64748b' }}>{s.label}</div>
                        <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                        {s.sub && <div className="text-xs mt-1" style={{ color: '#64748b' }}>{s.sub}</div>}
                    </div>
                ))}
            </div>

            {message.text && (
                <div className={message.type === 'success' ? 'alert-success' : 'alert-error'}>
                    {message.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                    {message.text}
                </div>
            )}

            {/* Pending Requests — highlighted */}
            {pending.length > 0 && (
                <div className="glass-card overflow-hidden" style={{ borderColor: 'rgba(245,158,11,0.4)' }}>
                    <div className="p-5 border-b flex items-center gap-2"
                        style={{ borderColor: '#1e3a5f', background: 'rgba(245,158,11,0.05)' }}>
                        <Clock size={18} style={{ color: '#f59e0b' }} />
                        <h2 className="font-bold" style={{ color: '#f59e0b' }}>Pending Requests ({pending.length})</h2>
                    </div>
                    <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Member</th>
                                    <th>Amount</th>
                                    <th>Method</th>
                                    <th>Account No.</th>
                                    <th>Submitted</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pending.map(w => (
                                    <tr key={w.id}>
                                        <td>
                                            <div className="font-medium" style={{ color: '#e2e8f0' }}>{w.users?.full_name}</div>
                                            <div className="text-xs" style={{ color: '#64748b' }}>{w.users?.whatsapp}</div>
                                        </td>
                                        <td className="font-bold" style={{ color: '#10b981' }}>{formatCurrency(w.amount)}</td>
                                        <td>
                                            <span className="badge text-cyan-400 bg-cyan-400/10">{w.method}</span>
                                        </td>
                                        <td className="font-mono text-xs" style={{ color: '#94a3b8' }}>{w.account_number}</td>
                                        <td style={{ color: '#64748b', fontSize: '0.75rem' }}>{formatDateTime(w.created_at)}</td>
                                        <td>
                                            <div className="flex gap-2">
                                                <button
                                                    id={`approve-wd-${w.id}`}
                                                    className="btn-outline"
                                                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem' }}
                                                    onClick={() => updateStatus(w.id, 'APPROVED')}
                                                    disabled={updating === w.id}>
                                                    <CheckCircle size={12} /> Approve
                                                </button>
                                                <button
                                                    id={`pay-wd-${w.id}`}
                                                    className="btn-accent"
                                                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem' }}
                                                    onClick={() => updateStatus(w.id, 'PAID')}
                                                    disabled={updating === w.id}>
                                                    <DollarSign size={12} /> Mark Paid
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Filter + Full History */}
            <div className="glass-card overflow-hidden">
                <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: '#1e3a5f' }}>
                    <h2 className="section-title" style={{ fontSize: '1rem' }}>
                        <CreditCard size={18} style={{ color: '#0ea5e9' }} />
                        All Withdrawal Records
                    </h2>
                    <select id="wd-filter-status" className="select-field" style={{ width: 'auto', minWidth: '140px' }}
                        value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        <option value="">All Statuses</option>
                        {STATUS_FLOW.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                {loading ? (
                    <div className="p-8 text-center" style={{ color: '#64748b' }}>Loading...</div>
                ) : (
                    <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Member</th>
                                    <th>Amount</th>
                                    <th>Method</th>
                                    <th>Account</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {withdrawals.length === 0 ? (
                                    <tr><td colSpan={7} className="py-8 text-center" style={{ color: '#64748b' }}>No withdrawal requests yet.</td></tr>
                                ) : withdrawals.map(w => (
                                    <tr key={w.id}>
                                        <td>
                                            <div className="font-medium" style={{ color: '#e2e8f0', fontSize: '0.85rem' }}>{w.users?.full_name}</div>
                                            <div className="text-xs" style={{ color: '#64748b' }}>{w.users?.whatsapp}</div>
                                        </td>
                                        <td className="font-semibold" style={{ color: '#10b981' }}>{formatCurrency(w.amount)}</td>
                                        <td style={{ color: '#94a3b8' }}>{w.method}</td>
                                        <td className="font-mono text-xs" style={{ color: '#94a3b8' }}>{w.account_number}</td>
                                        <td><span className={`badge ${getStatusColor(w.status)}`}>{w.status}</span></td>
                                        <td style={{ color: '#64748b', fontSize: '0.72rem' }}>{formatDateTime(w.created_at)}</td>
                                        <td>
                                            {w.status === 'PENDING' && (
                                                <button className="btn-accent" style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
                                                    onClick={() => updateStatus(w.id, 'APPROVED')} disabled={updating === w.id}>
                                                    Approve
                                                </button>
                                            )}
                                            {w.status === 'APPROVED' && (
                                                <button className="btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
                                                    onClick={() => updateStatus(w.id, 'PAID')} disabled={updating === w.id}>
                                                    Mark Paid
                                                </button>
                                            )}
                                            {w.status === 'PAID' && (
                                                <span className="text-xs" style={{ color: '#10b981' }}>✓ Completed</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Manual Payment Modal */}
            {showManualModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
                    <div className="glass-card p-6 w-full max-w-md animate-scale-in" style={{ background: '#0d1530' }}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: '#e2e8f0' }}>
                                <DollarSign size={20} className="text-emerald-500" />
                                Add Manual Payment
                            </h2>
                            <button onClick={() => setShowManualModal(false)} style={{ color: '#64748b' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleManualSubmit} className="space-y-4">
                            <div>
                                <label className="form-label flex items-center gap-2">
                                    <User size={14} /> Select Member *
                                </label>
                                <select
                                    className="select-field"
                                    value={manualForm.user_id}
                                    onChange={e => setManualForm(p => ({ ...p, user_id: e.target.value }))}
                                    required
                                >
                                    <option value="">Choose a member...</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>
                                            {u.full_name} ({u.whatsapp})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="form-label">Amount (৳) *</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        placeholder="0.00"
                                        value={manualForm.amount}
                                        onChange={e => setManualForm(p => ({ ...p, amount: e.target.value }))}
                                        required
                                        min="1"
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Method *</label>
                                    <select
                                        className="select-field"
                                        value={manualForm.method}
                                        onChange={e => setManualForm(p => ({ ...p, method: e.target.value }))}
                                        required
                                    >
                                        <option value="BKASH">BKASH</option>
                                        <option value="NAGAD">NAGAD</option>
                                        <option value="ROCKET">ROCKET</option>
                                        <option value="BANK">BANK</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="form-label">Account Number *</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Account or phone number"
                                    value={manualForm.account_number}
                                    onChange={e => setManualForm(p => ({ ...p, account_number: e.target.value }))}
                                    required
                                />
                            </div>

                            <div>
                                <label className="form-label flex items-center gap-2">
                                    <Calendar size={14} /> Date & Time *
                                </label>
                                <input
                                    type="datetime-local"
                                    className="input-field"
                                    value={manualForm.created_at}
                                    onChange={e => setManualForm(p => ({ ...p, created_at: e.target.value }))}
                                    required
                                />
                                <p className="text-[10px] mt-1 text-slate-500">
                                    This date will be shown in the member&apos;s history.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="btn-primary flex-1"
                                    style={{ justifyContent: 'center' }}
                                    disabled={savingManual}
                                >
                                    {savingManual ? 'Saving...' : 'Add Payment Record'}
                                </button>
                                <button
                                    type="button"
                                    className="btn-outline"
                                    onClick={() => setShowManualModal(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
