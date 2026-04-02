'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Upload, CheckCircle, XCircle, Clock, Eye, Download,
    Filter, Search, ChevronDown, Database, FileText, Image,
    Video, Palette, Package, Share2, ClipboardList, ExternalLink
} from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

type SubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

interface WorkSubmission {
    id: string
    user_id: string
    full_name: string
    work_type: string
    notes: string | null
    file_url: string | null
    status: SubmissionStatus
    admin_note: string | null
    created_at: string
    users?: { full_name: string; whatsapp: string; email: string }
}

const WORK_TYPE_LABELS: Record<string, { label: string; color: string }> = {
    'data-entry': { label: 'Data Entry', color: '#06b6d4' },
    'form-fillup': { label: 'Form Fillup', color: '#0ea5e9' },
    'photo-editing': { label: 'Photo Editing', color: '#8b5cf6' },
    'video-editing': { label: 'Video Editing', color: '#ec4899' },
    'graphic-design': { label: 'Graphic Design', color: '#f59e0b' },
    'pen-packaging': { label: 'Pen Packaging', color: '#10b981' },
    'soap-packaging': { label: 'Soap Packaging', color: '#14b8a6' },
    'social-media': { label: 'Social Media', color: '#f97316' },
    'copy-paste': { label: 'Copy Paste', color: '#6366f1' },
}

function StatusBadge({ status }: { status: SubmissionStatus }) {
    const cfg = {
        PENDING: { label: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: Clock },
        APPROVED: { label: 'Approved', color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: CheckCircle },
        REJECTED: { label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: XCircle },
    }[status]
    const Icon = cfg.icon
    return (
        <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ color: cfg.color, background: cfg.bg }}>
            <Icon size={12} /> {cfg.label}
        </span>
    )
}

export default function AdminWorkSubmissionsPage() {
    const [submissions, setSubmissions] = useState<WorkSubmission[]>([])
    const [loading, setLoading] = useState(true)
    const [filterStatus, setFilterStatus] = useState<string>('ALL')
    const [search, setSearch] = useState('')
    const [selected, setSelected] = useState<WorkSubmission | null>(null)
    const [adminNote, setAdminNote] = useState('')
    const [processing, setProcessing] = useState(false)

    const fetchSubmissions = async () => {
        setLoading(true)
        const supabase = createClient()
        const { data } = await supabase
            .from('work_submissions')
            .select('*, users:user_id(full_name, whatsapp, email)')
            .order('created_at', { ascending: false })
        setSubmissions(data as WorkSubmission[] || [])
        setLoading(false)
    }

    useEffect(() => { fetchSubmissions() }, [])

    const handleAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        setProcessing(true)
        const supabase = createClient()
        await supabase.from('work_submissions').update({ status, admin_note: adminNote || null }).eq('id', id)
        await fetchSubmissions()
        setSelected(null)
        setAdminNote('')
        setProcessing(false)
    }

    const filtered = submissions.filter(s => {
        const matchStatus = filterStatus === 'ALL' || s.status === filterStatus
        const matchSearch = s.full_name.toLowerCase().includes(search.toLowerCase()) ||
            s.work_type.includes(search.toLowerCase()) ||
            (s.users?.whatsapp || '').includes(search)
        return matchStatus && matchSearch
    })

    const stats = {
        total: submissions.length,
        pending: submissions.filter(s => s.status === 'PENDING').length,
        approved: submissions.filter(s => s.status === 'APPROVED').length,
        rejected: submissions.filter(s => s.status === 'REJECTED').length,
    }

    return (
        <div className="space-y-6 animate-fade-in-up pb-10">
            {/* Header */}
            <div className="page-header">
                <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-slate-500">Admin Panel</p>
                <h1 className="text-2xl font-black tracking-tight" style={{ color: '#e2e8f0' }}>
                    Work <span className="gradient-text">Submissions</span>
                </h1>
                <p className="text-sm mt-1 text-slate-500">Review and approve member work submissions.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Total', value: stats.total, color: '#0ea5e9' },
                    { label: 'Pending', value: stats.pending, color: '#f59e0b' },
                    { label: 'Approved', value: stats.approved, color: '#10b981' },
                    { label: 'Rejected', value: stats.rejected, color: '#ef4444' },
                ].map(s => (
                    <div key={s.label} className="stat-card p-4">
                        <div className="text-[0.6rem] font-bold uppercase tracking-widest text-slate-500 mb-1">{s.label}</div>
                        <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="glass-card p-4 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name, type or number..."
                        className="input-field pl-10 py-2.5 text-sm"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(s => (
                        <button key={s} onClick={() => setFilterStatus(s)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterStatus === s ? 'bg-sky-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="glass-card overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 text-slate-500">
                        <Upload size={40} className="mx-auto mb-4 opacity-30" />
                        <p className="font-semibold">No submissions found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b" style={{ borderColor: '#1e3a5f', background: 'rgba(14,165,233,0.03)' }}>
                                    {['Member', 'Work Type', 'File', 'Status', 'Submitted', 'Actions'].map(h => (
                                        <th key={h} className="text-left px-5 py-3 text-[0.65rem] uppercase tracking-widest font-black" style={{ color: '#64748b' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((sub, i) => {
                                    const wt = WORK_TYPE_LABELS[sub.work_type] || { label: sub.work_type, color: '#64748b' }
                                    return (
                                        <tr key={sub.id} className="border-b hover:bg-white/[0.02] transition-colors"
                                            style={{ borderColor: 'rgba(30,58,95,0.3)' }}>
                                            <td className="px-5 py-4">
                                                <div className="font-semibold text-white">{sub.full_name}</div>
                                                <div className="text-xs text-slate-500">{sub.users?.whatsapp}</div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="text-xs font-bold px-2.5 py-1 rounded-lg"
                                                    style={{ color: wt.color, background: wt.color + '18' }}>
                                                    {wt.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                {sub.file_url ? (
                                                    <a href={sub.file_url} target="_blank" rel="noopener noreferrer"
                                                        className="flex items-center gap-1.5 text-sky-400 hover:text-sky-300 font-semibold text-xs transition-colors">
                                                        <Download size={14} /> View File
                                                    </a>
                                                ) : (
                                                    <span className="text-slate-600 text-xs">No file</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <StatusBadge status={sub.status} />
                                            </td>
                                            <td className="px-5 py-4 text-xs text-slate-400">
                                                {formatDateTime(sub.created_at)}
                                            </td>
                                            <td className="px-5 py-4">
                                                <button onClick={() => { setSelected(sub); setAdminNote(sub.admin_note || '') }}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 text-xs font-bold transition-colors">
                                                    <Eye size={13} /> Review
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Review Modal */}
            {selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
                    <div className="glass-card w-full max-w-lg p-6 animate-fade-in-up relative border border-sky-500/20 shadow-2xl shadow-sky-500/10">
                        <button onClick={() => { setSelected(null); setAdminNote('') }}
                            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 text-slate-400 transition-colors">
                            <XCircle size={20} />
                        </button>

                        <h2 className="text-xl font-black text-white mb-1">Review Submission</h2>
                        <p className="text-xs text-slate-500 mb-6">#{selected.id.slice(0, 8).toUpperCase()}</p>

                        <div className="space-y-3 mb-6">
                            {[
                                { label: 'Member Name', value: selected.full_name },
                                { label: 'WhatsApp', value: selected.users?.whatsapp || '—' },
                                { label: 'Work Type', value: WORK_TYPE_LABELS[selected.work_type]?.label || selected.work_type },
                                { label: 'Submitted', value: formatDateTime(selected.created_at) },
                            ].map(row => (
                                <div key={row.label} className="flex justify-between items-center py-2 border-b border-white/5">
                                    <span className="text-xs text-slate-500 font-semibold">{row.label}</span>
                                    <span className="text-sm text-white font-medium">{row.value}</span>
                                </div>
                            ))}
                            {selected.notes && (
                                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                    <p className="text-xs text-slate-500 font-semibold mb-1">Notes from Member</p>
                                    <p className="text-sm text-slate-300">{selected.notes}</p>
                                </div>
                            )}
                            {selected.file_url && (
                                <a href={selected.file_url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-2 p-3 rounded-xl border border-sky-500/20 bg-sky-500/5 text-sky-400 hover:bg-sky-500/10 transition-colors text-sm font-semibold">
                                    <ExternalLink size={16} /> Open Submitted File
                                </a>
                            )}
                        </div>

                        <div className="mb-5">
                            <label className="form-label">Admin Note <span className="text-slate-500">(optional)</span></label>
                            <textarea
                                value={adminNote}
                                onChange={e => setAdminNote(e.target.value)}
                                rows={3}
                                className="input-field resize-none text-sm"
                                placeholder="Add feedback or reason for rejection..."
                            />
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => handleAction(selected.id, 'REJECTED')} disabled={processing}
                                className="flex-1 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                <XCircle size={16} /> Reject
                            </button>
                            <button onClick={() => handleAction(selected.id, 'APPROVED')} disabled={processing}
                                className="flex-1 btn-accent px-4 py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                                {processing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CheckCircle size={16} /> Approve</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
