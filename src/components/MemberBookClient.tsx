'use client'

import { useState } from 'react'
import { Search, Phone, User, Users, BookOpen, Calendar, Filter, X } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface MemberBookClientProps {
    initialMembers: any[]
    title: string
    subtitle: string
}

export default function MemberBookClient({ initialMembers, title, subtitle }: MemberBookClientProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')

    const filteredMembers = initialMembers.filter(m => {
        const matchesSearch = 
            m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.whatsapp?.includes(searchTerm) ||
            m.referred_by_user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
        
        const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter

        return matchesSearch && matchesStatus
    })

    const activeCount = initialMembers.filter(m => m.status === 'ACTIVE').length
    const pendingCount = initialMembers.filter(m => m.status === 'INACTIVE' || m.status === 'PENDING').length

    return (
        <div className="space-y-6">
            <div className="page-header">
                <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: '#e2e8f0' }}>
                    <BookOpen size={24} className="text-sky-400" /> {title}
                </h1>
                <p className="text-sm mt-1" style={{ color: '#64748b' }}>{subtitle}</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="glass-card p-4 border-l-4 border-sky-500">
                    <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Total Members</div>
                    <div className="text-2xl font-black text-white">{initialMembers.length}</div>
                </div>
                <div className="glass-card p-4 border-l-4 border-emerald-500">
                    <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Active Now</div>
                    <div className="text-2xl font-black text-emerald-400">{activeCount}</div>
                </div>
                <div className="glass-card p-4 border-l-4 border-amber-500">
                    <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Pending</div>
                    <div className="text-2xl font-black text-amber-400">{pendingCount}</div>
                </div>
                <div className="glass-card p-4 border-l-4 border-indigo-500">
                    <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Filtered</div>
                    <div className="text-2xl font-black text-indigo-400">{filteredMembers.length}</div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, phone, or referrer..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field pl-10 w-full bg-black/20"
                    />
                    {searchTerm && (
                        <button 
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
                <div className="flex gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="input-field bg-black/20 text-sm font-semibold min-w-[140px]"
                    >
                        <option value="ALL">All Status</option>
                        <option value="ACTIVE">Active Only</option>
                        <option value="INACTIVE">Inactive Only</option>
                        <option value="SUSPENDED">Suspended</option>
                    </select>
                </div>
            </div>

            {/* Registry List */}
            <div className="glass-card overflow-hidden">
                <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-slate-300 text-sm">
                        <Users size={16} className="text-sky-400" />
                        Member Registry
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                        Showing {filteredMembers.length} of {initialMembers.length}
                    </div>
                </div>

                {filteredMembers.length === 0 ? (
                    <div className="p-16 text-center">
                        <Search size={48} className="mx-auto mb-4 opacity-10 text-slate-400" />
                        <p className="text-slate-500 font-medium">No matches found.</p>
                        <button onClick={() => {setSearchTerm(''); setStatusFilter('ALL');}} className="text-sky-400 text-sm mt-2 hover:underline">
                            Clear all filters
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {filteredMembers.map((m, i) => (
                            <div key={m.id} className="p-4 sm:p-5 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                                {/* Serial */}
                                <div className="hidden sm:flex w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 items-center justify-center text-[10px] font-mono font-bold text-slate-500 shrink-0">
                                    {(i + 1).toString().padStart(2, '0')}
                                </div>

                                {/* Avatar */}
                                <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 font-bold text-lg shadow-inner"
                                    style={{ background: `hsl(${(i * 53) % 360}, 50%, 20%)`, color: `hsl(${(i * 53) % 360}, 70%, 60%)` }}>
                                    {m.full_name?.charAt(0).toUpperCase()}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <span className="font-bold text-white text-sm truncate">{m.full_name}</span>
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                                            m.status === 'ACTIVE' 
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                        }`}>
                                            {m.status}
                                        </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                                        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                                            <Phone size={11} className="text-slate-500" />
                                            <span className="font-mono">{m.whatsapp || '—'}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                                            <Calendar size={11} className="text-slate-500" />
                                            <span>Joined: {formatDate(m.created_at)}</span>
                                        </div>
                                        {m.referred_by_user && (
                                            <div className="flex items-center gap-1.5 text-sky-500/70 text-[10px] sm:col-span-1">
                                                <User size={10} />
                                                <span className="truncate">Ref: <span className="font-bold">{m.referred_by_user.full_name}</span></span>
                                            </div>
                                        )}
                                        {m.trainer && (
                                            <div className="flex items-center gap-1.5 text-purple-400/70 text-[10px] sm:col-span-1">
                                                <Users size={10} />
                                                <span className="truncate">Trainer: <span className="font-bold">{m.trainer.full_name}</span></span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
