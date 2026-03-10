import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Video, Calendar, Clock, User, ExternalLink, VideoOff } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export default async function MemberMeetingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const { data: meetings, error } = await supabase
        .from('meetings')
        .select(`
            *,
            host:users!host_id(full_name, role)
        `)
        .neq('status', 'ended')
        .order('status', { ascending: false }) // Live first
        .order('scheduled_at', { ascending: true })

    return (
        <div className="container mx-auto max-w-5xl space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Video className="text-sky-500" size={32} />
                        Live Meetings
                    </h1>
                    <p className="text-slate-400 mt-1">Join active training sessions and team meetings.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {!meetings || meetings.length === 0 ? (
                    <div className="bg-[#0d1530] border border-dashed border-[#1e3a5f] p-16 rounded-3xl text-center">
                        <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-500">
                            <VideoOff size={40} />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">No Active Meetings</h2>
                        <p className="text-slate-400 max-w-sm mx-auto">There are currently no live or upcoming meetings scheduled. Check back later or follow the notice panel.</p>
                    </div>
                ) : (
                    meetings.map(meeting => (
                        <div key={meeting.id} className={cn(
                            "bg-[#0d1530] border p-6 rounded-3xl transition-all group overflow-hidden relative",
                            meeting.status === 'live' ? "border-sky-500/50 shadow-[0_0_30px_-10px_rgba(14,165,233,0.3)]" : "border-[#1e3a5f] hover:border-sky-900/50"
                        )}>
                            {meeting.status === 'live' && (
                                <div className="absolute top-0 right-0 px-6 py-2 bg-sky-500 text-white text-[0.65rem] font-black uppercase tracking-[0.2em] rounded-bl-2xl animate-pulse">
                                    Live Now
                                </div>
                            )}

                            <div className="flex flex-col md:flex-row gap-6">
                                <div className={cn(
                                    "w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center shrink-0 shadow-2xl",
                                    meeting.status === 'live' ? "bg-sky-500 text-white" : "bg-slate-800 text-slate-400"
                                )}>
                                    <Video size={32} />
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div>
                                        <h2 className="text-xl md:text-2xl font-bold text-white mb-1 group-hover:text-sky-400 transition-colors">
                                            {meeting.title}
                                        </h2>
                                        <p className="text-slate-400 text-sm line-clamp-2 md:max-w-2xl">
                                            {meeting.description || 'No description provided for this meeting.'}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-y-3 gap-x-6 text-sm">
                                        <div className="flex items-center gap-2 text-slate-300">
                                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-sky-400 border border-slate-700">
                                                {meeting.host?.full_name.charAt(0)}
                                            </div>
                                            <span className="font-bold">{meeting.host?.full_name}</span>
                                            <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-500 rounded font-black uppercase tracking-widest">{meeting.host?.role}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Calendar size={16} className="text-slate-500" />
                                            <span>{format(new Date(meeting.scheduled_at), 'MMMM d, yyyy')}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Clock size={16} className="text-slate-500" />
                                            <span>{format(new Date(meeting.scheduled_at), 'h:mm a')}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end">
                                    {meeting.status === 'live' ? (
                                        <Link
                                            href={`/meeting/${meeting.id}`}
                                            className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-sky-600 hover:bg-sky-500 text-white rounded-2xl font-bold transition-all shadow-xl shadow-sky-600/20 group-hover:scale-105 active:scale-95"
                                        >
                                            Join Meeting
                                            <ExternalLink size={18} />
                                        </Link>
                                    ) : (
                                        <div className="px-6 py-3 bg-slate-800/50 text-slate-500 rounded-2xl font-bold text-sm border border-slate-700/50">
                                            Upcoming
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
