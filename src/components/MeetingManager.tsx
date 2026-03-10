'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Video, Plus, Calendar, Settings, Power, Trash2, ExternalLink, VideoOff, Copy, Check } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export default function MeetingManager({ userId, role }: { userId: string, role: string }) {
    const [meetings, setMeetings] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [newMeeting, setNewMeeting] = useState({
        title: '',
        description: '',
        scheduled_at: format(new Date(), "yyyy-MM-dd'T'HH:mm")
    })

    const supabase = createClient()

    useEffect(() => {
        fetchMeetings()
    }, [userId])

    const fetchMeetings = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('meetings')
            .select('*')
            .eq('host_id', userId)
            .order('created_at', { ascending: false })

        if (!error && data) {
            setMeetings(data)
        }
        setLoading(false)
    }

    const handleCreateMeeting = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMeeting.title) return

        const roomName = `room_${Math.random().toString(36).substring(2, 10)}`

        const { error } = await supabase
            .from('meetings')
            .insert({
                title: newMeeting.title,
                description: newMeeting.description,
                host_id: userId,
                room_name: roomName,
                scheduled_at: newMeeting.scheduled_at,
                status: 'upcoming'
            })

        if (!error) {
            setIsCreating(false)
            setNewMeeting({ title: '', description: '', scheduled_at: format(new Date(), "yyyy-MM-dd'T'HH:mm") })
            fetchMeetings()
        }
    }

    const handleToggleStatus = async (meeting: any) => {
        const newStatus = meeting.status === 'live' ? 'ended' : 'live'
        const { error } = await supabase
            .from('meetings')
            .update({ status: newStatus })
            .eq('id', meeting.id)

        if (!error) {
            fetchMeetings()
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this meeting?')) return
        const { error } = await supabase.from('meetings').delete().eq('id', id)
        if (!error) fetchMeetings()
    }

    const copyLink = (id: string) => {
        const link = `${window.location.origin}/meeting/${id}`
        navigator.clipboard.writeText(link)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Video className="text-sky-500" />
                        Meeting Management
                    </h2>
                    <p className="text-sm text-slate-400">Schedule and host professional meetings for your team.</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-sky-600/20"
                >
                    <Plus size={18} />
                    Create Meeting
                </button>
            </div>

            {isCreating && (
                <div className="bg-[#0d1530] border border-[#1e3a5f] p-6 rounded-2xl animate-fade-in">
                    <form onSubmit={handleCreateMeeting} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Meeting Title</label>
                                <input
                                    type="text"
                                    value={newMeeting.title}
                                    onChange={e => setNewMeeting({ ...newMeeting, title: e.target.value })}
                                    placeholder="e.g. Weekly Strategy Session"
                                    className="w-full bg-[#0a0f1e] border border-[#1e3a5f] rounded-xl px-4 py-3 text-white focus:border-sky-500 outline-none transition-all"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Scheduled Time</label>
                                <input
                                    type="datetime-local"
                                    value={newMeeting.scheduled_at}
                                    onChange={e => setNewMeeting({ ...newMeeting, scheduled_at: e.target.value })}
                                    className="w-full bg-[#0a0f1e] border border-[#1e3a5f] rounded-xl px-4 py-3 text-white focus:border-sky-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Description (Optional)</label>
                            <textarea
                                value={newMeeting.description}
                                onChange={e => setNewMeeting({ ...newMeeting, description: e.target.value })}
                                placeholder="Agenda or notes for the meeting..."
                                className="w-full bg-[#0a0f1e] border border-[#1e3a5f] rounded-xl px-4 py-3 text-white focus:border-sky-500 outline-none transition-all h-24"
                            />
                        </div>
                        <div className="flex gap-3 justify-end pt-2">
                            <button type="button" onClick={() => setIsCreating(false)} className="px-5 py-2.5 text-slate-400 font-bold hover:text-white transition-colors">Cancel</button>
                            <button type="submit" className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold shadow-lg shadow-sky-600/20 transition-all">
                                Save Meeting
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : meetings.length === 0 ? (
                    <div className="bg-[#0d1530] border border-dashed border-[#1e3a5f] p-12 rounded-2xl text-center">
                        <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                            <VideoOff size={32} />
                        </div>
                        <p className="text-slate-400 font-medium">You haven't created any meetings yet.</p>
                    </div>
                ) : (
                    meetings.map(meeting => (
                        <div key={meeting.id} className="bg-[#0d1530] border border-[#1e3a5f] p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-sky-900/50 transition-all group">
                            <div className="flex items-start gap-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg",
                                    meeting.status === 'live' ? "bg-emerald-500/10 text-emerald-500 animate-pulse" : "bg-slate-800 text-slate-400"
                                )}>
                                    <Video size={24} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-white tracking-tight">{meeting.title}</h3>
                                        {meeting.status === 'live' && (
                                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-500 text-[0.6rem] font-bold uppercase rounded uppercase tracking-widest">Live Now</span>
                                        )}
                                        {meeting.status === 'ended' && (
                                            <span className="px-2 py-0.5 bg-red-500/20 text-red-500 text-[0.6rem] font-bold uppercase rounded uppercase tracking-widest">Ended</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            {format(new Date(meeting.scheduled_at), 'MMM d, h:mm a')}
                                        </span>
                                        {meeting.description && (
                                            <>
                                                <span className="w-1 h-1 bg-slate-700 rounded-full" />
                                                <span className="truncate max-w-[200px]">{meeting.description}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    onClick={() => copyLink(meeting.id)}
                                    className="p-2.5 bg-[#0a0f1e] text-slate-400 hover:text-sky-400 rounded-lg border border-[#1e3a5f] transition-all relative group"
                                    title="Copy Invite Link"
                                >
                                    {copiedId === meeting.id ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                                    {copiedId === meeting.id && (
                                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] px-2 py-1 rounded">Copied!</span>
                                    )}
                                </button>

                                {meeting.status !== 'ended' && (
                                    <button
                                        onClick={() => handleToggleStatus(meeting)}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all border",
                                            meeting.status === 'live'
                                                ? "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"
                                                : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20"
                                        )}
                                    >
                                        <Power size={14} />
                                        {meeting.status === 'live' ? 'End Session' : 'Go Live'}
                                    </button>
                                )}

                                {meeting.status === 'live' ? (
                                    <Link
                                        href={`/meeting/${meeting.id}`}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold text-xs transition-all shadow-lg shadow-sky-600/20"
                                    >
                                        <ExternalLink size={14} />
                                        Join Room
                                    </Link>
                                ) : (
                                    <button
                                        onClick={() => handleDelete(meeting.id)}
                                        className="p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg border border-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
