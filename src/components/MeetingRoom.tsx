'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import {
    Mic, MicOff, Video as VideoIcon, VideoOff,
    Hand, MessageSquare, Users, PhoneOff,
    Send, X, Info, Volume2, Shield, Settings,
    Maximize2, Grid, Share, MoreVertical
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface MeetingRoomProps {
    appId: string;
    channel: string;
    token: string;
    agoraUid: number;
    userName: string;
    userId: string;
    meetingId: string;
    isHost?: boolean;
    onLeave: () => void;
    initialAudioMuted: boolean;
    initialVideoEnabled: boolean;
}

export default function MeetingRoom({
    appId, channel, token, agoraUid, userName, userId, meetingId, isHost, onLeave, initialAudioMuted, initialVideoEnabled
}: MeetingRoomProps) {
    const supabase = createClient()

    // RTC Refs & States
    const clientRef = useRef<any>(null)
    const localAudioTrackRef = useRef<any>(null)
    const localVideoTrackRef = useRef<any>(null)

    const [remoteUsers, setRemoteUsers] = useState<any[]>([])
    const [joined, setJoined] = useState(false)

    // UI States
    const [isMuted, setIsMuted] = useState(initialAudioMuted)
    const [videoEnabled, setVideoEnabled] = useState(initialVideoEnabled)
    const [activeTab, setActiveTab] = useState<'chat' | 'people' | null>(null)
    const [isHandRaised, setIsHandRaised] = useState(false)
    const [loading, setLoading] = useState(true)

    // Chat
    const [messages, setMessages] = useState<any[]>([])
    const [messageInput, setMessageInput] = useState('')

    const localVideoDivRef = useRef<HTMLDivElement>(null)
    const chatEndRef = useRef<HTMLDivElement>(null)

    // ── RTC SETUP ──────────────────────────────────────────────────
    useEffect(() => {
        let mounted = true

        const setupRTC = async () => {
            try {
                const AgoraRTC = (await import('agora-rtc-sdk-ng')).default
                AgoraRTC.setLogLevel(2)

                const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
                clientRef.current = client

                // Remote event handlers
                client.on('user-published', async (user: any, mediaType: 'audio' | 'video' | 'datachannel') => {
                    if (mediaType === 'audio' || mediaType === 'video') {
                        await client.subscribe(user, mediaType)
                    }
                    if (mediaType === 'video') {
                        setRemoteUsers(prev => {
                            if (prev.find(u => u.uid === user.uid)) return prev
                            return [...prev, user]
                        })
                    }
                    if (mediaType === 'audio') {
                        user.audioTrack?.play()
                    }
                })

                client.on('user-unpublished', (user: any, mediaType: 'audio' | 'video' | 'datachannel') => {
                    if (mediaType === 'video') {
                        setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid))
                    }
                })

                client.on('user-left', (user: any) => {
                    setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid))
                })

                // join(appId: string, channel: string, token: string | null, uid?: string | number | null)
                // Passing null to 'uid' tells Agora's servers to safely generate and auto-assign a unique UID.
                // This eliminates UID_CONFLICT locally unconditionally.
                await client.join(appId, channel, token, null)

                // Try to acquire tracks gracefully
                let audioTrack = null
                let videoTrack = null

                try {
                    // Start by trying both
                    const tracks = await AgoraRTC.createMicrophoneAndCameraTracks(
                        { AEC: true, ANS: true, AGC: true },
                        { encoderConfig: '720p_1' }
                    )
                    audioTrack = tracks[0]
                    videoTrack = tracks[1]
                } catch (mediaErr: any) {
                    console.warn("Device missing or blocked, trying fallback:", mediaErr)
                    try {
                        audioTrack = await AgoraRTC.createMicrophoneAudioTrack({ AEC: true, ANS: true, AGC: true })
                    } catch (audioErr) {
                        console.warn("Audio fallback also failed or blocked:", audioErr)
                    }
                }

                if (audioTrack) localAudioTrackRef.current = audioTrack
                if (videoTrack) localVideoTrackRef.current = videoTrack

                // Handle initial settings
                if (audioTrack && initialAudioMuted) await audioTrack.setEnabled(false)
                if (videoTrack && !initialVideoEnabled) await videoTrack.setEnabled(false)

                const tracksToPublish = []
                if (audioTrack) tracksToPublish.push(audioTrack)
                if (videoTrack) tracksToPublish.push(videoTrack)

                if (tracksToPublish.length > 0) {
                    await client.publish(tracksToPublish)
                }

                if (mounted) {
                    setJoined(true)
                    setLoading(false)
                }
            } catch (err) {
                console.error('Failed to connect to meeting room:', err)
                if (String(err).includes('UID_CONFLICT')) {
                    alert("UID Conflict detected. Please retry or refresh.")
                } else {
                    alert("Failed to initialize meeting: " + (err as Error).message)
                }
                if (mounted) setLoading(false)
            }
        }

        setupRTC()

        return () => {
            mounted = false
            localAudioTrackRef.current?.stop()
            localAudioTrackRef.current?.close()
            localVideoTrackRef.current?.stop()
            localVideoTrackRef.current?.close()
            if (clientRef.current) {
                clientRef.current.leave()
                clientRef.current.removeAllListeners()
            }
        }
    }, [appId, channel, token])

    // Mount local video when loading finishes
    useEffect(() => {
        if (!loading && localVideoDivRef.current && localVideoTrackRef.current) {
            localVideoTrackRef.current.play(localVideoDivRef.current)
        }
    }, [loading])

    // ── DATABASE / CHAT ───────────────────────────────────────────
    useEffect(() => {
        const fetchMessages = async () => {
            const { data } = await supabase.from('meeting_messages')
                .select('*')
                .eq('meeting_id', meetingId)
                .order('created_at', { ascending: true })
            if (data) setMessages(data)
        }
        fetchMessages()

        const channelSub = supabase.channel(`room_${meetingId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'meeting_messages',
                filter: `meeting_id=eq.${meetingId}`
            }, payload => {
                setMessages(prev => [...prev, payload.new])
            })
            .subscribe()

        return () => { supabase.removeChannel(channelSub) }
    }, [meetingId])

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // ── ACTIONS ─────────────────────────────────────────────────────
    const toggleMic = async () => {
        if (!localAudioTrackRef.current) {
            try {
                const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
                const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({ AEC: true, ANS: true, AGC: true });
                localAudioTrackRef.current = audioTrack;

                if (clientRef.current) {
                    await clientRef.current.publish([audioTrack]);
                }
                setIsMuted(false);
            } catch (err: any) {
                console.error("Failed to acquire microphone dynamically:", err);
                alert("Microphone not detected or permission denied. Please check site permissions.");
            }
            return;
        }
        const nextState = !isMuted
        await localAudioTrackRef.current.setEnabled(!nextState)
        setIsMuted(nextState)
    }

    const toggleVideo = async () => {
        if (!localVideoTrackRef.current) {
            try {
                const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
                const videoTrack = await AgoraRTC.createCameraVideoTrack({ encoderConfig: '720p_1' });
                localVideoTrackRef.current = videoTrack;

                if (localVideoDivRef.current) {
                    videoTrack.play(localVideoDivRef.current);
                }

                if (clientRef.current) {
                    await clientRef.current.publish([videoTrack]);
                }
                setVideoEnabled(true);
            } catch (err: any) {
                console.error("Failed to acquire camera dynamically:", err);
                alert("Camera not detected or permission denied. Please check your browser settings.");
            }
            return;
        }
        const nextState = !videoEnabled
        await localVideoTrackRef.current.setEnabled(nextState)
        setVideoEnabled(nextState)
    }

    const sendMessage = async () => {
        if (!messageInput.trim()) return
        const content = messageInput
        setMessageInput('')
        await supabase.from('meeting_messages').insert({
            meeting_id: meetingId,
            sender_id: userId,
            sender_name: userName,
            content
        })
    }

    // ── RENDER HELPERS ──────────────────────────────────────────────
    const videoGridClass = useMemo(() => {
        const total = remoteUsers.length + 1
        if (total === 1) return 'grid-cols-1 max-w-4xl'
        if (total === 2) return 'grid-cols-1 md:grid-cols-2 max-w-6xl'
        if (total <= 4) return 'grid-cols-2 max-w-6xl'
        if (total <= 6) return 'grid-cols-2 lg:grid-cols-3'
        return 'grid-cols-2 lg:grid-cols-4'
    }, [remoteUsers.length])

    if (loading) {
        return (
            <div className="h-screen bg-[#202124] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-white text-sm font-medium">Joining meeting...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-screen bg-[#202124] flex flex-col font-sans text-white overflow-hidden">

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* Video Grid Section */}
                <div className="flex-1 p-4 md:p-8 flex items-center justify-center overflow-y-auto">
                    <div className={cn("grid gap-4 w-full transition-all duration-500", videoGridClass)}>

                        {/* Local Participant (Me) */}
                        <div className="relative aspect-video rounded-xl bg-[#3c4043] overflow-hidden group shadow-lg">
                            <div ref={localVideoDivRef} className="w-full h-full object-cover scale-x-[-1]" />
                            {!videoEnabled && (
                                <div className="absolute inset-0 flex items-center justify-center bg-[#202124]">
                                    <div className="w-24 h-24 rounded-full bg-[#3c4043] flex items-center justify-center text-3xl font-medium">
                                        {userName.charAt(0).toUpperCase()}
                                    </div>
                                </div>
                            )}
                            <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-[#202124]/80 px-3 py-1.5 rounded-lg text-sm">
                                {isMuted && <MicOff size={14} className="text-[#d93025]" />}
                                {userName} (You)
                            </div>
                            {isHandRaised && (
                                <div className="absolute top-4 right-4 bg-[#fbbc04] p-2 rounded-full shadow-lg animate-bounce">
                                    <Hand size={20} className="text-[#202124] fill-current" />
                                </div>
                            )}
                        </div>

                        {/* Remote Participants */}
                        {remoteUsers.map(user => (
                            <RemoteParticipant key={user.uid} user={user} />
                        ))}
                    </div>
                </div>

                {/* Sidebar (Chat / People) */}
                {activeTab && (
                    <aside className="w-[360px] bg-white text-[#202124] flex flex-col border-l border-[#dadce0] animate-in slide-in-from-right duration-300">
                        <div className="p-6 flex items-center justify-between border-b border-[#dadce0]">
                            <h2 className="text-xl font-medium tracking-tight">
                                {activeTab === 'chat' ? 'In-call messages' : 'People'}
                            </h2>
                            <button onClick={() => setActiveTab(null)} className="p-2 hover:bg-[#f1f3f4] rounded-full text-[#5f6368]">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {activeTab === 'chat' ? (
                                <>
                                    <div className="bg-[#f8f9fa] p-4 rounded-lg text-xs text-[#5f6368] leading-relaxed">
                                        Messages can only be seen by people in the call and are deleted when the call ends.
                                    </div>
                                    <div className="space-y-6">
                                        {messages.map(msg => (
                                            <div key={msg.id} className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-[#202124]">{msg.sender_name}</span>
                                                    <span className="text-[10px] text-[#5f6368]">
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-[#202124] break-words">{msg.content}</p>
                                            </div>
                                        ))}
                                        <div ref={chatEndRef} />
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-[#1a73e8] flex items-center justify-center text-white text-sm font-medium">
                                                {userName.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-sm font-medium text-[#202124]">{userName} (You)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isMuted ? <MicOff size={18} className="text-[#5f6368]" /> : <Mic size={18} className="text-[#5f6368]" />}
                                            <Shield size={16} className="text-[#188038]" />
                                        </div>
                                    </div>
                                    {remoteUsers.map(user => (
                                        <div key={user.uid} className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-[#3c4043] flex items-center justify-center text-white text-sm font-medium">
                                                    U
                                                </div>
                                                <span className="text-sm font-medium text-[#202124]">Participant {user.uid}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[#5f6368]">
                                                {user.hasAudio ? <Mic size={18} /> : <MicOff size={18} />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {activeTab === 'chat' && (
                            <div className="p-6 border-t border-[#dadce0]">
                                <div className="bg-[#f1f3f4] rounded-full px-5 py-3 flex items-center gap-3">
                                    <input
                                        type="text"
                                        value={messageInput}
                                        onChange={e => setMessageInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                        placeholder="Send a message to everyone"
                                        className="bg-transparent border-none focus:ring-0 flex-1 text-sm text-[#202124] placeholder:text-[#5f6368]"
                                    />
                                    <button onClick={sendMessage} className="text-[#1a73e8] hover:bg-black/5 p-2 rounded-full transition-colors">
                                        <Send size={20} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </aside>
                )}
            </div>

            {/* Bottom Controls Bar (Google Meet Style) */}
            <div className="h-[80px] bg-[#202124] px-6 flex items-center justify-between z-50">

                {/* Meeting Info */}
                <div className="hidden lg:flex items-center gap-4 w-[300px]">
                    <span className="text-sm font-medium tracking-tight border-r border-[#5f6368] pr-4">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} | {channel}
                    </span>
                    <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <Info size={20} />
                    </button>
                </div>

                {/* Media Controls */}
                <div className="flex items-center gap-3 md:gap-4">
                    <button
                        onClick={toggleMic}
                        className={cn(
                            "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all border",
                            isMuted
                                ? "bg-[#ea4335] border-[#ea4335] text-white hover:bg-[#d93025]"
                                : "bg-[#3c4043] border-transparent text-white hover:bg-[#4a4e51]"
                        )}
                    >
                        {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>
                    <button
                        onClick={toggleVideo}
                        className={cn(
                            "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all border",
                            !videoEnabled
                                ? "bg-[#ea4335] border-[#ea4335] text-white hover:bg-[#d93025]"
                                : "bg-[#3c4043] border-transparent text-white hover:bg-[#4a4e51]"
                        )}
                    >
                        {!videoEnabled ? <VideoOff size={20} /> : <VideoIcon size={20} />}
                    </button>

                    <button className="hidden md:flex w-12 h-12 rounded-full items-center justify-center bg-[#3c4043] text-white hover:bg-[#4a4e51] transition-all">
                        <Share size={20} />
                    </button>
                    <button
                        onClick={() => setIsHandRaised(!isHandRaised)}
                        className={cn(
                            "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all",
                            isHandRaised ? "bg-[#8ab4f8] text-[#202124]" : "bg-[#3c4043] text-white hover:bg-[#4a4e51]"
                        )}
                    >
                        <Hand size={20} className={isHandRaised ? "fill-current" : ""} />
                    </button>
                    <button className="hidden md:flex w-12 h-12 rounded-full items-center justify-center bg-[#3c4043] text-white hover:bg-[#4a4e51] transition-all">
                        <MoreVertical size={20} />
                    </button>

                    <button
                        onClick={onLeave}
                        className="w-14 md:w-16 h-10 md:h-12 bg-[#ea4335] hover:bg-[#d93025] text-white rounded-[24px] flex items-center justify-center transition-all shadow-lg"
                    >
                        <PhoneOff size={24} className="rotate-[135deg]" />
                    </button>
                </div>

                {/* Right Tab Controls */}
                <div className="flex items-center gap-1 w-[300px] justify-end">
                    <button
                        onClick={() => setActiveTab(activeTab === 'people' ? null : 'people')}
                        className={cn(
                            "p-3 rounded-full transition-colors relative",
                            activeTab === 'people' ? "bg-[#8ab4f8]/10 text-[#8ab4f8]" : "hover:bg-white/10 text-white"
                        )}
                    >
                        <Users size={22} />
                        {remoteUsers.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-[#8ab4f8] rounded-full border-2 border-[#202124]" />}
                    </button>
                    <button
                        onClick={() => setActiveTab(activeTab === 'chat' ? null : 'chat')}
                        className={cn(
                            "p-3 rounded-full transition-colors relative",
                            activeTab === 'chat' ? "bg-[#8ab4f8]/10 text-[#8ab4f8]" : "hover:bg-white/10 text-white"
                        )}
                    >
                        <MessageSquare size={22} />
                        {messages.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-[#8ab4f8] rounded-full border-2 border-[#202124]" />}
                    </button>
                    <button className="p-3 hover:bg-white/10 rounded-full transition-colors text-white">
                        <Grid size={22} />
                    </button>
                    <button className="p-3 hover:bg-white/10 rounded-full transition-colors text-white">
                        <Shield size={22} />
                    </button>
                </div>
            </div>
        </div>
    )
}

function RemoteParticipant({ user }: { user: any }) {
    const videoRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (videoRef.current && user.videoTrack) {
            user.videoTrack.play(videoRef.current)
        }
    }, [user.videoTrack])

    return (
        <div className="relative aspect-video rounded-xl bg-[#3c4043] overflow-hidden group shadow-lg">
            <div ref={videoRef} className="w-full h-full object-cover" />
            <div className="absolute bottom-4 left-4 bg-[#202124]/80 px-3 py-1.5 rounded-lg text-sm text-white">
                Participant {user.uid}
            </div>
        </div>
    )
}
