'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import MeetingRoom from '@/components/MeetingRoom'
import MeetingLobby from '@/components/MeetingLobby'
import { Video, ArrowLeft, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

export default function MeetingPage() {
    const params = useParams()
    const id = params.id as string
    const router = useRouter()
    const supabase = createClient()

    const [meeting, setMeeting] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [joined, setJoined] = useState(false)
    const [token, setToken] = useState<string | null>(null)
    const [agoraUid, setAgoraUid] = useState<number>(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Initial media states from lobby
    const [initialStates, setInitialStates] = useState({ audioMuted: false, videoEnabled: true })

    const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    router.push('/auth/login')
                    return
                }

                const [profileRes, meetingRes] = await Promise.all([
                    supabase.from('users').select('*').eq('id', user.id).single(),
                    supabase.from('meetings').select('*, host:users!host_id(full_name)').eq('id', id).single()
                ])

                if (profileRes.error || !profileRes.data) throw new Error("Profile not found")
                if (meetingRes.error || !meetingRes.data) throw new Error("Meeting not found")

                setProfile(profileRes.data)
                setMeeting(meetingRes.data)
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [id])

    const handleJoin = async (audioMuted: boolean, videoEnabled: boolean) => {
        try {
            setLoading(true)
            setInitialStates({ audioMuted, videoEnabled })

            // Use a combination of user ID and timestamp to guarantee absolute uniqueness per session
            // We use just a timestamp here to ensure the number is an Integer and completely unique
            const numericUid = Math.floor(Date.now() / 1000)
            const res = await fetch(`/api/agora/token?channelName=${meeting.room_name}&uid=${numericUid}`)
            const data = await res.json()

            if (data.token) {
                setToken(data.token)
                setAgoraUid(numericUid)
                setJoined(true)
            } else {
                throw new Error(data.error || "Access Token Required")
            }
        } catch (err: any) {
            alert("Secure Link Error: " + err.message)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#111] flex flex-col items-center justify-center gap-12">
                <div className="relative">
                    <div className="w-32 h-32 border border-sky-500/10 rounded-full flex items-center justify-center animate-pulse">
                        <Video size={48} className="text-sky-500/20" />
                    </div>
                </div>
                <div className="space-y-4 text-center">
                    <p className="text-sm font-black uppercase tracking-[0.5em] text-sky-500 animate-pulse">Establishing Secure Network Layer</p>
                    <div className="flex items-center justify-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                </div>
            </div>
        )
    }

    if (error || !meeting) {
        return (
            <div className="min-h-screen bg-[#111] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                <div className="w-24 h-24 bg-red-500/10 rounded-[2.5rem] flex items-center justify-center mb-10 border border-red-500/20 shadow-2xl">
                    <Video className="text-red-500" size={40} />
                </div>
                <h1 className="text-4xl font-black text-white mb-4 italic tracking-tight">Security Handshake Failed</h1>
                <p className="text-slate-500 max-w-sm mb-16 text-lg font-medium leading-relaxed">
                    The session link is either expired or revoked by security protocols.
                </p>
                <div className="flex flex-col md:flex-row gap-6">
                    <Link href="/dashboard" className="px-12 py-5 bg-white/5 hover:bg-white/10 text-white rounded-[2rem] font-bold transition-all border border-white/5">
                        Exit to Safety
                    </Link>
                    <button onClick={() => window.location.reload()} className="px-12 py-5 bg-sky-600 hover:bg-sky-500 text-white rounded-[2rem] font-bold transition-all shadow-3xl shadow-sky-600/30">
                        Retry Verification
                    </button>
                </div>
            </div>
        )
    }

    if (joined && AGORA_APP_ID && token) {
        return (
            <div className="fixed inset-0 z-[99999] bg-black">
                <MeetingRoom
                    appId={AGORA_APP_ID}
                    channel={meeting.room_name}
                    token={token}
                    agoraUid={agoraUid}
                    userName={profile.full_name}
                    userId={profile.id}
                    meetingId={meeting.id}
                    isHost={meeting.host_id === profile.id}
                    initialAudioMuted={initialStates.audioMuted}
                    initialVideoEnabled={initialStates.videoEnabled}
                    onLeave={() => {
                        setJoined(false)
                        setToken(null)
                    }}
                />
            </div>
        )
    }

    return (
        <MeetingLobby
            meeting={meeting}
            profile={profile}
            onJoin={handleJoin}
        />
    )
}
