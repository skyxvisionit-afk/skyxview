'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Video, ArrowRight, X } from 'lucide-react'
import Link from 'next/link'

export default function LiveMeetingBanner() {
    const [liveMeetings, setLiveMeetings] = useState<any[]>([])
    const [dismissed, setDismissed] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        const fetchLiveMeetings = async () => {
            const { data } = await supabase
                .from('meetings')
                .select('id, title, host:users!host_id(full_name)')
                .eq('status', 'live')
                .limit(1)

            if (data) setLiveMeetings(data)
        }

        fetchLiveMeetings()

        // Subscribe to changes
        const channel = supabase
            .channel('live_meetings')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'meetings' }, () => {
                fetchLiveMeetings()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    if (dismissed || liveMeetings.length === 0) return null

    const meeting = liveMeetings[0]

    return (
        <div className="relative group overflow-hidden bg-gradient-to-r from-sky-600 to-indigo-600 rounded-3xl p-1 shadow-2xl shadow-sky-600/20 animate-fade-in-up">
            <div className="bg-[#0a0f1e]/40 backdrop-blur-md rounded-[1.4rem] p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="relative">
                        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-inner">
                            <Video size={28} />
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#1e3a5f] animate-pulse" />
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded">Join Now</span>
                            <h3 className="text-lg font-bold text-white tracking-tight">Meeting is Live!</h3>
                        </div>
                        <p className="text-sky-100/70 text-sm font-medium">
                            <span className="text-white font-bold">{meeting.title}</span> hosted by {meeting.host?.full_name}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Link
                        href={`/meeting/${meeting.id}`}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-sky-600 rounded-xl font-black text-sm shadow-xl hover:bg-sky-50 transition-all active:scale-95"
                    >
                        Join Meeting
                        <ArrowRight size={18} />
                    </Link>
                    <button
                        onClick={() => setDismissed(true)}
                        className="p-3.5 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-xl transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Background pattern */}
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />
        </div>
    )
}
