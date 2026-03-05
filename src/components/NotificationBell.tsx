'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, Info, CheckCircle, AlertTriangle, AlertCircle, X, Check } from 'lucide-react'
import { formatDateTime, cn } from '@/lib/utils'

interface Notification {
    id: string
    title: string
    message: string
    type: string
    target_type: string
    created_at: string
}

export default function NotificationBell() {
    const supabase = createClient()
    const [open, setOpen] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [readIds, setReadIds] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(true)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        loadNotifications()

        // Close on outside click
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    const loadNotifications = async () => {
        setLoading(true)
        const { data: nots } = await supabase
            .from('notifications')
            .select('id, title, message, type, target_type, created_at')
            .order('created_at', { ascending: false })
            .limit(20)

        const { data: reads } = await supabase
            .from('notification_reads')
            .select('notification_id')

        setNotifications(nots || [])
        setReadIds(new Set((reads || []).map(r => r.notification_id)))
        setLoading(false)
    }

    const markAsRead = async (notId: string) => {
        if (readIds.has(notId)) return
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        await supabase.from('notification_reads').insert({
            notification_id: notId,
            user_id: user.id,
        })
        setReadIds(prev => new Set([...prev, notId]))
    }

    const markAllAsRead = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const unread = notifications.filter(n => !readIds.has(n.id))
        if (unread.length === 0) return

        const inserts = unread.map(n => ({
            notification_id: n.id,
            user_id: user.id,
        }))

        await supabase.from('notification_reads').insert(inserts)
        setReadIds(new Set(notifications.map(n => n.id)))
    }

    const unreadCount = notifications.filter(n => !readIds.has(n.id)).length

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
            case 'warning': return <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
            case 'danger': return <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
            default: return <Info size={14} className="text-sky-500 flex-shrink-0" />
        }
    }

    const getTimeDiff = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime()
        const mins = Math.floor(diff / 60000)
        if (mins < 1) return 'Just now'
        if (mins < 60) return `${mins}m ago`
        const hrs = Math.floor(mins / 60)
        if (hrs < 24) return `${hrs}h ago`
        const days = Math.floor(hrs / 24)
        return `${days}d ago`
    }

    return (
        <div className="relative" ref={ref}>
            {/* Bell Button */}
            <button
                onClick={() => {
                    setOpen(!open)
                    if (!open) loadNotifications()
                }}
                className="relative p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
                <Bell size={20} className={cn(
                    "transition-colors",
                    open ? "text-sky-400" : "text-slate-400 hover:text-slate-200"
                )} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 border-2 border-[#0d1530] animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 top-full mt-2 w-[340px] sm:w-[380px] max-h-[70vh] rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden animate-fade-in-up"
                    style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)' }}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                        <div className="flex items-center gap-2">
                            <Bell size={16} className="text-sky-400" />
                            <h3 className="text-sm font-bold text-white">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-[10px] font-bold text-slate-500 hover:text-emerald-400 transition-colors flex items-center gap-1"
                                >
                                    <Check size={12} /> Mark all read
                                </button>
                            )}
                            <button onClick={() => setOpen(false)} className="p-1 text-slate-500 hover:text-white transition-colors">
                                <X size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="overflow-y-auto max-h-[50vh] scrollbar-hide">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="w-6 h-6 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="py-12 text-center">
                                <Bell size={32} className="mx-auto text-slate-700 mb-3" />
                                <p className="text-sm text-slate-500 font-medium">No notifications yet</p>
                                <p className="text-xs text-slate-600 mt-1">You're all caught up!</p>
                            </div>
                        ) : (
                            <div>
                                {notifications.map(n => {
                                    const isRead = readIds.has(n.id)
                                    return (
                                        <button
                                            key={n.id}
                                            onClick={() => markAsRead(n.id)}
                                            className={cn(
                                                "w-full text-left px-5 py-4 border-b border-white/5 transition-all hover:bg-white/[0.02]",
                                                !isRead && "bg-sky-500/[0.03]"
                                            )}
                                        >
                                            <div className="flex gap-3">
                                                <div className="mt-0.5">
                                                    {getIcon(n.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <h4 className={cn(
                                                            "text-xs font-bold truncate",
                                                            isRead ? "text-slate-400" : "text-white"
                                                        )}>
                                                            {n.title}
                                                        </h4>
                                                        {!isRead && (
                                                            <div className="w-2 h-2 bg-sky-500 rounded-full flex-shrink-0" />
                                                        )}
                                                    </div>
                                                    <p className={cn(
                                                        "text-[11px] leading-relaxed line-clamp-2",
                                                        isRead ? "text-slate-600" : "text-slate-400"
                                                    )}>
                                                        {n.message}
                                                    </p>
                                                    <p className="text-[10px] text-slate-600 mt-1.5 font-medium">
                                                        {getTimeDiff(n.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-5 py-3 border-t border-white/5 text-center">
                            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                                Showing latest {notifications.length} notifications
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
