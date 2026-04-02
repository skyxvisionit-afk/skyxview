'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Target, Gift, Info, Star, Activity, Sparkles, TrendingUp, CheckCircle2 } from 'lucide-react'

export default function MyRoomPage() {
    const supabase = createClient()
    const [room, setRoom] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [claiming, setClaiming] = useState(false)
    const [isClaimed, setIsClaimed] = useState(false)

    useEffect(() => {
        loadRoomData()
    }, [])

    const loadRoomData = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        let { data, error } = await supabase
            .from('user_rooms')
            .select('*')
            .eq('user_id', user.id)
            .single()

        if (error && error.code === 'PGRST116') {
            const { data: newRoom } = await supabase
                .from('user_rooms')
                .insert({ user_id: user.id })
                .select()
                .single()
            setRoom(newRoom)
        } else {
            setRoom(data)
        }
        setLoading(false)
    }

    const handleClaim = () => {
        setClaiming(true)
        // Simulate a claim request to admin
        setTimeout(() => {
            setClaiming(false)
            setIsClaimed(true)
        }, 1500)
    }

    if (loading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Entering your room...</p>
                </div>
            </div>
        )
    }

    const progress = room?.target_progress || 0

    return (
        <div className="space-y-8 animate-fade-in-up pb-10">
            {/* Room Header */}
            <div className="relative rounded-3xl overflow-hidden glass-card p-10 border-sky-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/40">
                <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/20 rounded-full blur-3xl -mr-40 -mt-40"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl -ml-40 -mb-40"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold uppercase tracking-wider rounded-full mb-6">
                            <Sparkles size={14} /> Private Member Room
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
                            Personal <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400">Activity Hub</span>
                        </h1>
                        <div className="flex items-center gap-4 mt-6">
                            <div className="p-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                            </div>
                            <p className="text-slate-300 font-medium">{room?.room_announcement || 'Stay focused and reach your daily targets to unlock exclusive benefits.'}</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-center gap-2 p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
                        <div className="relative w-32 h-32 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90 transform">
                                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={364.4} strokeDashoffset={364.4 - (364.4 * progress) / 100} className="text-sky-500 transition-all duration-[1500ms] ease-out" />
                            </svg>
                            <div className="absolute flex flex-col items-center justify-center">
                                <span className="text-3xl font-black text-white leading-none font-mono">{progress}%</span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Target</span>
                            </div>
                        </div>
                        <span className="text-xs font-bold text-sky-400 mt-2 uppercase tracking-widest">Active Progress</span>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Daily Target */}
                <div className="lg:col-span-2 glass-card p-8 border-sky-500/10 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.1)]">
                                    <Target size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Daily Target</h2>
                                    <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Assigned by Admin</span>
                                </div>
                            </div>
                            <div className="px-3 py-1 bg-sky-500/10 text-sky-400 text-[10px] font-black rounded-lg border border-sky-500/20 tracking-widest uppercase">Ongoing</div>
                        </div>
                        
                        <p className="text-lg text-slate-200 font-medium mb-10 leading-relaxed italic bg-sky-500/5 p-6 rounded-2xl border border-sky-500/10 border-dashed relative">
                            <span className="absolute -top-3 -left-1 text-sky-500/30 text-5xl font-serif">"</span>
                            {room?.daily_target || 'No target assigned for today.'}
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <TrendingUp size={12} /> Progress Score
                            </span>
                            <span className="text-sm font-black text-sky-400">{progress}/100 pts</span>
                        </div>
                        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                            <div className="h-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                        </div>
                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter text-right">Last sync: Just now</p>
                    </div>
                </div>

                {/* Special Offer Section */}
                <div className="glass-card p-8 border-purple-500/10 bg-gradient-to-b from-slate-900 to-indigo-900/10 flex flex-col relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 transform rotate-12 -mr-6 -mt-4 opacity-10 transition-transform group-hover:rotate-0">
                        <Gift size={120} />
                    </div>
                    
                    <div className="flex items-center gap-3 mb-8 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                            <Gift size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Exclusive Offer</h2>
                            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Just for you</span>
                        </div>
                    </div>

                    <div className="relative z-10 bg-purple-500/10 border border-purple-500/20 rounded-2xl p-6 mb-6 flex-1 flex flex-col items-center justify-center text-center">
                        <div className="text-2xl font-black text-purple-400 mb-2 font-mono tracking-tighter">LIMITED DEAL</div>
                        <p className="text-slate-200 font-bold leading-relaxed">
                            {room?.special_offer || 'Unlock a new badge to receive premium rewards and special bonuses!'}
                        </p>
                    </div>

                    <button 
                        onClick={handleClaim}
                        disabled={claiming || isClaimed}
                        className={`relative z-10 w-full py-4 font-black rounded-xl text-sm uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${
                            isClaimed 
                            ? 'bg-emerald-500 text-slate-950 cursor-default' 
                            : 'bg-purple-500 hover:bg-purple-600 text-slate-950 hover:shadow-purple-500/20'
                        }`}
                    >
                        {claiming ? (
                            <>
                                <div className="w-4 h-4 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin"></div>
                                Claiming...
                            </>
                        ) : isClaimed ? (
                            <>
                                <CheckCircle2 size={18} />
                                Application Sent
                            </>
                        ) : (
                            'Claim This Offer'
                        )}
                    </button>
                    
                    {isClaimed && (
                        <p className="text-[10px] text-emerald-400 mt-4 text-center font-bold uppercase tracking-tight relative z-10">
                            Offer claim request sent to admin for verification.
                        </p>
                    )}
                    
                    <p className="relative z-10 text-[9px] text-slate-500 mt-4 text-center font-bold uppercase tracking-widest leading-none">Terms and conditions apply as per SkyX policy</p>
                </div>
            </div>

            {/* Room Footer Activity */}
            <div className="grid sm:grid-cols-3 gap-4">
                <div className="glass-card p-5 border-white/5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                        <Activity size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Status</p>
                        <p className="text-sm font-bold text-white">Active Room</p>
                    </div>
                </div>
                <div className="glass-card p-5 border-white/5 flex items-center gap-4 text-emerald-400 bg-emerald-500/5">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <Info size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Connectivity</p>
                        <p className="text-sm font-bold">Synchronized</p>
                    </div>
                </div>
                <div className="glass-card p-5 border-white/5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                        <Star size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Room Tier</p>
                        <p className="text-sm font-bold text-white">Platinum Member</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
