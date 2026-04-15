'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Users, Shield, Award, Edit, Trash2, CheckCircle, AlertCircle, RefreshCw, X, Search, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Team {
    id: string
    name: string
    leader_id: string | null
    created_at: string
    leader: any
    trainers: any[]
    memberCount: number
}

export default function AdminTeamsPage() {
    const supabase = createClient()
    const [teams, setTeams] = useState<Team[]>([])
    const [users, setUsers] = useState<any[]>([])
    const [teamTrainers, setTeamTrainers] = useState<any[]>([])
    
    const [loading, setLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [editingTeamId, setEditingTeamId] = useState<string | null>(null)
    
    // Create Team Form State
    const [newTeamName, setNewTeamName] = useState('')
    const [selectedLeader, setSelectedLeader] = useState('')
    const [selectedTrainers, setSelectedTrainers] = useState<string[]>([])
    
    // Member Add Modal
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false)
    const [selectedTeamIdForMembers, setSelectedTeamIdForMembers] = useState('')
    const [memberSearch, setMemberSearch] = useState('')

    const loadData = useCallback(async () => {
        setLoading(true)
        
        // Load all teams
        const { data: teamsData, error: tErr } = await supabase
            .from('teams')
            .select(`
                id, name, leader_id, created_at,
                leader:users!teams_leader_id_fkey(id, full_name, whatsapp)
            `)
            .order('created_at', { ascending: false })
            
        // Load team trainers
        const { data: ttData, error: ttErr } = await supabase
            .from('team_trainers')
            .select(`
                team_id, trainer_id,
                trainer:users!team_trainers_trainer_id_fkey(id, full_name, whatsapp)
            `)
            
        // Load all relevant users (Leaders, Trainers, Active Members)
        const { data: usersData, error: uErr } = await supabase
            .from('users')
            .select('id, full_name, role, team_id, whatsapp, status')
            
        if (tErr || ttErr || uErr) {
            console.error(tErr, ttErr, uErr)
            setMessage({ type: 'error', text: 'Error loading data' })
            setLoading(false)
            return
        }
        
        // Process teams
        const processedTeams = (teamsData || []).map((t: any) => {
            const trainers = (ttData || [])
                .filter((tt: any) => tt.team_id === t.id)
                .map((tt: any) => tt.trainer)
                
            const memberCount = (usersData || []).filter(u => u.team_id === t.id && u.role === 'MEMBER').length
            
            return {
                ...t,
                trainers,
                memberCount
            }
        })
        
        setTeams(processedTeams)
        setTeamTrainers(ttData || [])
        setUsers(usersData || [])
        setLoading(false)
    }, [supabase])

    useEffect(() => { loadData() }, [loadData])

    const showMsg = (type: string, text: string) => {
        setMessage({ type, text })
        setTimeout(() => setMessage({ type: '', text: '' }), 5000)
    }

    // Toggle logic for trainer selection
    const toggleTrainer = (id: string) => {
        if (selectedTrainers.includes(id)) {
            setSelectedTrainers(prev => prev.filter(t => t !== id))
        } else {
            if (selectedTrainers.length >= 4) {
                showMsg('error', 'Maximum 4 trainers can be added to a team')
                return
            }
            setSelectedTrainers(prev => [...prev, id])
        }
    }

    // Unassigned Leaders & Trainers logic
    const allLeaders = users.filter(u => u.role === 'TEAM_LEADER')
    const allTrainers = users.filter(u => u.role === 'TEAM_TRAINER')
    
    const assignedLeaderIds = teams.map(t => t.leader_id).filter(Boolean)
    const unassignedLeaders = allLeaders.filter(l => 
        !assignedLeaderIds.includes(l.id) || 
        (editingTeamId && l.id === teams.find(t => t.id === editingTeamId)?.leader_id)
    )
    
    const assignedTrainerIds = teamTrainers.map(tt => tt.trainer_id)
    const unassignedTrainers = allTrainers.filter(t => 
        !assignedTrainerIds.includes(t.id) || 
        (editingTeamId && teams.find(tm => tm.id === editingTeamId)?.trainers.some((tr: any) => tr.id === t.id))
    )

    const handleSaveTeam = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newTeamName) return showMsg('error', 'Team name is required')
        if (!selectedLeader) return showMsg('error', 'Team leader is required')
        
        setIsCreating(true)
        
        let teamId = editingTeamId

        if (editingTeamId) {
            // Update Existing Team
            const { error: teamErr } = await supabase
                .from('teams')
                .update({ name: newTeamName, leader_id: selectedLeader })
                .eq('id', editingTeamId)
                
            if (teamErr) {
                setIsCreating(false)
                return showMsg('error', teamErr.message)
            }
            
            // Delete all existing trainers and re-insert
            await supabase.from('team_trainers').delete().eq('team_id', editingTeamId)
            
            if (selectedTrainers.length > 0) {
                const inserts = selectedTrainers.map(tId => ({ team_id: editingTeamId, trainer_id: tId }))
                await supabase.from('team_trainers').insert(inserts)
            }
            
            showMsg('success', 'Team updated successfully!')
        } else {
            // Insert New Team
            const { data: newTeam, error: teamErr } = await supabase
                .from('teams')
                .insert({ name: newTeamName, leader_id: selectedLeader })
                .select('*').single()
                
            if (teamErr || !newTeam) {
                setIsCreating(false)
                return showMsg('error', teamErr?.message || 'Failed to create team')
            }
            
            teamId = newTeam.id
            
            if (selectedTrainers.length > 0) {
                const inserts = selectedTrainers.map(tId => ({ team_id: newTeam.id, trainer_id: tId }))
                await supabase.from('team_trainers').insert(inserts)
            }
            
            showMsg('success', 'Team created successfully!')
        }
        
        // Update user rows for team_id consistency
        if (teamId) {
            await supabase.from('users').update({ team_id: teamId }).eq('id', selectedLeader)
            if(selectedTrainers.length > 0) {
                await supabase.from('users').update({ team_id: teamId }).in('id', selectedTrainers)
            }
        }

        setNewTeamName('')
        setSelectedLeader('')
        setSelectedTrainers([])
        setEditingTeamId(null)
        setIsCreating(false)
        loadData()
    }

    const cancelEdit = () => {
        setEditingTeamId(null)
        setNewTeamName('')
        setSelectedLeader('')
        setSelectedTrainers([])
    }
    
    // Handle Map Member
    const handleMapMember = async (userId: string, targetTeamId: string) => {
        const { error } = await supabase.from('users').update({ team_id: targetTeamId }).eq('id', userId)
        if (error) {
            showMsg('error', error.message)
        } else {
            showMsg('success', 'Member mapped successfully!')
            loadData()
        }
    }

    const handleDeleteTeam = async (teamId: string) => {
        if (!confirm('Are you sure you want to delete this team? This will unassign all members, leaders, and trainers from this team.')) return

        setLoading(true)
        const { error } = await supabase.from('teams').delete().eq('id', teamId)
        
        if (error) {
            console.error('Delete error:', error)
            showMsg('error', error.message || 'Error deleting team')
            setLoading(false)
        } else {
            showMsg('success', 'Team deleted successfully!')
            loadData()
        }
    }

    const unassignedAndActiveMembers = users.filter(u => u.role === 'MEMBER' && u.status === 'ACTIVE')
    const filteredMembersForModal = unassignedAndActiveMembers.filter(u => 
        u.full_name?.toLowerCase().includes(memberSearch.toLowerCase()) || 
        u.whatsapp?.includes(memberSearch)
    )

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="page-header">
                <h1 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>Team Mapping System</h1>
                <p className="text-sm mt-1" style={{ color: '#64748b' }}>
                    Create teams, assign leaders/trainers, and map members to teams.
                </p>
            </div>
            
            {message.text && (
                <div className={cn('flex items-center gap-2 p-4 rounded-xl text-sm font-semibold',
                    message.type === 'success' ? 'text-emerald-300' : 'text-red-300')}
                    style={{
                        background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
                    }}>
                    {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    {message.text}
                </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* ── LEFT COLUMN: CREATION & UNASSIGNED ───────────────────────────── */}
                <div className="space-y-6 lg:col-span-1">
                    
                    {/* Create / Edit Team Form */}
                    <div className="glass-card p-5">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                                {editingTeamId ? <Edit size={18} className="text-amber-400" /> : <Shield size={18} className="text-sky-400" />}
                                <h2 className="font-bold text-white uppercase">{editingTeamId ? 'Edit Team Details' : 'Create New Team'}</h2>
                            </div>
                            {editingTeamId && (
                                <button onClick={cancelEdit} className="text-slate-400 hover:text-white p-1 bg-white/5 rounded">
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                        
                        <form onSubmit={handleSaveTeam} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Team Name</label>
                                <input
                                    type="text"
                                    value={newTeamName}
                                    onChange={e => setNewTeamName(e.target.value)}
                                    className="input-field w-full"
                                    placeholder="e.g. Alpha Squad"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Select Leader (1)</label>
                                <select 
                                    value={selectedLeader}
                                    onChange={e => setSelectedLeader(e.target.value)}
                                    className="input-field w-full"
                                    required
                                >
                                    <option value="">-- Choose a Leader --</option>
                                    {unassignedLeaders.map(l => (
                                        <option key={l.id} value={l.id}>{l.full_name} ({l.whatsapp})</option>
                                    ))}
                                </select>
                                {unassignedLeaders.length === 0 && (
                                    <p className="text-[10px] text-amber-500 mt-1">No unassigned TEAM_LEADER users available.</p>
                                )}
                            </div>
                            
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">
                                    Select Trainers (Max 4)
                                </label>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                    {unassignedTrainers.length === 0 ? (
                                        <div className="text-xs text-slate-500 italic p-2 border border-slate-800 rounded">No unassigned trainers available</div>
                                    ) : (
                                        unassignedTrainers.map(t => (
                                            <div key={t.id} 
                                                onClick={() => toggleTrainer(t.id)}
                                                className={cn("p-2 rounded-lg cursor-pointer border text-sm transition-all flex items-center justify-between",
                                                    selectedTrainers.includes(t.id) 
                                                        ? "bg-slate-800/80 border-sky-500/50 text-white" 
                                                        : "bg-transparent border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-white/5"
                                                )}>
                                                <span>{t.full_name}</span>
                                                {selectedTrainers.includes(t.id) && <CheckCircle size={14} className="text-emerald-400" />}
                                            </div>
                                        ))
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 mt-2">Selected: {selectedTrainers.length}/4</p>
                            </div>
                            
                            <div className="flex gap-2">
                                <button 
                                    type="submit" 
                                    disabled={isCreating || !newTeamName || !selectedLeader}
                                    className={cn("flex-1 py-3 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all text-white", 
                                        editingTeamId ? "bg-amber-600 hover:bg-amber-500" : "btn-primary")}>
                                    {isCreating ? <RefreshCw size={16} className="animate-spin" /> : (editingTeamId ? <CheckCircle size={16} /> : <Plus size={16} />)}
                                    {editingTeamId ? 'Save Changes' : 'Create Team'}
                                </button>
                                {editingTeamId && (
                                    <button 
                                        type="button" 
                                        onClick={cancelEdit}
                                        className="py-3 px-4 rounded-xl border border-slate-700 hover:bg-white/5 text-slate-300 font-bold transition-all">
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>

                {/* ── RIGHT COLUMN: EXISTING TEAMS ───────────────────────────── */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Users size={20} className="text-indigo-400" />
                            Active Teams
                        </h2>
                        <button onClick={loadData} className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all">
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    {loading ? (
                        <div className="glass-card p-12 text-center">
                            <RefreshCw size={30} className="animate-spin mx-auto text-slate-600 mb-3" />
                            <p className="text-slate-400 text-sm">Loading teams...</p>
                        </div>
                    ) : teams.length === 0 ? (
                        <div className="glass-card p-12 text-center">
                            <Shield size={40} className="mx-auto text-slate-700 mb-3" />
                            <p className="text-slate-400">No teams created yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {teams.map(team => (
                                <div key={team.id} className="glass-card p-5 border-l-4" style={{ borderLeftColor: '#3b82f6' }}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-black text-lg text-white">{team.name}</h3>
                                            <p className="text-xs text-slate-500 mt-0.5">Created {new Date(team.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <div className="bg-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                                            <Users size={12} className="text-sky-400" />
                                            {team.memberCount} Members
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3 mb-5">
                                        <div className="bg-white/5 p-2.5 rounded-lg border border-white/5">
                                            <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Team Leader</div>
                                            <div className="flex items-center gap-2">
                                                <Award size={14} className="text-amber-400" />
                                                <span className="text-sm font-semibold text-slate-200">
                                                    {team.leader?.full_name || 'No Leader'}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-white/5 p-2.5 rounded-lg border border-white/5">
                                            <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Trainers ({team.trainers.length})</div>
                                            {team.trainers.length === 0 ? (
                                                <div className="text-xs text-slate-500">No trainers assigned</div>
                                            ) : (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {team.trainers.map((tr: any) => (
                                                        <span key={tr.id} className="text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded">
                                                            {tr.full_name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <button 
                                            onClick={() => {
                                                setSelectedTeamIdForMembers(team.id)
                                                setIsMemberModalOpen(true)
                                                setMemberSearch('')
                                            }}
                                            className="flex-1 py-2.5 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 hover:text-sky-300 rounded-lg text-sm font-bold flex justify-center items-center gap-2 transition-all border border-sky-500/20">
                                            <UserPlus size={16} /> Manage Members
                                        </button>
                                        <button 
                                            onClick={() => {
                                                window.scrollTo({ top: 0, behavior: 'smooth' })
                                                setEditingTeamId(team.id)
                                                setNewTeamName(team.name)
                                                setSelectedLeader(team.leader_id || '')
                                                setSelectedTrainers(team.trainers.map((t: any) => t.id))
                                            }}
                                            className="px-4 py-2.5 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 hover:text-amber-400 rounded-lg text-sm font-bold flex justify-center items-center gap-2 transition-all border border-amber-500/20">
                                            <Edit size={16} /> Edit
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteTeam(team.id)}
                                            className="px-4 py-2.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-sm font-bold flex justify-center items-center gap-2 transition-all border border-red-500/20"
                                            title="Delete Team">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── MEMBER MANAGEMENT MODAL ───────────────────────────── */}
            {isMemberModalOpen && selectedTeamIdForMembers && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
                    <div className="glass-card w-full max-w-2xl my-6 sm:my-10 flex flex-col shadow-2xl overflow-hidden animate-slide-up">
                        
                        {/* Header */}
                        <div className="p-4 border-b flex justify-between items-center bg-slate-900" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Users size={18} className="text-sky-400" />
                                Add Members to {teams.find(t => t.id === selectedTeamIdForMembers)?.name}
                            </h2>
                            <button onClick={() => setIsMemberModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                                <X size={20} />
                            </button>
                        </div>
                        
                        {/* Body - member list */}
                        <div className="p-4 flex-1 overflow-hidden flex flex-col bg-slate-900">
                            <div className="relative mb-4">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search active members by name or phone..." 
                                    value={memberSearch}
                                    onChange={e => setMemberSearch(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 text-sm rounded-xl pl-9 pr-4 py-2.5 text-white focus:outline-none focus:border-sky-500 transition-all"
                                />
                            </div>
                            
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                                {filteredMembersForModal.length === 0 ? (
                                    <p className="text-center text-slate-500 text-sm py-10">No members found matching your search.</p>
                                ) : (
                                    filteredMembersForModal.map(u => {
                                        const isAlreadyInThisTeam = u.team_id === selectedTeamIdForMembers
                                        const isInAnotherTeam = u.team_id && u.team_id !== selectedTeamIdForMembers
                                        const teamName = isInAnotherTeam ? teams.find(t => t.id === u.team_id)?.name : null
                                        
                                        return (
                                            <div key={u.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-800/30 transition-all">
                                                <div>
                                                    <div className="font-semibold text-sm text-slate-200">{u.full_name}</div>
                                                    <div className="text-xs text-slate-500">{u.whatsapp}</div>
                                                    
                                                    {isAlreadyInThisTeam ? (
                                                        <span className="inline-block mt-1 text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-medium border border-emerald-500/20">
                                                            Already mapped this team
                                                        </span>
                                                    ) : isInAnotherTeam ? (
                                                        <span className="inline-block mt-1 text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-medium border border-amber-500/20">
                                                            Currently in: {teamName || 'Another Team'}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-block mt-1 text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-medium">
                                                            Unassigned
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                <button 
                                                    onClick={() => handleMapMember(u.id, selectedTeamIdForMembers)}
                                                    disabled={isAlreadyInThisTeam}
                                                    className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-all", 
                                                        isAlreadyInThisTeam 
                                                            ? "bg-emerald-500/20 text-emerald-500 opacity-50 cursor-not-allowed" 
                                                            : isInAnotherTeam
                                                                ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30"
                                                                : "bg-sky-500 text-white hover:bg-sky-600 shadow-lg shadow-sky-500/20"
                                                    )}>
                                                    {isAlreadyInThisTeam ? 'Mapped' : isInAnotherTeam ? 'Reassign Here' : 'Add to Team'}
                                                </button>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
