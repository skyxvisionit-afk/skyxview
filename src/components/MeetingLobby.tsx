'use client'

import { useState, useEffect, useRef } from 'react'
import { Video as VideoIcon, Mic, MicOff, VideoOff, Settings, MoreVertical, ShieldCheck, Clock, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MeetingLobbyProps {
    meeting: any;
    profile: any;
    onJoin: (audioMuted: boolean, videoEnabled: boolean) => void;
}

export default function MeetingLobby({ meeting, profile, onJoin }: MeetingLobbyProps) {
    const [audioMuted, setAudioMuted] = useState(false)
    const [videoEnabled, setVideoEnabled] = useState(true)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        let currentStream: MediaStream | null = null;
        const getMedia = async () => {
            try {
                currentStream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 1280, height: 720 },
                    audio: true
                })
                setStream(currentStream)
                if (videoRef.current) videoRef.current.srcObject = currentStream
            } catch (err) {
                console.error('Media Error:', err)
                setVideoEnabled(false)
            }
        }
        getMedia()
        return () => {
            currentStream?.getTracks().forEach(t => t.stop())
        }
    }, [])

    const toggleVideo = () => {
        if (stream) {
            const track = stream.getVideoTracks()[0];
            if (track) {
                track.enabled = !videoEnabled;
                setVideoEnabled(!videoEnabled);
            }
        }
    }

    const toggleAudio = () => {
        if (stream) {
            const track = stream.getAudioTracks()[0];
            if (track) {
                track.enabled = audioMuted; // enable if it was muted
                setAudioMuted(!audioMuted);
            }
        }
    }

    return (
        <div className="min-h-screen bg-white text-[#202124] flex items-center justify-center p-4 md:p-8 font-sans">
            <div className="max-w-[1200px] w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                {/* Left: Video Preview (Google Meet Style) */}
                <div className="space-y-6">
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-[#202124] shadow-md group">
                        {videoEnabled ? (
                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                playsInline
                                className="w-full h-full object-cover scale-x-[-1]"
                            />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#202124]">
                                <div className="w-24 h-24 rounded-full bg-[#3c4043] flex items-center justify-center text-3xl font-medium text-white">
                                    {profile.full_name.charAt(0).toUpperCase()}
                                </div>
                                <p className="mt-4 text-sm text-[#9aa0a6]">Camera is off</p>
                            </div>
                        )}

                        {/* Controls Overlay */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
                            <button
                                onClick={toggleAudio}
                                className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center transition-all border",
                                    audioMuted
                                        ? "bg-[#d93025] border-[#d93025] text-white hover:bg-[#c5221f]"
                                        : "bg-transparent border-[#5f6368] text-white hover:bg-white/10"
                                )}
                            >
                                {audioMuted ? <MicOff size={20} /> : <Mic size={20} />}
                            </button>
                            <button
                                onClick={toggleVideo}
                                className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center transition-all border",
                                    !videoEnabled
                                        ? "bg-[#d93025] border-[#d93025] text-white hover:bg-[#c5221f]"
                                        : "bg-transparent border-[#5f6368] text-white hover:bg-white/10"
                                )}
                            >
                                {!videoEnabled ? <VideoOff size={20} /> : <VideoIcon size={20} />}
                            </button>
                        </div>

                        <div className="absolute top-4 right-4 group-hover:opacity-100 opacity-0 transition-opacity">
                            <button className="p-2 rounded-full hover:bg-white/10 text-white">
                                <Settings size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Join Details (Google Meet Style) */}
                <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-8">
                    <div className="space-y-4">
                        <h1 className="text-3xl md:text-4xl font-normal text-[#202124] tracking-tight">
                            Ready to join?
                        </h1>
                        {meeting.participants_count > 0 && (
                            <div className="flex items-center justify-center lg:justify-start gap-2 text-sm text-[#5f6368]">
                                <Users size={16} />
                                <span>{meeting.participants_count} {meeting.participants_count === 1 ? 'person is' : 'people are'} in this call</span>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <button
                            onClick={() => onJoin(audioMuted, videoEnabled)}
                            className="px-8 h-12 bg-[#1a73e8] hover:bg-[#185abc] text-white rounded-full font-medium text-sm transition-all shadow-sm flex items-center justify-center"
                        >
                            Join now
                        </button>
                        <button
                            disabled
                            className="px-8 h-12 bg-white hover:bg-[#f8f9fa] text-[#1a73e8] border border-[#dadce0] rounded-full font-medium text-sm transition-all flex items-center justify-center"
                        >
                            Present
                        </button>
                    </div>

                    <div className="pt-8 space-y-4 border-t border-[#dadce0] w-full">
                        <p className="text-xs text-[#5f6368] font-medium uppercase tracking-wider">Other joining options</p>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3 text-sm text-[#202124]">
                                <ShieldCheck size={18} className="text-[#188038]" />
                                <span>Joining as <span className="font-bold">{profile.full_name}</span></span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-[#5f6368]">
                                <Clock size={18} />
                                <span>Starts at {new Date(meeting.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
