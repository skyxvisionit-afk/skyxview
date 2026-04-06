'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, DollarSign, Search, CheckCircle, Plus, History, Edit, Trash2, X, Calendar, User } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function AdminManagePassbook() {
    const supabase = createClient()
    const [users, setUsers] = useState<any[]>([])
    const [commissions, setCommissions] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [editingRecord, setEditingRecord] = useState<any>(null)

    const [form, setForm] = useState({
        userId: '',
        amount: '',
        type: 'BONUS',
        sourceUserId: '',
        date: new Date().toISOString().slice(0, 16)
    })

    useEffect(() => {
        loadData()
        loadCommissions()
    }, [])

    const loadData = async () => {
        const { data } = await supabase
            .from('users')
            .select('id, full_name, whatsapp, status, role')
            .order('created_at', { ascending: false })
        if (data) setUsers(data)
    }

    const loadCommissions = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('commissions')
            .select(`
                *,
                user:user_id(full_name, whatsapp),
                source_user:source_user_id(full_name, whatsapp)
            `)
            .order('created_at', { ascending: false })
            .limit(100)
        
        if (!error && data) setCommissions(data)
        setLoading(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage({ type: '', text: '' })
        if (!form.userId) return setMessage({ type: 'error', text: 'Please select a receiving user.' })
        
        setSubmitting(true)
        const payload = {
            user_id: form.userId,
            amount: Number(form.amount),
            type: form.type,
            source_user_id: form.sourceUserId || null,
            created_at: new Date(form.date).toISOString()
        }

        const { error } = await supabase.from('commissions').insert(payload)
        if (error) {
            setMessage({ type: 'error', text: `Failed: ${error.message}` })
        } else {
            setMessage({ type: 'success', text: `Successfully added ${form.amount} TK to passbook!` })
            setForm({ ...form, amount: '', sourceUserId: '' })
            loadCommissions()
        }
        setSubmitting(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this transaction?')) return
        const { error } = await supabase.from('commissions').delete().eq('id', id)
        if (!error) {
            setCommissions(commissions.filter(c => c.id !== id))
            setMessage({ type: 'success', text: 'Transaction deleted successfully.' })
        }
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        const { error } = await supabase
            .from('commissions')
            .update({
                amount: Number(editingRecord.amount),
                type: editingRecord.type,
                created_at: new Date(editingRecord.created_at).toISOString()
            })
            .eq('id', editingRecord.id)

        if (!error) {
            setMessage({ type: 'success', text: 'Transaction updated successfully.' })
            setEditingRecord(null)
            loadCommissions()
        } else {
            alert(error.message)
        }
        setSubmitting(false)
    }

    const filteredUsers = users.filter(u => 
        u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.whatsapp?.includes(searchQuery)
    )

    return (
        <div className="space-y-6 animate-fade-in-up pb-20">
            <div className="page-header border-b border-slate-800 pb-5">
                <h1 className="text-2xl font-bold flex items-center gap-3 text-emerald-400">
                    <BookOpen size={24} /> Manage Passbook
                </h1>
                <p className="text-sm mt-1 text-slate-400">Manage income logs, modify transaction dates, and correct entries</p>
            </div>

            {message.text && (
                <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                    message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                    <CheckCircle size={20} />
                    <p className="font-semibold text-sm">{message.text}</p>
                    <button onClick={() => setMessage({type:'', text:''})} className="ml-auto opacity-50 hover:opacity-100"><X size={16}/></button>
                </div>
            )}

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Form Section */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Plus size={18} className="text-emerald-400" />
                        Add Manual Payment
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Receiving User <span className="text-red-500">*</span></label>
                            <select 
                                required
                                value={form.userId}
                                onChange={e => setForm({...form, userId: e.target.value})}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-emerald-500/50"
                            >
                                <option value="" disabled>Select a user to receive income</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.full_name} ({u.whatsapp})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Transaction Date & Time</label>
                            <input type="datetime-local" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Amount (TK)</label>
                                <input required type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Type</label>
                                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 uppercase">
                                    <option value="BONUS">System Bonus</option>
                                    <option value="REFERRAL">Referral Income</option>
                                    <option value="TASK">General Task</option>
                                    <option value="PHOTO_EDITING">Photo Editing</option>
                                    <option value="VIDEO_EDITING">Video Editing</option>
                                    <option value="GRAPHIC_DESIGN">Graphic Design</option>
                                    <option value="FORM_FILLUP">Form Fillup</option>
                                    <option value="MANUAL">Manual</option>
                                </select>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={submitting}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl py-3.5 transition-all disabled:opacity-50"
                        >
                            {submitting ? 'Processing...' : 'Add to Passbook'}
                        </button>
                    </form>
                </div>

                {/* Search Aid */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 h-[480px] flex flex-col">
                    <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Search size={18} className="text-sky-400" /> Find User
                    </h2>
                    <input type="text" placeholder="Search users..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 mb-4" />
                    <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                        {filteredUsers.slice(0, 30).map(u => (
                            <div key={u.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between hover:border-slate-600 cursor-pointer" onClick={() => setForm({...form, userId: u.id})}>
                                <div>
                                    <div className="font-bold text-sm text-slate-200">{u.full_name}</div>
                                    <div className="text-[10px] text-slate-500">{u.whatsapp}</div>
                                </div>
                                <Plus size={14} className="text-emerald-500" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Transactions List */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden mt-10">
                <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <History size={18} className="text-emerald-400" />
                        Recent Passbook Transactions
                    </h2>
                    <button onClick={loadCommissions} className="text-xs text-sky-400 hover:underline">Refresh List</button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-950/50 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                            <tr>
                                <th className="px-6 py-4">User Details</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {commissions.map(c => (
                                <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-200 text-sm">{c.user?.full_name}</div>
                                        <div className="text-[10px] text-slate-500">{c.user?.whatsapp}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400">
                                            {c.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-emerald-400">{formatCurrency(c.amount)}</td>
                                    <td className="px-6 py-4 text-xs text-slate-500">{formatDate(c.created_at)}</td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button onClick={() => setEditingRecord({...c, created_at: c.created_at.slice(0, 16)})} className="p-2 bg-sky-500/10 text-sky-400 rounded-lg hover:bg-sky-500/20"><Edit size={14}/></button>
                                        <button onClick={() => handleDelete(c.id)} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20"><Trash2 size={14}/></button>
                                    </td>
                                </tr>
                            ))}
                            {commissions.length === 0 && !loading && (
                                <tr><td colSpan={5} className="p-10 text-center text-slate-500">No transactions found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal Overlay */}
            {editingRecord && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 animate-scale-in">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Edit size={18} className="text-sky-400" /> Edit Transaction
                            </h3>
                            <button onClick={() => setEditingRecord(null)} className="text-slate-500 hover:text-white"><X size={20}/></button>
                        </div>
                        
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-400 font-bold">
                                    {editingRecord.user?.full_name?.charAt(0)}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white">{editingRecord.user?.full_name}</div>
                                    <div className="text-xs text-slate-500">{editingRecord.user?.whatsapp}</div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Modify Amount</label>
                                <input type="number" value={editingRecord.amount} onChange={e => setEditingRecord({...editingRecord, amount: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Backdate Transaction</label>
                                <input type="datetime-local" value={editingRecord.created_at} onChange={e => setEditingRecord({...editingRecord, created_at: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                                <select value={editingRecord.type} onChange={e => setEditingRecord({...editingRecord, type: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white">
                                    <option value="BONUS">BONUS</option>
                                    <option value="REFERRAL">REFERRAL</option>
                                    <option value="TASK">TASK</option>
                                    <option value="PHOTO_EDITING">PHOTO_EDITING</option>
                                    <option value="VIDEO_EDITING">VIDEO_EDITING</option>
                                    <option value="GRAPHIC_DESIGN">GRAPHIC_DESIGN</option>
                                    <option value="MANUAL">MANUAL</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setEditingRecord(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all">Cancel</button>
                                <button type="submit" disabled={submitting} className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-sky-500/20">
                                    {submitting ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
