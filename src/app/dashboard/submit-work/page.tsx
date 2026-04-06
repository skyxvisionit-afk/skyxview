'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Upload, CheckCircle, Briefcase, User, FileText,
    Database, Image, Video, Palette, Package, Share2, ClipboardList, AlertCircle, X, ArrowRight
} from 'lucide-react'

const WORK_TYPES = [
    { value: 'data-entry', label: 'Data Entry', icon: Database, color: '#06b6d4', desc: 'Spreadsheets, databases, catalogues' },
    { value: 'form-fillup', label: 'Form Fillup', icon: FileText, color: '#0ea5e9', desc: 'Online or offline form completion' },
    { value: 'photo-editing', label: 'Photo Editing', icon: Image, color: '#8b5cf6', desc: 'Image retouching & enhancements' },
    { value: 'video-editing', label: 'Video Editing', icon: Video, color: '#ec4899', desc: 'Clips, reels and full productions' },
    { value: 'graphic-design', label: 'Graphic Design', icon: Palette, color: '#f59e0b', desc: 'Logos, banners and creatives' },
    { value: 'pen-packaging', label: 'Pen Packaging', icon: Package, color: '#10b981', desc: 'Pen assembly and packaging' },
    { value: 'soap-packaging', label: 'Soap Packaging', icon: Package, color: '#14b8a6', desc: 'Soap wrapping and packaging' },
    { value: 'social-media', label: 'Social Media', icon: Share2, color: '#f97316', desc: 'Posts, campaigns and content' },
    { value: 'copy-paste', label: 'Copy Paste', icon: ClipboardList, color: '#6366f1', desc: 'Text copying and data transfer' },
]

export default function SubmitWorkPage() {
    const [step, setStep] = useState<'select' | 'details' | 'success'>('select')
    const [selectedWork, setSelectedWork] = useState<string>('')
    const [fullName, setFullName] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [notes, setNotes] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [dragOver, setDragOver] = useState(false)
    const [userProfile, setUserProfile] = useState<{ full_name: string } | null>(null)
    const fileRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const fetchProfile = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            const { data } = await supabase.from('users').select('full_name').eq('id', user.id).single()
            if (data) {
                setUserProfile(data)
                setFullName(data.full_name)
            }
        }
        fetchProfile()
    }, [])

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(false)
        const dropped = e.dataTransfer.files[0]
        if (dropped) setFile(dropped)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        if (!selectedWork) return setError('Please select a work type.')
        if (!fullName.trim()) return setError('Please enter your full name.')

        setSubmitting(true)
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            let fileUrl: string | null = null

            if (file) {
                const ext = file.name.split('.').pop()
                const path = `work-submissions/${user.id}/${Date.now()}.${ext}`
                const { error: upErr } = await supabase.storage.from('work-files').upload(path, file)
                if (upErr) throw new Error('File upload failed: ' + upErr.message)
                const { data: urlData } = supabase.storage.from('work-files').getPublicUrl(path)
                fileUrl = urlData.publicUrl
            }

            const { error: insertErr } = await supabase.from('work_submissions').insert({
                user_id: user.id,
                full_name: fullName.trim(),
                work_type: selectedWork,
                notes: notes.trim() || null,
                file_url: fileUrl,
                status: 'PENDING',
            })

            if (insertErr) throw insertErr
            setStep('success')
        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Submission failed. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    const selectedType = WORK_TYPES.find(w => w.value === selectedWork)

    if (step === 'success') {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-fade-in-up">
                <div className="relative mb-8">
                    <div className="w-28 h-28 rounded-[2rem] flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(16,185,129,0.05))' }}>
                        <div className="absolute inset-0 rounded-[2rem] border-2 border-emerald-500/30 animate-pulse" />
                        <CheckCircle size={52} className="text-emerald-400" />
                    </div>
                </div>
                <h1 className="text-3xl font-black text-white mb-3 text-center">Work Submitted!</h1>
                <p className="text-slate-400 text-center max-w-sm mb-8 leading-relaxed">
                    Your <span className="text-emerald-400 font-semibold">{selectedType?.label}</span> work has been submitted successfully. Our admin team will review it shortly.
                </p>
                <div className="glass-card p-6 w-full max-w-sm border border-emerald-500/20 bg-emerald-500/5 mb-6 text-sm text-slate-300 space-y-2">
                    <div className="flex justify-between"><span className="text-slate-500">Work Type</span><span className="font-semibold">{selectedType?.label}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Name</span><span className="font-semibold">{fullName}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">File</span><span className="font-semibold">{file ? file.name : 'No file'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Status</span><span className="font-semibold text-amber-400">⏳ Pending Review</span></div>
                </div>
                <button onClick={() => { setStep('select'); setSelectedWork(''); setFile(null); setNotes(''); setError('') }}
                    className="btn-primary px-8 py-3">
                    Submit Another Work
                </button>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up pb-16">
            {/* Header */}
            <div className="page-header">
                <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-slate-500">Member Panel</p>
                <h1 className="text-2xl font-black tracking-tight" style={{ color: '#e2e8f0' }}>
                    Submit <span className="gradient-text">Work</span>
                </h1>
                <p className="text-sm mt-1" style={{ color: '#64748b' }}>Select your completed task and upload your work file for review.</p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center gap-2">
                {['Select Task', 'Upload Work'].map((label, i) => {
                    const active = (i === 0 && step === 'select') || (i === 1 && step === 'details')
                    const done = (i === 0 && step === 'details')
                    return (
                        <div key={i} className="flex items-center gap-2">
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${active ? 'bg-sky-500 text-white' : done ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-slate-500'}`}>
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[0.6rem] font-black ${active ? 'bg-white/20' : done ? 'bg-emerald-500/30' : 'bg-white/10'}`}>{done ? '✓' : i + 1}</span>
                                {label}
                            </div>
                            {i < 1 && <div className="w-8 h-px bg-slate-800" />}
                        </div>
                    )
                })}
            </div>

            {/* Step 1: Select Work Type */}
            {step === 'select' && (
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Briefcase size={20} className="text-sky-400" /> What type of work did you complete?
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {WORK_TYPES.map(work => {
                            const Icon = work.icon
                            const isSelected = selectedWork === work.value
                            return (
                                <button key={work.value} onClick={() => setSelectedWork(work.value)}
                                    className={`glass-card p-5 text-left transition-all duration-300 group relative overflow-hidden ${isSelected ? 'ring-2' : 'hover:border-sky-500/30'}`}
                                    style={isSelected ? { boxShadow: `0 0 0 2px ${work.color}`, borderColor: work.color + '60', background: work.color + '10' } : {}}>
                                    {isSelected && (
                                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                                            style={{ background: work.color }}>
                                            <CheckCircle size={12} className="text-white" />
                                        </div>
                                    )}
                                    <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300"
                                        style={{ background: work.color + '20' }}>
                                        <Icon size={22} style={{ color: work.color }} />
                                    </div>
                                    <div className="font-bold text-white text-sm mb-1">{work.label}</div>
                                    <div className="text-xs text-slate-500">{work.desc}</div>
                                </button>
                            )
                        })}
                    </div>

                    <div className="flex justify-end pt-4">
                        <button onClick={() => { if (!selectedWork) { setError('Please select a work type first.'); return; } setError(''); setStep('details') }}
                            disabled={!selectedWork}
                            className="btn-primary px-8 py-3 disabled:opacity-40">
                            Continue <ArrowRight size={18} className="ml-1" />
                        </button>
                    </div>
                    {error && <p className="text-red-400 text-sm flex items-center gap-2"><AlertCircle size={14} />{error}</p>}
                </div>
            )}

            {/* Step 2: Upload Details */}
            {step === 'details' && (
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Selected Task Chip */}
                    {selectedType && (
                        <div className="flex items-center gap-3 p-4 glass-card border rounded-xl"
                            style={{ borderColor: selectedType.color + '40', background: selectedType.color + '08' }}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ background: selectedType.color + '20' }}>
                                <selectedType.icon size={20} style={{ color: selectedType.color }} />
                            </div>
                            <div>
                                <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">Selected Task</div>
                                <div className="font-bold text-white">{selectedType.label}</div>
                            </div>
                            <button type="button" onClick={() => setStep('select')} className="ml-auto p-2 rounded-lg hover:bg-white/10 text-slate-400 transition-colors">
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    {/* Full Name */}
                    <div className="glass-card p-6">
                        <h2 className="text-base font-bold text-white mb-5 flex items-center gap-2">
                            <User size={18} className="text-sky-400" /> Your Information
                        </h2>
                        <div>
                            <label className="form-label">Your Full Name <span className="text-red-400">*</span></label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                required
                                className="input-field"
                                placeholder="Enter your full name"
                            />
                        </div>
                        <div className="mt-4">
                            <label className="form-label">Notes / Description <span className="text-slate-500">(optional)</span></label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                rows={3}
                                className="input-field resize-none"
                                placeholder="Add any details about your work..."
                            />
                        </div>
                    </div>

                    {/* File Upload */}
                    <div className="glass-card p-6">
                        <h2 className="text-base font-bold text-white mb-5 flex items-center gap-2">
                            <Upload size={18} className="text-emerald-400" /> Upload Your Work File
                            <span className="text-slate-500 font-normal text-xs">(optional)</span>
                        </h2>
                        <div
                            onClick={() => fileRef.current?.click()}
                            onDrop={handleDrop}
                            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                            onDragLeave={() => setDragOver(false)}
                            className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 ${dragOver ? 'border-sky-400 bg-sky-500/10' : file ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-700 hover:border-sky-500/50 hover:bg-sky-500/5'}`}>
                            <input ref={fileRef} type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                            {file ? (
                                <div className="space-y-2">
                                    <CheckCircle size={40} className="text-emerald-400 mx-auto" />
                                    <p className="font-bold text-white text-sm">{file.name}</p>
                                    <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    <button type="button" onClick={e => { e.stopPropagation(); setFile(null) }}
                                        className="text-xs text-red-400 hover:text-red-300 mt-2 underline">Remove file</button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto">
                                        <Upload size={28} className="text-slate-400" />
                                    </div>
                                    <p className="font-semibold text-slate-300">Drag & drop or click to upload</p>
                                    <p className="text-xs text-slate-500">Supports: Images, PDFs, ZIP, Excel, Word, Videos</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-center gap-3">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    <div className="flex gap-4 justify-between pt-2">
                        <button type="button" onClick={() => setStep('select')} className="btn-ghost px-6 py-3">
                            ← Back
                        </button>
                        <button type="submit" disabled={submitting} className="btn-primary px-10 py-3 shadow-xl shadow-sky-500/20">
                            {submitting ? (
                                <span className="flex items-center gap-2">Submitting <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /></span>
                            ) : (
                                <span className="flex items-center gap-2"><Upload size={18} /> Submit Work</span>
                            )}
                        </button>
                    </div>
                </form>
            )}
        </div>
    )
}
