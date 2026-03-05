'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Bell, Send, Users, UserCircle, Trash2,
    CheckCircle, AlertCircle, Info, AlertTriangle,
    Search, Filter, Megaphone
} from 'lucide-react'
import { formatDateTime, cn } from '@/lib/utils'

interface Notification {
    id: string
    title: string
    message: string
    type: string
    target_type: string
    target_role: string | null
    target_user_id: string | null
    created_at: string
    target_user?: { full_name: string } | null
}

interface UserOption {
    id: string
    full_name: string
    whatsapp: string
    role: string
}

const typeOptions = [
    { value: 'info', label: 'Info', icon: Info, color: '#0ea5e9' },
    { value: 'success', label: 'Success', icon: CheckCircle, color: '#10b981' },
    { value: 'warning', label: 'Warning', icon: AlertTriangle, color: '#f59e0b' },
    { value: 'danger', label: 'Danger', icon: AlertCircle, color: '#ef4444' },
]

export default function AdminNotificationsPage() {
    const supabase = createClient()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [users, setUsers] = useState<UserOption[]>([])
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [searchUser, setSearchUser] = useState('')

    const [form, setForm] = useState({
        title: '',
        message: '',
        type: 'info',
        target_type: 'all',     // all | role | user
        target_role: '',
        target_user_id: '',
    })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)

        // Load existing notifications
        const { data: nots } = await supabase
            .from('notifications')
            .select('*, target_user:target_user_id(full_name)')
            .order('created_at', { ascending: false })
            .limit(50)

        // Load users for target selection
        const { data: usersList } = await supabase
            .from('users')
            .select('id, full_name, whatsapp, role')
            .order('full_name')

        setNotifications((nots || []) as Notification[])
        setUsers(usersList || [])
        setLoading(false)
    }

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.title.trim() || !form.message.trim()) {
            setMessage({ type: 'error', text: 'Title and message are required.' })
            return
        }

        setSending(true)
        setMessage({ type: '', text: '' })

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const payload: Record<string, unknown> = {
            title: form.title.trim(),
            message: form.message.trim(),
            type: form.type,
            target_type: form.target_type,
            sender_id: user.id,
        }

        if (form.target_type === 'role' && form.target_role) {
            payload.target_role = form.target_role
        }
        if (form.target_type === 'user' && form.target_user_id) {
            payload.target_user_id = form.target_user_id
        }

        const { error } = await supabase.from('notifications').insert(payload)

        if (error) {
            console.error('Send error:', error)
            setMessage({ type: 'error', text: 'Failed to send notification. Run the SQL script first.' })
        } else {
            setMessage({ type: 'success', text: 'Notification sent successfully!' })
            setForm({ title: '', message: '', type: 'info', target_type: 'all', target_role: '', target_user_id: '' })
            loadData()
        }
        setSending(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this notification?')) return
        await supabase.from('notifications').delete().eq('id', id)
        loadData()
    }

    const getTypeIcon = (type: string) => {
        const opt = typeOptions.find(t => t.value === type)
        if (!opt) return <Info size={16} style={{ color: '#0ea5e9' }} />
        return <opt.icon size={16} style={{ color: opt.color }} />
    }

    const getTargetLabel = (n: Notification) => {
        if (n.target_type === 'all') return 'All Users'
        if (n.target_type === 'role') return n.target_role?.replace('_', ' ') || 'Role'
        if (n.target_type === 'user') return n.target_user?.full_name || 'Specific User'
        return n.target_type
    }

    const filteredUsers = users.filter(u =>
        u.full_name.toLowerCase().includes(searchUser.toLowerCase()) ||
        u.whatsapp.includes(searchUser)
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-fade-in-up pb-10">
            {/* Header */}
            <div className="page-header">
                <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-slate-500">Admin Control</p>
                <h1 className="text-2xl font-black tracking-tight" style={{ color: '#e2e8f0' }}>
                    <span className="gradient-text">Notifications</span> Center
                </h1>
                <p className="text-sm mt-1" style={{ color: '#64748b' }}>Send notifications to users, trainers, or team leaders.</p>
            </div>

            <div className="grid lg:grid-cols-5 gap-8">
                {/* Send Notification Form */}
                <div className="lg:col-span-2">
                    <div className="glass-card p-6 sticky top-24">
                        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <Megaphone size={20} className="text-sky-400" />
                            Send Notification
                        </h2>

                        {message.text && (
                            <div className={cn("alert mb-4", message.type === 'success' ? "alert-success" : "alert-error")}>
                                {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleSend} className="space-y-5">
                            {/* Title */}
                            <div>
                                <label className="form-label">Title *</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Notification title..."
                                    value={form.title}
                                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                    required
                                />
                            </div>

                            {/* Message */}
                            <div>
                                <label className="form-label">Message *</label>
                                <textarea
                                    className="input-field min-h-[100px] py-3"
                                    placeholder="Write your notification message..."
                                    value={form.message}
                                    onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                                    required
                                />
                            </div>

                            {/* Type Selection */}
                            <div>
                                <label className="form-label">Type</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {typeOptions.map(opt => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setForm(p => ({ ...p, type: opt.value }))}
                                            className={cn(
                                                "py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all",
                                                form.type === opt.value
                                                    ? "border-sky-500/50 bg-sky-500/10 text-white"
                                                    : "border-white/5 bg-slate-800/50 text-slate-400 hover:bg-slate-800"
                                            )}
                                        >
                                            <opt.icon size={16} style={{ color: opt.color }} />
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Target Selection */}
                            <div>
                                <label className="form-label">Send To</label>
                                <div className="grid grid-cols-3 gap-2 mb-3">
                                    {[
                                        { value: 'all', label: 'All Users', icon: Users },
                                        { value: 'role', label: 'By Role', icon: Filter },
                                        { value: 'user', label: 'One User', icon: UserCircle },
                                    ].map(opt => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setForm(p => ({ ...p, target_type: opt.value, target_role: '', target_user_id: '' }))}
                                            className={cn(
                                                "py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all",
                                                form.target_type === opt.value
                                                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                                                    : "border-white/5 bg-slate-800/50 text-slate-400 hover:bg-slate-800"
                                            )}
                                        >
                                            <opt.icon size={14} />
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Role Selector */}
                                {form.target_type === 'role' && (
                                    <select
                                        className="select-field"
                                        value={form.target_role}
                                        onChange={e => setForm(p => ({ ...p, target_role: e.target.value }))}
                                        required
                                    >
                                        <option value="">Select Role...</option>
                                        <option value="MEMBER">Members</option>
                                        <option value="TEAM_TRAINER">Trainers</option>
                                        <option value="TEAM_LEADER">Team Leaders</option>
                                    </select>
                                )}

                                {/* User Selector */}
                                {form.target_type === 'user' && (
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                            <input
                                                type="text"
                                                className="input-field pl-9 text-xs"
                                                placeholder="Search by name or WhatsApp..."
                                                value={searchUser}
                                                onChange={e => setSearchUser(e.target.value)}
                                            />
                                        </div>
                                        <div className="max-h-40 overflow-y-auto space-y-1 scrollbar-hide">
                                            {filteredUsers.slice(0, 20).map(u => (
                                                <button
                                                    key={u.id}
                                                    type="button"
                                                    onClick={() => setForm(p => ({ ...p, target_user_id: u.id }))}
                                                    className={cn(
                                                        "w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-all",
                                                        form.target_user_id === u.id
                                                            ? "bg-sky-500/10 border border-sky-500/30 text-white"
                                                            : "bg-slate-800/50 border border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-300"
                                                    )}
                                                >
                                                    <span>{u.full_name}</span>
                                                    <span className="text-[10px] text-slate-600">{u.whatsapp}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Send Button */}
                            <button
                                type="submit"
                                className="btn-accent w-full py-3"
                                style={{ justifyContent: 'center' }}
                                disabled={sending}
                            >
                                {sending ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Sending...
                                    </span>
                                ) : (
                                    <><Send size={16} /> Send Notification</>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Sent Notifications List */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Bell size={18} className="text-sky-400" />
                            Sent Notifications
                        </h2>
                        <span className="text-xs font-bold text-slate-500 bg-slate-800 px-3 py-1 rounded-lg">
                            {notifications.length} total
                        </span>
                    </div>

                    {notifications.length === 0 ? (
                        <div className="glass-card p-12 text-center">
                            <Bell size={48} className="mx-auto text-slate-700 mb-4" />
                            <p className="text-slate-500 font-medium">No notifications sent yet.</p>
                            <p className="text-xs text-slate-600 mt-1">Use the form to send your first notification.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {notifications.map(n => (
                                <div key={n.id} className="glass-card p-5 hover:border-sky-500/10 transition-all group">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <div className="mt-0.5 flex-shrink-0">
                                                {getTypeIcon(n.type)}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <h3 className="text-sm font-bold text-white truncate">{n.title}</h3>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 flex-shrink-0">
                                                        {getTargetLabel(n)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{n.message}</p>
                                                <p className="text-[10px] text-slate-600 mt-2">{formatDateTime(n.created_at)}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(n.id)}
                                            className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
