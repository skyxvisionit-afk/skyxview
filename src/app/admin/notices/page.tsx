'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Bell, Plus, Trash2, Edit2, CheckCircle, AlertCircle, Info,
    AlertTriangle, Pin, PinOff, Eye, EyeOff, Save, X,
    Video, Clock, ExternalLink, Calendar, RefreshCw, BookOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Notice {
    id: string
    title: string
    content: string
    type: string
    is_pinned: boolean
    is_active: boolean
    created_at: string
    updated_at: string
}

interface ClassSchedule {
    id: string
    title: string
    teacher_name: string
    description: string | null
    meet_link: string
    start_time: string
    end_time: string
    is_recurring: boolean
    recurrence: string | null
    is_active: boolean
    created_at: string
}

type ActiveTab = 'notices' | 'classes'

const noticeTypes = [
    { value: 'info', label: 'Info', icon: Info, color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)', border: 'rgba(14,165,233,0.3)' },
    { value: 'success', label: 'Success', icon: CheckCircle, color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)' },
    { value: 'warning', label: 'Warning', icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
    { value: 'danger', label: 'Urgent', icon: AlertCircle, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)' },
]

function formatDateTime(dt: string) {
    return new Date(dt).toLocaleString('en-BD', {
        timeZone: 'Asia/Dhaka',
        dateStyle: 'medium',
        timeStyle: 'short',
    })
}

function getTypeConfig(type: string) {
    return noticeTypes.find(t => t.value === type) || noticeTypes[0]
}

function getClassStatus(start: string, end: string) {
    const now = new Date()
    const startDt = new Date(start)
    const endDt = new Date(end)
    if (now < startDt) return { label: 'Upcoming', color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)' }
    if (now >= startDt && now <= endDt) return { label: 'LIVE NOW', color: '#10b981', bg: 'rgba(16,185,129,0.15)', pulse: true }
    return { label: 'Ended', color: '#64748b', bg: 'rgba(100,116,139,0.1)' }
}

export default function AdminNoticesPage() {
    const supabase = createClient()
    const [activeTab, setActiveTab] = useState<ActiveTab>('notices')
    const [notices, setNotices] = useState<Notice[]>([])
    const [classes, setClasses] = useState<ClassSchedule[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [msg, setMsg] = useState({ type: '', text: '' })

    // Notice form
    const [showNoticeForm, setShowNoticeForm] = useState(false)
    const [editingNotice, setEditingNotice] = useState<Notice | null>(null)
    const [noticeForm, setNoticeForm] = useState({
        title: '', content: '', type: 'info', is_pinned: false
    })

    // Class form
    const [showClassForm, setShowClassForm] = useState(false)
    const [editingClass, setEditingClass] = useState<ClassSchedule | null>(null)
    const [classForm, setClassForm] = useState({
        title: '', teacher_name: '', description: '', meet_link: '',
        start_time: '', end_time: '', is_recurring: false, recurrence: 'weekly'
    })

    useEffect(() => { loadData() }, [])

    const loadData = async () => {
        setLoading(true)
        const [{ data: n }, { data: c }] = await Promise.all([
            supabase.from('notices').select('*').order('is_pinned', { ascending: false }).order('created_at', { ascending: false }),
            supabase.from('class_schedules').select('*').order('start_time', { ascending: true }),
        ])
        setNotices(n || [])
        setClasses(c || [])
        setLoading(false)
    }

    const showMsg = (type: string, text: string) => {
        setMsg({ type, text })
        setTimeout(() => setMsg({ type: '', text: '' }), 3000)
    }

    // ── NOTICE ACTIONS ──────────────────────────────────────────
    const openNoticeCreate = () => {
        setEditingNotice(null)
        setNoticeForm({ title: '', content: '', type: 'info', is_pinned: false })
        setShowNoticeForm(true)
    }

    const openNoticeEdit = (n: Notice) => {
        setEditingNotice(n)
        setNoticeForm({ title: n.title, content: n.content, type: n.type, is_pinned: n.is_pinned })
        setShowNoticeForm(true)
    }

    const saveNotice = async () => {
        if (!noticeForm.title.trim() || !noticeForm.content.trim()) {
            showMsg('error', 'Title and content are required.')
            return
        }
        setSaving(true)
        const { data: { user } } = await supabase.auth.getUser()
        const payload = { ...noticeForm, created_by: user?.id }

        if (editingNotice) {
            const { error } = await supabase.from('notices').update(noticeForm).eq('id', editingNotice.id)
            if (error) showMsg('error', 'Failed to update notice.')
            else { showMsg('success', 'Notice updated!'); setShowNoticeForm(false); loadData() }
        } else {
            const { error } = await supabase.from('notices').insert(payload)
            if (error) showMsg('error', 'Failed to create notice.')
            else { showMsg('success', 'Notice created!'); setShowNoticeForm(false); loadData() }
        }
        setSaving(false)
    }

    const toggleNoticeActive = async (id: string, current: boolean) => {
        await supabase.from('notices').update({ is_active: !current }).eq('id', id)
        loadData()
    }

    const toggleNoticePinned = async (id: string, current: boolean) => {
        await supabase.from('notices').update({ is_pinned: !current }).eq('id', id)
        loadData()
    }

    const deleteNotice = async (id: string) => {
        if (!confirm('Delete this notice?')) return
        await supabase.from('notices').delete().eq('id', id)
        loadData()
    }

    // ── CLASS ACTIONS ────────────────────────────────────────────
    const getLocalDateTimeStr = (dt?: string) => {
        if (!dt) {
            const now = new Date()
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
            return now.toISOString().slice(0, 16)
        }
        const d = new Date(dt)
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
        return d.toISOString().slice(0, 16)
    }

    const openClassCreate = () => {
        setEditingClass(null)
        const now = new Date()
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
        const later = new Date(now.getTime() + 60 * 60 * 1000)
        later.setMinutes(later.getMinutes() - later.getTimezoneOffset())
        setClassForm({
            title: '', teacher_name: '', description: '', meet_link: '',
            start_time: now.toISOString().slice(0, 16),
            end_time: later.toISOString().slice(0, 16),
            is_recurring: false, recurrence: 'weekly'
        })
        setShowClassForm(true)
    }

    const openClassEdit = (c: ClassSchedule) => {
        setEditingClass(c)
        setClassForm({
            title: c.title, teacher_name: c.teacher_name, description: c.description || '',
            meet_link: c.meet_link,
            start_time: getLocalDateTimeStr(c.start_time),
            end_time: getLocalDateTimeStr(c.end_time),
            is_recurring: c.is_recurring, recurrence: c.recurrence || 'weekly'
        })
        setShowClassForm(true)
    }

    const saveClass = async () => {
        if (!classForm.title.trim() || !classForm.teacher_name.trim() || !classForm.meet_link.trim()) {
            showMsg('error', 'Title, teacher name, and Meet link are required.')
            return
        }
        if (!classForm.start_time || !classForm.end_time) {
            showMsg('error', 'Start and end times are required.')
            return
        }
        setSaving(true)
        const { data: { user } } = await supabase.auth.getUser()
        const payload = {
            title: classForm.title.trim(),
            teacher_name: classForm.teacher_name.trim(),
            description: classForm.description.trim() || null,
            meet_link: classForm.meet_link.trim(),
            start_time: new Date(classForm.start_time).toISOString(),
            end_time: new Date(classForm.end_time).toISOString(),
            is_recurring: classForm.is_recurring,
            recurrence: classForm.is_recurring ? classForm.recurrence : null,
            created_by: user?.id,
        }

        if (editingClass) {
            const { error } = await supabase.from('class_schedules').update(payload).eq('id', editingClass.id)
            if (error) showMsg('error', 'Failed to update class.')
            else { showMsg('success', 'Class updated!'); setShowClassForm(false); loadData() }
        } else {
            const { error } = await supabase.from('class_schedules').insert(payload)
            if (error) showMsg('error', 'Failed to create class.')
            else { showMsg('success', 'Class created!'); setShowClassForm(false); loadData() }
        }
        setSaving(false)
    }

    const toggleClassActive = async (id: string, current: boolean) => {
        await supabase.from('class_schedules').update({ is_active: !current }).eq('id', id)
        loadData()
    }

    const deleteClass = async (id: string) => {
        if (!confirm('Delete this class schedule?')) return
        await supabase.from('class_schedules').delete().eq('id', id)
        loadData()
    }

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
        </div>
    )

    return (
        <div className="space-y-8 animate-fade-in-up pb-10">
            {/* Header */}
            <div className="page-header">
                <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-slate-500">Admin Control</p>
                <h1 className="text-2xl font-black tracking-tight" style={{ color: '#e2e8f0' }}>
                    <span className="gradient-text">Notice Panel</span> Management
                </h1>
                <p className="text-sm mt-1" style={{ color: '#64748b' }}>
                    Manage important notices and class schedules for all users.
                </p>
            </div>

            {/* Global message */}
            {msg.text && (
                <div className={cn('alert', msg.type === 'success' ? 'alert-success' : 'alert-error')}>
                    {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    {msg.text}
                </div>
            )}

            {/* Tab Navigation */}
            <div className="flex gap-2 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <button
                    onClick={() => setActiveTab('notices')}
                    className={cn(
                        'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all',
                        activeTab === 'notices'
                            ? 'bg-gradient-to-r from-sky-600 to-sky-500 text-white shadow-lg'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                    )}
                >
                    <Bell size={16} />
                    Important Notices
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{
                        background: activeTab === 'notices' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)'
                    }}>
                        {notices.length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('classes')}
                    className={cn(
                        'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all',
                        activeTab === 'classes'
                            ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                    )}
                >
                    <Video size={16} />
                    Class Schedules
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{
                        background: activeTab === 'classes' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)'
                    }}>
                        {classes.length}
                    </span>
                </button>
            </div>

            {/* ─── NOTICES TAB ───────────────────────────────────────── */}
            {activeTab === 'notices' && (
                <div className="space-y-5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Bell size={18} className="text-sky-400" />
                            All Notices
                        </h2>
                        <button onClick={openNoticeCreate} className="btn-accent py-2 px-4 text-sm">
                            <Plus size={16} /> Add Notice
                        </button>
                    </div>

                    {/* Notice Form Modal */}
                    {showNoticeForm && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
                            <div className="w-full max-w-lg glass-card p-6 animate-fade-in-up">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-white">
                                        {editingNotice ? 'Edit Notice' : 'Create Notice'}
                                    </h3>
                                    <button onClick={() => setShowNoticeForm(false)} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {/* Type */}
                                    <div>
                                        <label className="form-label">Notice Type</label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {noticeTypes.map(t => (
                                                <button key={t.value} type="button" onClick={() => setNoticeForm(p => ({ ...p, type: t.value }))}
                                                    className={cn('py-2.5 px-2 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all',
                                                        noticeForm.type === t.value
                                                            ? 'border-opacity-50 text-white'
                                                            : 'border-white/5 bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                                                    )}
                                                    style={noticeForm.type === t.value ? { borderColor: t.border, background: t.bg } : {}}
                                                >
                                                    <t.icon size={16} style={{ color: t.color }} />
                                                    {t.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <div>
                                        <label className="form-label">Title *</label>
                                        <input type="text" className="input-field" placeholder="Notice title..."
                                            value={noticeForm.title}
                                            onChange={e => setNoticeForm(p => ({ ...p, title: e.target.value }))} />
                                    </div>

                                    {/* Content */}
                                    <div>
                                        <label className="form-label">Content *</label>
                                        <textarea className="input-field min-h-[120px] py-3" placeholder="Write the notice content..."
                                            value={noticeForm.content}
                                            onChange={e => setNoticeForm(p => ({ ...p, content: e.target.value }))} />
                                    </div>

                                    {/* Pin */}
                                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-white/5 transition-all">
                                        <div className={cn('w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all',
                                            noticeForm.is_pinned ? 'bg-amber-500 border-amber-500' : 'border-slate-600')}
                                            onClick={() => setNoticeForm(p => ({ ...p, is_pinned: !p.is_pinned }))}>
                                            {noticeForm.is_pinned && <Pin size={11} className="text-white" />}
                                        </div>
                                        <span className="text-sm text-slate-300 font-medium">Pin this notice (show at top)</span>
                                    </label>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button onClick={() => setShowNoticeForm(false)}
                                        className="flex-1 py-2.5 rounded-xl border font-semibold text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                                        style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                                        Cancel
                                    </button>
                                    <button onClick={saveNotice} disabled={saving}
                                        className="flex-1 btn-accent py-2.5 justify-center">
                                        {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={15} /> Save Notice</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notices List */}
                    {notices.length === 0 ? (
                        <div className="glass-card p-12 text-center">
                            <Bell size={48} className="mx-auto text-slate-700 mb-4" />
                            <p className="text-slate-500 font-medium">No notices yet.</p>
                            <p className="text-xs text-slate-600 mt-1">Click &quot;Add Notice&quot; to create your first notice.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {notices.map(notice => {
                                const tc = getTypeConfig(notice.type)
                                return (
                                    <div key={notice.id} className={cn('glass-card p-5 transition-all group', !notice.is_active && 'opacity-50')}
                                        style={notice.is_pinned ? { borderColor: 'rgba(245,158,11,0.3)' } : {}}>
                                        <div className="flex items-start gap-4">
                                            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                                                style={{ background: tc.bg, border: `1px solid ${tc.border}` }}>
                                                <tc.icon size={16} style={{ color: tc.color }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    {notice.is_pinned && (
                                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1"
                                                            style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
                                                            <Pin size={9} /> Pinned
                                                        </span>
                                                    )}
                                                    <h3 className="text-sm font-bold text-white">{notice.title}</h3>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                                                        style={{ background: tc.bg, color: tc.color, border: `1px solid ${tc.border}` }}>
                                                        {tc.label}
                                                    </span>
                                                    {!notice.is_active && (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">Hidden</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">{notice.content}</p>
                                                <p className="text-[10px] text-slate-600 mt-2">{formatDateTime(notice.created_at)}</p>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                                                <button onClick={() => toggleNoticePinned(notice.id, notice.is_pinned)}
                                                    className="p-2 rounded-lg hover:bg-amber-500/10 transition-all"
                                                    style={{ color: notice.is_pinned ? '#f59e0b' : '#475569' }}
                                                    title={notice.is_pinned ? 'Unpin' : 'Pin'}>
                                                    {notice.is_pinned ? <PinOff size={14} /> : <Pin size={14} />}
                                                </button>
                                                <button onClick={() => toggleNoticeActive(notice.id, notice.is_active)}
                                                    className="p-2 rounded-lg hover:bg-sky-500/10 transition-all"
                                                    style={{ color: notice.is_active ? '#0ea5e9' : '#475569' }}
                                                    title={notice.is_active ? 'Hide' : 'Show'}>
                                                    {notice.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                                                </button>
                                                <button onClick={() => openNoticeEdit(notice)}
                                                    className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all" title="Edit">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button onClick={() => deleteNotice(notice.id)}
                                                    className="p-2 rounded-lg text-slate-600 hover:text-red-500 hover:bg-red-500/10 transition-all" title="Delete">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ─── CLASSES TAB ───────────────────────────────────────── */}
            {activeTab === 'classes' && (
                <div className="space-y-5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Video size={18} className="text-emerald-400" />
                            Class Schedules
                        </h2>
                        <button onClick={openClassCreate}
                            className="flex items-center gap-2 py-2 px-4 rounded-xl font-bold text-sm text-white transition-all"
                            style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
                            <Plus size={16} /> Add Class
                        </button>
                    </div>

                    {/* Class Form Modal */}
                    {showClassForm && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
                            <div className="w-full max-w-lg glass-card p-6 animate-fade-in-up max-h-[90vh] overflow-y-auto scrollbar-hide">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-white">
                                        {editingClass ? 'Edit Class Schedule' : 'Add Class Schedule'}
                                    </h3>
                                    <button onClick={() => setShowClassForm(false)} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="form-label">Class Title *</label>
                                            <input type="text" className="input-field" placeholder="e.g. Graphic Design"
                                                value={classForm.title}
                                                onChange={e => setClassForm(p => ({ ...p, title: e.target.value }))} />
                                        </div>
                                        <div>
                                            <label className="form-label">Teacher Name *</label>
                                            <input type="text" className="input-field" placeholder="e.g. Sir Rahim"
                                                value={classForm.teacher_name}
                                                onChange={e => setClassForm(p => ({ ...p, teacher_name: e.target.value }))} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="form-label">Description (Optional)</label>
                                        <textarea className="input-field min-h-[80px] py-3" placeholder="Brief class description..."
                                            value={classForm.description}
                                            onChange={e => setClassForm(p => ({ ...p, description: e.target.value }))} />
                                    </div>

                                    <div>
                                        <label className="form-label">Google Meet Link *</label>
                                        <input type="url" className="input-field" placeholder="https://meet.google.com/xxx-xxxx-xxx"
                                            value={classForm.meet_link}
                                            onChange={e => setClassForm(p => ({ ...p, meet_link: e.target.value }))} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="form-label">Start Time *</label>
                                            <input type="datetime-local" className="input-field"
                                                value={classForm.start_time}
                                                onChange={e => setClassForm(p => ({ ...p, start_time: e.target.value }))} />
                                        </div>
                                        <div>
                                            <label className="form-label">End Time *</label>
                                            <input type="datetime-local" className="input-field"
                                                value={classForm.end_time}
                                                onChange={e => setClassForm(p => ({ ...p, end_time: e.target.value }))} />
                                        </div>
                                    </div>

                                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-white/5 transition-all">
                                        <div className={cn('w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all',
                                            classForm.is_recurring ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600')}
                                            onClick={() => setClassForm(p => ({ ...p, is_recurring: !p.is_recurring }))}>
                                            {classForm.is_recurring && <RefreshCw size={11} className="text-white" />}
                                        </div>
                                        <span className="text-sm text-slate-300 font-medium">Recurring class</span>
                                    </label>

                                    {classForm.is_recurring && (
                                        <div>
                                            <label className="form-label">Recurrence</label>
                                            <select className="select-field" value={classForm.recurrence}
                                                onChange={e => setClassForm(p => ({ ...p, recurrence: e.target.value }))}>
                                                <option value="daily">Every Day</option>
                                                <option value="weekly">Every Week</option>
                                                <option value="monthly">Every Month</option>
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button onClick={() => setShowClassForm(false)}
                                        className="flex-1 py-2.5 rounded-xl border font-semibold text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                                        style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                                        Cancel
                                    </button>
                                    <button onClick={saveClass} disabled={saving}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm text-white transition-all"
                                        style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
                                        {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={15} /> Save Class</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Classes List */}
                    {classes.length === 0 ? (
                        <div className="glass-card p-12 text-center">
                            <Video size={48} className="mx-auto text-slate-700 mb-4" />
                            <p className="text-slate-500 font-medium">No class schedules yet.</p>
                            <p className="text-xs text-slate-600 mt-1">Click &quot;Add Class&quot; to schedule your first class.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {classes.map(cls => {
                                const status = getClassStatus(cls.start_time, cls.end_time)
                                return (
                                    <div key={cls.id} className={cn('glass-card p-5 transition-all group', !cls.is_active && 'opacity-50')}>
                                        <div className="flex items-start gap-4">
                                            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                                                style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
                                                <Video size={16} style={{ color: '#10b981' }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <h3 className="text-sm font-bold text-white">{cls.title}</h3>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                                                        style={{ background: status.bg, color: status.color, border: `1px solid ${status.color}30` }}>
                                                        {(status as { pulse?: boolean }).pulse && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                                                        {status.label}
                                                    </span>
                                                    {cls.is_recurring && (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                                                            style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.3)' }}>
                                                            <RefreshCw size={9} /> {cls.recurrence}
                                                        </span>
                                                    )}
                                                    {!cls.is_active && (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">Hidden</span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-4 text-xs text-slate-400 mb-2 flex-wrap">
                                                    <span className="flex items-center gap-1.5">
                                                        <BookOpen size={11} className="text-slate-500" />
                                                        {cls.teacher_name}
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <Calendar size={11} className="text-slate-500" />
                                                        {formatDateTime(cls.start_time)}
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock size={11} className="text-slate-500" />
                                                        Ends: {formatDateTime(cls.end_time)}
                                                    </span>
                                                </div>

                                                {cls.description && (
                                                    <p className="text-xs text-slate-500 mb-2">{cls.description}</p>
                                                )}

                                                <a href={cls.meet_link} target="_blank" rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
                                                    <ExternalLink size={11} />
                                                    {cls.meet_link.length > 50 ? cls.meet_link.slice(0, 50) + '...' : cls.meet_link}
                                                </a>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                                                <button onClick={() => toggleClassActive(cls.id, cls.is_active)}
                                                    className="p-2 rounded-lg hover:bg-sky-500/10 transition-all"
                                                    style={{ color: cls.is_active ? '#0ea5e9' : '#475569' }}
                                                    title={cls.is_active ? 'Hide' : 'Show'}>
                                                    {cls.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                                                </button>
                                                <button onClick={() => openClassEdit(cls)}
                                                    className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all" title="Edit">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button onClick={() => deleteClass(cls.id)}
                                                    className="p-2 rounded-lg text-slate-600 hover:text-red-500 hover:bg-red-500/10 transition-all" title="Delete">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
