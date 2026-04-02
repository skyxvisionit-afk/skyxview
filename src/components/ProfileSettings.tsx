'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile } from '@/lib/types'
import {
    User, Mail, Phone, Shield, Calendar, Trash2,
    Save, Camera, CheckCircle, AlertCircle, Key,
    MapPin, TextQuote, Users
} from 'lucide-react'
import { formatDate, getRoleLabel, getRoleColor, cn } from '@/lib/utils'

interface ProfileSettingsProps {
    profile: UserProfile
}

export default function ProfileSettings({ profile }: ProfileSettingsProps) {
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [form, setForm] = useState({
        full_name: profile.full_name,
        email: profile.email || '',
        bio: profile.bio || '',
        address: profile.address || '',
        gender: profile.gender || '',
    })

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage({ type: '', text: '' })

        const { error } = await supabase
            .from('users')
            .update({
                full_name: form.full_name,
                email: form.email,
                bio: form.bio,
                address: form.address,
                gender: form.gender,
            })
            .eq('id', profile.id)

        if (error) {
            setMessage({ type: 'error', text: error.message || 'Failed to update profile.' })
        } else {
            setMessage({ type: 'success', text: 'Profile updated successfully!' })
            setTimeout(() => window.location.reload(), 1500)
        }
        setLoading(false)
    }

    const handleDeleteAccount = async () => {
        setDeleting(true)
        setMessage({ type: '', text: '' })

        // Call the RPC function to delete account from both tables
        const { error } = await supabase.rpc('delete_own_account')

        if (error) {
            console.error('Delete error:', error)
            setMessage({ type: 'error', text: 'Failed to delete account. Make sure you run the SQL script provided.' })
            setDeleting(false)
            setShowDeleteConfirm(false)
        } else {
            await supabase.auth.signOut()
            window.location.href = '/'
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up pb-10">
            {/* Unique Profile Card */}
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-600 to-emerald-500 opacity-20" />

                <div className="relative pt-12 pb-8 px-8 flex flex-col items-center sm:items-start sm:flex-row gap-6">
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center text-3xl font-bold text-white shadow-xl ring-4 ring-slate-900">
                            {profile.full_name.charAt(0).toUpperCase()}
                        </div>
                        <button className="absolute -bottom-2 -right-2 p-2 bg-slate-800 rounded-lg border border-white/10 text-white hover:bg-slate-700 transition-colors shadow-lg">
                            <Camera size={14} />
                        </button>
                    </div>

                    <div className="text-center sm:text-left flex-1">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-white">{profile.full_name}</h1>
                            <span className={cn("badge px-3 py-1 text-xs", getRoleColor(profile.role))}>
                                {getRoleLabel(profile.role)}
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-slate-400 text-sm">
                            <div className="flex items-center gap-1.5">
                                <Phone size={14} className="text-emerald-500" />
                                {profile.whatsapp}
                            </div>
                            {profile.email && (
                                <div className="flex items-center gap-1.5">
                                    <Mail size={14} className="text-blue-500" />
                                    {profile.email}
                                </div>
                            )}
                            <div className="flex items-center gap-1.5">
                                <Calendar size={14} className="text-purple-500" />
                                Joined {formatDate(profile.created_at)}
                            </div>
                        </div>
                        {profile.bio && (
                            <p className="mt-3 text-sm text-slate-300 italic max-w-lg mx-auto sm:mx-0">
                                "{profile.bio}"
                            </p>
                        )}
                    </div>

                    <div className="sm:text-right flex flex-col items-center sm:items-end gap-3">
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-white/5 divide-x divide-white/5">
                    <div className="p-4 text-center">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Status</p>
                        <p className={cn("text-sm font-bold", profile.status === 'ACTIVE' ? "text-emerald-400" : "text-amber-400")}>
                            {profile.status}
                        </p>
                    </div>
                    <div className="p-4 text-center">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Gender</p>
                        <p className="text-sm font-bold text-slate-300 capitalize">{profile.gender || 'Not Set'}</p>
                    </div>
                    <div className="p-4 text-center">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Location</p>
                        <p className="text-sm font-bold text-blue-400 truncate px-2">{profile.address || 'Global'}</p>
                    </div>
                    <div className="p-4 text-center">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Verification</p>
                        <p className="text-sm font-bold text-emerald-400 flex items-center justify-center gap-1">
                            <Shield size={12} /> {profile.status === 'ACTIVE' ? 'Verified' : 'Pending'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Edit Info Form */}
            <div className="grid sm:grid-cols-3 gap-8">
                <div className="sm:col-span-2 space-y-6">
                    <div className="glass-card p-8">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <User size={20} className="text-blue-500" />
                            Personal Information
                        </h2>

                        {message.text && (
                            <div className={cn("alert mb-6", message.type === 'success' ? "alert-success" : "alert-error")}>
                                {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleUpdate} className="space-y-6">
                            <div className="grid sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="form-label">Full Name</label>
                                    <div className="relative">
                                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input
                                            type="text"
                                            className="input-field pl-10"
                                            value={form.full_name}
                                            onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="form-label">Email Address</label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input
                                            type="email"
                                            className="input-field pl-10"
                                            value={form.email}
                                            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="form-label">Gender</label>
                                    <div className="relative">
                                        <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <select
                                            className="select-field pl-10"
                                            value={form.gender}
                                            onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="form-label">Home Address</label>
                                    <div className="relative">
                                        <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input
                                            type="text"
                                            className="input-field pl-10"
                                            placeholder="City, Country"
                                            value={form.address}
                                            onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="form-label">Profile Bio</label>
                                <div className="relative">
                                    <TextQuote size={16} className="absolute left-3 top-4 text-slate-500" />
                                    <textarea
                                        className="input-field pl-10 min-h-[100px] py-3"
                                        placeholder="Write something about yourself..."
                                        value={form.bio}
                                        onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-800/50 border border-white/5">
                                <label className="form-label mb-1">WhatsApp Number (Login ID)</label>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-white font-medium">
                                        <Phone size={16} className="text-emerald-500" />
                                        {profile.whatsapp}
                                    </div>
                                    <span className="text-[10px] bg-slate-700 text-slate-400 px-2 py-1 rounded uppercase tracking-tighter">Read Only</span>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-2">WhatsApp number is used as your unique login ID and cannot be changed manually.</p>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    className="btn-primary w-full sm:w-auto px-8 py-3"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Saving Changes...
                                        </span>
                                    ) : (
                                        <><Save size={18} /> Update Profile</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Account Stats / Info */}
                    <div className="glass-card p-6 border-blue-500/10">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Account Security</h3>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-slate-500">Identity</span>
                                <span className="text-emerald-500 font-medium">Verified User</span>
                            </div>
                        </div>
                    </div>

                    {/* Delete Account */}
                    <div className="glass-card p-6 border-red-500/10">
                        <h3 className="text-sm font-bold text-red-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Trash2 size={14} /> Danger Zone
                        </h3>
                        <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
                            Once you delete your account, there is no going back. All your data including commissions will be permanently removed from our system.
                        </p>

                        {!showDeleteConfirm ? (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="w-full py-2.5 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-all text-xs font-bold"
                            >
                                Delete Account
                            </button>
                        ) : (
                            <div className="space-y-3 animate-fade-in">
                                <p className="text-[10px] text-red-500 font-bold text-center">Are you absolute sure?</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleDeleteAccount}
                                        disabled={deleting}
                                        className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold"
                                    >
                                        {deleting ? 'Deleting...' : 'Yes, Delete'}
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
