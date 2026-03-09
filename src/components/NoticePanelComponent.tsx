'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Bell, Video, AlertCircle, CheckCircle, Info, AlertTriangle,
    ExternalLink, Clock, Calendar, BookOpen, Pin, RefreshCw,
    ChevronDown, ChevronUp, Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Notice {
    id: string
    title: string
    content: string
    type: string
    is_pinned: boolean
    created_at: string
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
}

const noticeTypes = {
    info: { icon: Info, color: '#0ea5e9', bg: 'rgba(14,165,233,0.08)', border: 'rgba(14,165,233,0.2)', glow: '0 0 20px rgba(14,165,233,0.1)' },
    success: { icon: CheckCircle, color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', glow: '0 0 20px rgba(16,185,129,0.1)' },
    warning: { icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', glow: '0 0 20px rgba(245,158,11,0.1)' },
    danger: { icon: AlertCircle, color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', glow: '0 0 20px rgba(239,68,68,0.12)' },
}

function getTypeConfig(type: string) {
    return noticeTypes[type as keyof typeof noticeTypes] || noticeTypes.info
}

function getClassStatus(start: string, end: string): { label: string; color: string; bg: string; border: string; pulse?: boolean } {
    const now = new Date()
    const startDt = new Date(start)
    const endDt = new Date(end)
    if (now >= startDt && now <= endDt) {
        return { label: 'LIVE NOW', color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)', pulse: true }
    }
    if (now < startDt) {
        const diff = startDt.getTime() - now.getTime()
        const hours = Math.floor(diff / 3600000)
        const mins = Math.floor((diff % 3600000) / 60000)
        if (hours < 1) return { label: `In ${mins}m`, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)' }
        if (hours < 24) return { label: `In ${hours}h ${mins}m`, color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)', border: 'rgba(14,165,233,0.25)' }
        return { label: 'Upcoming', color: '#64748b', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.2)' }
    }
    return { label: 'Ended', color: '#475569', bg: 'rgba(71,85,105,0.08)', border: 'rgba(71,85,105,0.15)' }
}

function formatDateTime(dt: string) {
    return new Date(dt).toLocaleString('en-BD', {
        timeZone: 'Asia/Dhaka',
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

function getDuration(start: string, end: string) {
    const ms = new Date(end).getTime() - new Date(start).getTime()
    const hours = Math.floor(ms / 3600000)
    const mins = Math.floor((ms % 3600000) / 60000)
    if (hours > 0) return `${hours}h ${mins > 0 ? mins + 'm' : ''}`
    return `${mins}m`
}

function NoticeCard({ notice, index }: { notice: Notice; index: number }) {
    const [expanded, setExpanded] = useState(false)
    const tc = getTypeConfig(notice.type)
    const isLong = notice.content.length > 200

    return (
        <div
            className="rounded-2xl p-5 transition-all duration-300 hover:translate-y-[-1px] animate-fade-in-up"
            style={{
                background: tc.bg,
                border: `1px solid ${tc.border}`,
                boxShadow: notice.is_pinned ? tc.glow : 'none',
                animationDelay: `${index * 80}ms`
            }}>
            <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${tc.color}20`, border: `1px solid ${tc.color}40` }}>
                    <tc.icon size={18} style={{ color: tc.color }} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {notice.is_pinned && (
                            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                                style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
                                <Pin size={8} /> Pinned
                            </span>
                        )}
                        <h3 className="text-sm font-bold" style={{ color: '#e2e8f0' }}>{notice.title}</h3>
                    </div>

                    <p className={cn('text-sm leading-relaxed whitespace-pre-wrap', !expanded && isLong && 'line-clamp-3')}
                        style={{ color: '#94a3b8' }}>
                        {notice.content}
                    </p>

                    {isLong && (
                        <button onClick={() => setExpanded(!expanded)}
                            className="mt-2 flex items-center gap-1 text-xs font-semibold transition-colors hover:opacity-80"
                            style={{ color: tc.color }}>
                            {expanded ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Read more</>}
                        </button>
                    )}

                    <p className="text-[11px] mt-2" style={{ color: '#475569' }}>
                        {formatDateTime(notice.created_at)}
                    </p>
                </div>
            </div>
        </div>
    )
}

function ClassCard({ cls, index }: { cls: ClassSchedule; index: number }) {
    const status = getClassStatus(cls.start_time, cls.end_time)
    const duration = getDuration(cls.start_time, cls.end_time)
    const isLive = status.label === 'LIVE NOW'

    return (
        <div className="rounded-2xl p-5 transition-all duration-300 hover:translate-y-[-1px] animate-fade-in-up"
            style={{
                background: isLive ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isLive ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.07)'}`,
                boxShadow: isLive ? '0 0 25px rgba(16,185,129,0.08)' : 'none',
                animationDelay: `${index * 80}ms`
            }}>
            <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="relative w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
                    <Video size={18} style={{ color: '#10b981' }} />
                    {isLive && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2"
                            style={{ borderColor: '#0a0f1e', animation: 'pulse 1s infinite' }} />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    {/* Title + Status */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-sm font-bold" style={{ color: '#e2e8f0' }}>{cls.title}</h3>
                        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                            style={{ background: status.bg, color: status.color, border: `1px solid ${status.border}` }}>
                            {status.pulse && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                            {status.label}
                        </span>
                        {cls.is_recurring && (
                            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                                style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}>
                                <RefreshCw size={8} /> {cls.recurrence}
                            </span>
                        )}
                    </div>

                    {/* Meta info */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-3">
                        <span className="flex items-center gap-1.5 text-xs" style={{ color: '#94a3b8' }}>
                            <BookOpen size={12} style={{ color: '#64748b' }} />
                            <span className="font-semibold" style={{ color: '#cbd5e1' }}>{cls.teacher_name}</span>
                        </span>
                        <span className="flex items-center gap-1.5 text-xs" style={{ color: '#94a3b8' }}>
                            <Calendar size={12} style={{ color: '#64748b' }} />
                            {formatDateTime(cls.start_time)}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs" style={{ color: '#94a3b8' }}>
                            <Clock size={12} style={{ color: '#64748b' }} />
                            Duration: {duration}
                        </span>
                    </div>

                    {cls.description && (
                        <p className="text-xs mb-3 leading-relaxed" style={{ color: '#64748b' }}>{cls.description}</p>
                    )}

                    {/* Join Button */}
                    <a href={cls.meet_link} target="_blank" rel="noopener noreferrer"
                        className={cn(
                            'inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all duration-200',
                            isLive
                                ? 'text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 active:scale-95'
                                : 'text-emerald-400 border bg-emerald-500/5 hover:bg-emerald-500/10 active:scale-95 transition-all'
                        )}
                        style={isLive
                            ? { background: 'linear-gradient(135deg, #059669, #10b981)' }
                            : { borderColor: 'rgba(16,185,129,0.3)' }
                        }>
                        <ExternalLink size={12} />
                        {isLive ? '🔴 Join Live Class Now' : 'Open Meet Link'}
                    </a>
                </div>
            </div>
        </div>
    )
}

export default function NoticePanelComponent() {
    const supabase = createClient()
    const [notices, setNotices] = useState<Notice[]>([])
    const [classes, setClasses] = useState<ClassSchedule[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'notices' | 'classes'>('notices')
    const [now, setNow] = useState(new Date())

    const loadData = useCallback(async () => {
        const [{ data: n }, { data: c }] = await Promise.all([
            supabase.from('notices').select('*').eq('is_active', true)
                .order('is_pinned', { ascending: false })
                .order('created_at', { ascending: false }),
            supabase.from('class_schedules').select('*').eq('is_active', true)
                .order('start_time', { ascending: true }),
        ])
        setNotices(n || [])
        setClasses(c || [])
        setLoading(false)
    }, [supabase])

    useEffect(() => { loadData() }, [loadData])

    // Real-time clock for live status
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 30000)
        return () => clearInterval(timer)
    }, [])

    const liveCount = classes.filter(c => {
        const s = new Date(c.start_time), e = new Date(c.end_time)
        return now >= s && now <= e
    }).length

    const upcomingCount = classes.filter(c => now < new Date(c.start_time)).length

    if (loading) return (
        <div className="flex items-center justify-center h-60">
            <div className="w-8 h-8 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
        </div>
    )

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-2xl p-4 flex flex-col gap-1 transition-all duration-300 hover:bg-sky-500/10"
                    style={{ background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.15)' }}>
                    <Bell size={18} style={{ color: '#0ea5e9' }} />
                    <div className="text-2xl font-black text-white">{notices.length}</div>
                    <div className="text-xs text-slate-400">Total Notices</div>
                </div>
                <div className="rounded-2xl p-4 flex flex-col gap-1 transition-all duration-300 hover:bg-amber-500/10"
                    style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                    <Pin size={18} style={{ color: '#f59e0b' }} />
                    <div className="text-2xl font-black text-white">{notices.filter(n => n.is_pinned).length}</div>
                    <div className="text-xs text-slate-400">Pinned News</div>
                </div>
                <div className="rounded-2xl p-4 flex flex-col gap-1 transition-all duration-300"
                    style={{
                        background: liveCount > 0 ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.05)',
                        border: `1px solid ${liveCount > 0 ? 'rgba(16,185,129,0.35)' : 'rgba(16,185,129,0.15)'}`
                    }}>
                    <div className="flex items-center gap-1.5">
                        <Video size={18} style={{ color: '#10b981' }} />
                        {liveCount > 0 && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                    </div>
                    <div className="text-2xl font-black text-white">{liveCount}</div>
                    <div className="text-xs text-slate-400">Classes Live</div>
                </div>
                <div className="rounded-2xl p-4 flex flex-col gap-1 transition-all duration-300 hover:bg-purple-500/10"
                    style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}>
                    <Sparkles size={18} style={{ color: '#a78bfa' }} />
                    <div className="text-2xl font-black text-white">{upcomingCount}</div>
                    <div className="text-xs text-slate-400">Upcoming</div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <button
                    onClick={() => setActiveTab('notices')}
                    className={cn(
                        'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all',
                        activeTab === 'notices'
                            ? 'bg-gradient-to-r from-sky-600 to-sky-500 text-white shadow-lg shadow-sky-500/20'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                    )}>
                    <Bell size={16} />
                    Important Notices
                    {notices.length > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-black ml-1"
                            style={{ background: activeTab === 'notices' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.07)' }}>
                            {notices.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('classes')}
                    className={cn(
                        'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all',
                        activeTab === 'classes'
                            ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                    )}>
                    <Video size={16} />
                    Class Schedule
                    {liveCount > 0 && (
                        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-black ml-1"
                            style={{ background: 'rgba(16,185,129,0.3)', color: '#10b981' }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            LIVE
                        </span>
                    )}
                </button>
            </div>

            {/* ── NOTICES ─────────────────────────────────────────────── */}
            {activeTab === 'notices' && (
                <div className="space-y-3">
                    {notices.length === 0 ? (
                        <div className="rounded-2xl p-16 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <Bell size={48} className="mx-auto mb-4" style={{ color: '#1e3a5f' }} />
                            <p className="font-semibold" style={{ color: '#475569' }}>No notices at the moment.</p>
                            <p className="text-xs mt-1" style={{ color: '#334155' }}>Check back later for updates from admin.</p>
                        </div>
                    ) : (
                        notices.map((n, i) => <NoticeCard key={n.id} notice={n} index={i} />)
                    )}
                </div>
            )}

            {/* ── CLASSES ─────────────────────────────────────────────── */}
            {activeTab === 'classes' && (
                <div className="space-y-3">
                    {/* Live classes first banner */}
                    {liveCount > 0 && (
                        <div className="rounded-2xl p-4 flex items-center gap-3 animate-pulse"
                            style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))', border: '1px solid rgba(16,185,129,0.3)' }}>
                            <span className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
                            <p className="text-sm font-bold text-emerald-400">
                                {liveCount} class{liveCount > 1 ? 'es are' : ' is'} live right now! Join immediately.
                            </p>
                        </div>
                    )}

                    {classes.length === 0 ? (
                        <div className="rounded-2xl p-16 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <Video size={48} className="mx-auto mb-4" style={{ color: '#1e3a5f' }} />
                            <p className="font-semibold" style={{ color: '#475569' }}>No classes scheduled yet.</p>
                            <p className="text-xs mt-1" style={{ color: '#334155' }}>Admin will add class schedules here.</p>
                        </div>
                    ) : (
                        classes.map((c, i) => <ClassCard key={c.id} cls={c} index={i} />)
                    )}
                </div>
            )}
        </div>
    )
}
