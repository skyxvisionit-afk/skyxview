'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { loginAsUser } from './actions'
import { Lock, Eye, EyeOff, AlertTriangle, ShieldAlert, Zap, Globe, Shield, Power, Activity, Smartphone, Bell, Camera } from 'lucide-react'

const PROTOCOL_KEY = '18990'
const LOCK_DURATION = 60 * 60 * 1000 // 1 hour

export default function AdminSecurityVaultPage() {
    const [password, setPassword] = useState('')
    const [showPwd, setShowPwd] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [isUnlocked, setIsUnlocked] = useState(false)
    const [lockTimeLeft, setLockTimeLeft] = useState<number | null>(null)
    const [activeTab, setActiveTab] = useState<'RED' | 'BLUE' | 'HIDDEN' | 'INFO'>('RED')
    
    // States for zones
    const [isSystemShutdown, setIsSystemShutdown] = useState(false)
    const [developerName, setDeveloperName] = useState('Admin')
    
    // Telemetry state - live presence signals
    const [telemetryUsers, setTelemetryUsers] = useState<any[]>([])
    // All registered users from DB
    const [dbUsers, setDbUsers] = useState<any[]>([])
    const [dbLoading, setDbLoading] = useState(false)
    
    const router = useRouter()
    const supabase = createClient()

    // Separate effect for lock timer
    useEffect(() => {
        const checkLock = () => {
            const lockedUntil = localStorage.getItem('admin_vault_lock')
            if (lockedUntil) {
                const timeLeft = new Date(lockedUntil).getTime() - Date.now()
                if (timeLeft > 0) {
                    setLockTimeLeft(timeLeft)
                } else {
                    localStorage.removeItem('admin_vault_lock')
                    setLockTimeLeft(null)
                }
            }
        }
        checkLock()
        const int = setInterval(checkLock, 1000)
        return () => clearInterval(int)
    }, [])

    // Fetch all registered users from database when vault unlocks
    useEffect(() => {
        if (!isUnlocked) return
        const fetchData = async () => {
            setDbLoading(true)
            
            // Fetch Users
            const { data: usersData } = await supabase
                .from('users')
                .select('id, full_name, whatsapp, email, role, status, created_at, avatar_url')
                .order('created_at', { ascending: false })
            setDbUsers(usersData || [])

            // Fetch System State
            const { data: settingsData } = await supabase
                .from('system_settings')
                .select('is_maintenance_mode, maintenance_developer')
                .limit(1)
                .single()
            
            if (settingsData) {
                setIsSystemShutdown(settingsData.is_maintenance_mode)
                setDeveloperName(settingsData.maintenance_developer || 'Admin')
            }
            
            setDbLoading(false)
        }
        fetchData()
    }, [isUnlocked])

    // Separate effect for Realtime Presence - only starts when vault is unlocked
    useEffect(() => {
        if (!isUnlocked) return
        
        const supabaseClient = createClient()
        const channel = supabaseClient.channel('skyx-telemetry')

        channel.on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState()
            const users: any[] = []
            for (const key in state) {
                const presences: any[] = state[key] as any[]
                if (presences && presences.length > 0) {
                    // Take the most recent presence for this key
                    users.push(presences[presences.length - 1])
                }
            }
            // Filter out the admin-observer entry itself
            setTelemetryUsers(users.filter(u => u.user_id))
        })

        channel.on('presence', { event: 'join' }, ({ newPresences }: any) => {
            setTelemetryUsers(prev => {
                const updated = [...prev]
                for (const p of newPresences) {
                    if (!p.user_id) continue
                    const idx = updated.findIndex(u => u.user_id === p.user_id)
                    if (idx >= 0) updated[idx] = p
                    else updated.push(p)
                }
                return updated
            })
        })

        channel.on('presence', { event: 'leave' }, ({ leftPresences }: any) => {
            setTelemetryUsers(prev =>
                prev.filter(u => !leftPresences.some((lp: any) => lp.user_id === u.user_id))
            )
        })

        channel.subscribe()

        return () => {
            channel.unsubscribe()
        }
    }, [isUnlocked])

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        if (password === PROTOCOL_KEY) {
            setIsUnlocked(true)
            setLoading(false)
        } else {
            setError('Access Denied. Incorrect Protocol Key.')
            
            // Lock out logic - lock for 1 hour
            const lockUntil = new Date(Date.now() + LOCK_DURATION).toISOString()
            localStorage.setItem('admin_vault_lock', lockUntil)
            setLockTimeLeft(LOCK_DURATION)
            
            await supabase.auth.signOut()
            router.push('/auth/login')
        }
    }

    const handleSystemToggle = async () => {
        const nextState = !isSystemShutdown
        const ch = supabase.channel('skyx-telemetry')

        // 1. Permanent SQL Database Update 
        const { error } = await supabase.from('system_settings').update({
            is_maintenance_mode: nextState,
            maintenance_developer: developerName,
            updated_at: new Date().toISOString()
        }).not('id', 'is', null) // Updates all rows (should only be one)

        // 2. Realtime WebSocket Broadcast to immediately execute on active clients
        await ch.send({
            type: 'broadcast',
            event: 'system-shutdown',
            payload: { shutdown: nextState, developer_name: developerName }
        })
        setIsSystemShutdown(nextState)
    }

    const handleSendPush = async () => {
        const msg = (document.getElementById('notifyMsg') as HTMLTextAreaElement)?.value
        const target = (document.getElementById('notifyTarget') as HTMLInputElement)?.value
        if (!msg) return alert('Enter a message')

        const ch = supabase.channel('skyx-telemetry')
        await ch.send({
            type: 'broadcast',
            event: 'system-notification',
            payload: { target_id: target || 'All', message: msg }
        })
        alert(`Push sent to ${target || 'All'}!`)
    }

    const [screenBlob, setScreenBlob] = useState('')
    const [screenLoading, setScreenLoading] = useState(false)

    const handleTakeScreenshot = async () => {
        const targetId = (document.getElementById('screenTarget') as HTMLInputElement)?.value
        if (!targetId) return alert('Enter a Target User ID')

        setScreenLoading(true)
        setScreenBlob('')

        const ch = supabase.channel('skyx-telemetry')
        
        // Listen for the immediate specific reply
        ch.on('broadcast', { event: `screenshot-reply-${targetId}` }, (payload) => {
            setScreenBlob(payload.payload?.image)
            setScreenLoading(false)
        }).subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await ch.send({
                    type: 'broadcast',
                    event: 'request-screenshot',
                    payload: { user_id: targetId }
                })
            }
        })

        // Timeout if no reply
        setTimeout(() => {
            setScreenLoading(false)
        }, 15000)
    }

    const formatTime = (ms: number) => {
        const mins = Math.floor(ms / 60000)
        const secs = Math.floor((ms % 60000) / 1000)
        return `${mins}m ${secs}s`
    }

    if (lockTimeLeft !== null && lockTimeLeft > 0) {
        return (
            <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
                <div className="glass-card p-10 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                        <Lock className="text-red-500" size={40} />
                    </div>
                    <h1 className="text-2xl font-bold text-red-500 mb-2">Vault Access Locked</h1>
                    <p className="text-slate-300 mb-6">
                        Your account has been locked due to incorrect password entry.
                    </p>
                    <div className="text-3xl font-mono font-bold text-slate-100">
                        {formatTime(lockTimeLeft)}
                    </div>
                </div>
            </div>
        )
    }

    if (!isUnlocked) {
        return (
            <div className="max-w-xl mx-auto space-y-6 animate-fade-in-up flex items-center min-h-[70vh]">
                <div className="glass-card p-10 border-red-500/20 w-full">
                    <div className="flex flex-col items-center text-center mb-8">
                        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20 mb-4 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                            <ShieldAlert className="text-red-500" size={32} />
                        </div>
                        <h1 className="text-2xl font-bold text-red-400">Restricted Area</h1>
                        <p className="text-sm text-slate-400 mt-2">
                            Enter protocol key to access hidden content. Warning: Incorrect entry will result in immediate 1-hour account lockout.
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 flex items-start gap-3">
                            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleUnlock} className="space-y-6">
                        <div>
                            <label className="form-label text-slate-300">Protocol Key</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type={showPwd ? 'text' : 'password'}
                                    className="input-field border-red-500/20 focus:border-red-500 focus:ring-red-500/20"
                                    style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem', backgroundColor: 'rgba(0,0,0,0.5)' }}
                                    placeholder="Enter authorization key"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                    onClick={() => setShowPwd(!showPwd)}
                                >
                                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(239,68,68,0.4)] border border-red-400/50"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Verifying...
                                </span>
                            ) : (
                                <>Authenticate Sequence</>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-up">
            <div className="page-header border-b border-red-500/20 pb-4">
                <div className="flex items-center gap-3">
                    <ShieldAlert className="text-red-500" size={28} />
                    <div>
                        <h1 className="text-2xl font-bold text-red-500 shadow-red-500/20 drop-shadow-md">Vault Override Active</h1>
                        <p className="text-sm text-slate-400">Classified administrative access granted. Proceed with caution.</p>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-4 border-b border-white/10 pb-2">
                <button 
                    onClick={() => setActiveTab('RED')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
                        activeTab === 'RED' ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'text-slate-400 hover:bg-white/5'
                    }`}
                >
                    <Zap size={18} /> Red Zone
                </button>
                <button 
                    onClick={() => setActiveTab('BLUE')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
                        activeTab === 'BLUE' ? 'bg-blue-500/20 text-blue-500 border border-blue-500/50' : 'text-slate-400 hover:bg-white/5'
                    }`}
                >
                    <Globe size={18} /> Blue Zone
                </button>
                <button 
                    onClick={() => setActiveTab('HIDDEN')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
                        activeTab === 'HIDDEN' ? 'bg-indigo-500/20 text-indigo-500 border border-indigo-500/50' : 'text-slate-400 hover:bg-white/5'
                    }`}
                >
                    <Shield size={18} /> Hidden Security Zone
                </button>
                <button 
                    onClick={() => setActiveTab('INFO')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
                        activeTab === 'INFO' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/50' : 'text-slate-400 hover:bg-white/5'
                    }`}
                >
                    <Globe size={18} /> INFO
                </button>
            </div>

            {/* Red Zone */}
            {activeTab === 'RED' && (
                <div className="glass-card p-8 border-red-500/30 bg-red-950/20 animate-fade-in">
                    <div className="flex flex-col items-center text-center max-w-lg mx-auto py-8">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-all duration-500 border shadow-2xl ${
                            isSystemShutdown ? 'bg-green-500/20 border-green-500 text-green-500 shadow-green-500/20' : 'bg-red-500/20 border-red-500 text-red-500 shadow-red-500/20'
                        }`}>
                            <Power size={48} className={isSystemShutdown ? 'animate-pulse' : ''} />
                        </div>
                        
                        <h2 className="text-2xl font-bold mb-2">
                            {isSystemShutdown ? 'System is Offline' : 'Global System Shutdown'}
                        </h2>
                        <p className="text-slate-400 mb-8">
                            {isSystemShutdown 
                                ? 'The platform is currently in maintenance mode. Users cannot access the site.' 
                                : 'Activating this will instantly disconnect all users and put the platform in Under Development mode.'}
                        </p>

                        <div className="w-full space-y-4 text-left mb-8">
                            <div>
                                <label className="form-label text-red-400">Developer Name for Maintenance Page</label>
                                <input 
                                    type="text" 
                                    value={developerName}
                                    onChange={(e) => setDeveloperName(e.target.value)}
                                    className="input-field border-red-500/30 focus:border-red-500 bg-black/40"
                                    placeholder="Enter your name"
                                    disabled={isSystemShutdown}
                                />
                            </div>
                        </div>

                        <button 
                            onClick={handleSystemToggle}
                            className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-xl ${
                                isSystemShutdown 
                                    ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-500/30' 
                                    : 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/30'
                            }`}
                        >
                            {isSystemShutdown ? 'RESTORE SYSTEM OPERATIONS' : 'INITIATE COMPLETE SHUTDOWN'}
                        </button>
                    </div>
                </div>
            )}

            {/* Blue Zone */}
            {activeTab === 'BLUE' && (
                <div className="glass-card p-8 border-blue-500/30 bg-blue-950/10 animate-fade-in space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-blue-400 flex items-center gap-2">
                                <Activity size={24} /> Advanced User Telemetry & Control
                            </h2>
                            <p className="text-slate-400 text-sm mt-1">Real-time supervision, click-feed integrity monitoring, and immediate intervention panel.</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-blue-500/20 text-slate-400 text-sm">
                                    <th className="p-4 font-medium">User & Device ID</th>
                                    <th className="p-4 font-medium">Network Status</th>
                                    <th className="p-4 font-medium">Live Action Feed</th>
                                    <th className="p-4 font-medium text-right">Interventions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dbLoading ? (
                                    <tr><td colSpan={4} className="p-8 text-center text-slate-500 animate-pulse">Loading users from database...</td></tr>
                                ) : dbUsers.length === 0 ? (
                                    <tr><td colSpan={4} className="p-8 text-center text-slate-500">No registered users found.</td></tr>
                                ) : (
                                    dbUsers.map((dbUser, idx) => {
                                        // Merge with live telemetry if user is online
                                        const liveData = telemetryUsers.find(t => t.user_id === dbUser.id)
                                        const isOnline = !!liveData
                                        const isActive = liveData?.is_active
                                        
                                        // Feature 2: Multi-Account Detection
                                        const isMultiAccount = isOnline && telemetryUsers.filter(u => u.device_id === liveData?.device_id).length > 1
                                        
                                        // Feature 6: Geo-Fencing Warning
                                        const isForeign = liveData?.location && !liveData.location.toLowerCase().includes('bangladesh')

                                        return (
                                            <tr key={idx} className={`border-b transition-colors ${isMultiAccount ? 'bg-red-500/10 border-red-500/30' : 'border-white/5 hover:bg-white/5'}`}>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-white">{dbUser.whatsapp || 'Unknown'}</span>
                                                        {isMultiAccount && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider animate-pulse">Dual Acc Risk</span>}
                                                    </div>
                                                    <div className="text-xs text-slate-400 mt-1">{dbUser.full_name || 'N/A'} • {dbUser.role}</div>
                                                    <div className="text-xs font-mono mt-1 text-slate-500">DID: {liveData?.device_id?.slice(0, 15) || 'Offline'}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`w-2 h-2 rounded-full ${isOnline ? (isActive ? 'bg-green-500 animate-pulse' : 'bg-amber-500') : 'bg-slate-600'}`}></span>
                                                        <span className={`${isOnline ? (isActive ? 'text-green-500' : 'text-amber-500') : 'text-slate-500'} text-sm font-medium`}>
                                                            {isOnline ? (isActive ? 'Active on Screen' : 'Away / Minimized') : 'Offline'}
                                                        </span>
                                                    </div>
                                                    {isOnline && (
                                                        <div className="text-xs text-slate-300 flex items-center gap-2 mt-1">
                                                            <Smartphone size={12} className="text-blue-400"/> {liveData?.device || 'Unknown'}
                                                            {liveData?.is_pwa && <span className="text-green-400 text-[10px] border border-green-500/30 px-1 rounded">PWA</span>}
                                                        </div>
                                                    )}
                                                    {isForeign && <div className="text-xs text-yellow-500 mt-1 flex items-center gap-1"><AlertTriangle size={12}/> Foreign Traffic</div>}
                                                </td>
                                                <td className="p-4 max-w-[250px]">
                                                    {isOnline ? (
                                                        <>
                                                            <div className="flex bg-slate-900 border border-slate-700/50 p-2 rounded-lg items-center gap-2">
                                                                <div className="shrink-0 text-indigo-400"><Activity size={14} className={isActive ? "animate-pulse" : ""} /></div>
                                                                <div className="truncate text-sm font-mono text-cyan-300 w-full" title={liveData?.last_action}>
                                                                    {liveData?.last_action || 'No action recorded'}
                                                                </div>
                                                            </div>
                                                            <div className="text-xs text-yellow-500 mt-1 truncate">Current: {liveData?.current_path}</div>
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-slate-600 font-mono">No live session</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex flex-col gap-2 items-end">
                                                        <button 
                                                            onClick={async () => {
                                                                if(confirm(`Login as ${dbUser.whatsapp}?`)) {
                                                                    const res = await loginAsUser(dbUser.id)
                                                                    if (res?.error) alert(res.error)
                                                                }
                                                            }}
                                                            className="text-xs bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded transition shadow"
                                                        >
                                                            Login As User
                                                        </button>
                                                        {isOnline && (
                                                            <button 
                                                                onClick={async () => {
                                                                    if(confirm(`Force KILL session for ${dbUser.whatsapp}?`)) {
                                                                        const ch = supabase.channel('skyx-telemetry')
                                                                        await ch.send({ type: 'broadcast', event: 'remote-kill', payload: { user_id: dbUser.id } })
                                                                        alert('Kill signal sent!')
                                                                    }
                                                                }}
                                                                className="text-xs bg-red-600/20 hover:bg-red-600 border border-red-500/50 text-red-400 hover:text-white px-3 py-1.5 rounded transition"
                                                            >
                                                                Force Kill Session
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Hidden Security Zone */}
            {activeTab === 'HIDDEN' && (
                <div className="glass-card p-8 border-indigo-500/30 bg-indigo-950/10 animate-fade-in space-y-8">
                    <div>
                        <h2 className="text-xl font-bold text-indigo-400 flex items-center gap-2">
                            <Shield size={24} /> Advanced User Interventions
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">Trigger system-level push events and remote surveillance capabilities.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Notify Section */}
                        <div className="border border-indigo-500/20 bg-black/40 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-indigo-300 flex items-center gap-2">
                                    <Bell size={18} /> Global Device Push Config
                                </h3>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed mb-4">
                                Send a system-level popup notification to the user's device. 
                                Message will overlay the screen for 5 seconds even if they are not actively browsing the site (PWA/Push API required).
                            </p>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-indigo-400 font-medium">Target User ID (or "All")</label>
                                    <input id="notifyTarget" type="text" className="input-field mt-1 text-sm bg-indigo-950/30 font-mono" defaultValue="All" />
                                </div>
                                <div>
                                    <label className="text-xs text-indigo-400 font-medium">Notification Message</label>
                                    <textarea id="notifyMsg" className="input-field mt-1 text-sm bg-indigo-950/30" rows={3} placeholder="Please complete your pending tasks..."></textarea>
                                </div>
                                <button onClick={handleSendPush} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-sm transition-colors shadow-lg shadow-indigo-500/20">
                                    Fire Web Push Event
                                </button>
                            </div>
                        </div>

                        {/* Screenshot / Overseer Section */}
                        <div className="border border-indigo-500/20 bg-black/40 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-rose-400 flex items-center gap-2">
                                    <Camera size={18} /> Live Screen Surveillance
                                </h3>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed mb-4">
                                Trigger an automated snapshot of the user's current webpage state to verify their activity.
                                <br/><span className="text-yellow-500">Note: Reading activities outside the browser application is restricted by OS level sandboxing.</span>
                            </p>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-rose-400 font-medium">Monitor Target User ID</label>
                                    <input id="screenTarget" type="text" className="input-field mt-1 text-sm bg-rose-950/20 font-mono" placeholder="User ID" />
                                </div>
                                
                                <div className="border border-dashed border-rose-500/30 bg-black/60 rounded-lg aspect-video flex flex-col items-center justify-center text-slate-500 overflow-hidden relative">
                                    {screenLoading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><span className="animate-spin text-white">⚙️</span></div>}
                                    {screenBlob ? (
                                        <img src={screenBlob} alt="Remote Screenshot" className="w-full h-full object-cover" />
                                    ) : (
                                        <>
                                            <Camera size={32} className="mb-2 opacity-50" />
                                            <span className="text-xs font-semibold">Feed Offline</span>
                                        </>
                                    )}
                                </div>

                                <button onClick={handleTakeScreenshot} className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-medium text-sm transition-colors shadow-lg shadow-rose-500/20 flex flex-col items-center">
                                    <span>Capture Active Session</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* INFO Zone */}
            {activeTab === 'INFO' && (
                <div className="glass-card p-8 border-emerald-500/30 bg-emerald-950/10 animate-fade-in">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
                                <Globe size={24} /> Global IP & Geolocation Network
                            </h2>
                            <p className="text-slate-400 text-sm mt-1">Live tracking of active user originating IPs and physical location blocks.</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-emerald-500/20 text-slate-400 text-sm">
                                    <th className="p-4 font-medium">User Profile</th>
                                    <th className="p-4 font-medium">IP Address</th>
                                    <th className="p-4 font-medium">Geolocation Data</th>
                                    <th className="p-4 font-medium">Network Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dbLoading ? (
                                    <tr><td colSpan={4} className="p-8 text-center text-slate-500 animate-pulse">Loading users from database...</td></tr>
                                ) : dbUsers.length === 0 ? (
                                    <tr><td colSpan={4} className="p-8 text-center text-slate-500">No registered users found.</td></tr>
                                ) : (
                                    dbUsers.map((dbUser, idx) => {
                                        const liveInfo = telemetryUsers.find(t => t.user_id === dbUser.id)
                                        const isOnline = !!liveInfo
                                        return (
                                            <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="p-4">
                                                    <div className="font-semibold text-white">{dbUser.full_name || 'N/A'}</div>
                                                    <div className="text-xs text-slate-500">{dbUser.whatsapp || 'Unknown'}</div>
                                                    <div className="text-xs text-slate-600 mt-0.5">Joined: {new Date(dbUser.created_at).toLocaleDateString()}</div>
                                                </td>
                                                <td className="p-4">
                                                    {isOnline ? (
                                                        <div className="font-mono text-emerald-400 tracking-wider text-sm bg-emerald-500/10 inline-block px-2 py-1 rounded">
                                                            {liveInfo.ip || 'Fetching...'}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-600 text-sm font-mono">Not tracked</span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    {isOnline ? (
                                                        <div className="text-sm text-slate-200">
                                                            📍 {liveInfo.location || 'Unknown'}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-600 text-sm">Offline</span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-2 h-2 rounded-full ${isOnline ? (liveInfo.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500') : 'bg-slate-600'}`}></span>
                                                        <span className={`text-sm font-medium ${isOnline ? (liveInfo.is_active ? 'text-emerald-500' : 'text-amber-500') : 'text-slate-500'}`}>
                                                            {isOnline ? (liveInfo.is_active ? 'Connected' : 'Background') : 'Offline'}
                                                        </span>
                                                    </div>
                                                    {isOnline && (
                                                        <div className="text-xs text-slate-500 mt-1">
                                                            {new Date(liveInfo.last_updated).toLocaleTimeString()}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
