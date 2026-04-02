'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Save, Shield, User, MapPin, Phone, Lock, FileText, CheckCircle } from 'lucide-react'

export default function NewFormFillup() {
    const router = useRouter()
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [isChecking, setIsChecking] = useState(true)
    const [isAssigned, setIsAssigned] = useState(false)

    useEffect(() => {
        const checkAssignment = async () => {
            const supabase = createClient()
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return
                
                const { data } = await supabase.from('users').select('trainer_id, leader_id').eq('id', user.id).single()
                
                // If they have a trainer or leader assigned, they can submit forms
                if (data && (data.trainer_id || data.leader_id)) {
                    setIsAssigned(true)
                } else {
                    setIsAssigned(false)
                }
            } catch (err) {
                console.error(err)
            } finally {
                setIsChecking(false)
            }
        }
        checkAssignment()
    }, [])

    const [form, setForm] = useState({
        fullName: '',
        email: '',
        whatsapp: '',
        contactNumber: '',
        district: '',
        upazila: '',
        village: '',
        gender: 'Male',
        hasNid: false,
        nidRegion: '',
        nidNumber: '',
        referralCode: '',
        accountName: '',
        accountNumber: '',
        password: '',
        confirmPassword: ''
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as any
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        setForm(p => ({ ...p, [name]: val }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        // Validations
        if (!form.referralCode.trim()) return setError('Referral Code (Private Code) is mandatory.')
        if (form.password.length < 6) return setError('Password must be at least 6 characters.')
        if (form.password !== form.confirmPassword) return setError('Passwords do not match.')
        if (form.hasNid && (!form.nidRegion || !form.nidNumber)) return setError('NID Region and Number are required if Yes.')

        // Validate referral code exists
        const supabase = createClient()
        const { data: referrer, error: refErr } = await supabase.from('users').select('id, full_name, status').eq('referral_code', form.referralCode.trim().toUpperCase()).single()
        if (refErr || !referrer) return setError('Invalid referral code. Please double-check and try again.')
        if (referrer.status !== 'ACTIVE') return setError(`Referral code belongs to ${referrer.full_name}, but their account is currently INACTIVE.`)

        setSubmitting(true)
        
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            // Generate Employee ID (Random 6 chars)
            const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase()
            const employeeId = `SKYX-${randomCode}`

            const { data, error: insertError } = await supabase.from('registration_forms').insert({
                submitted_by: user.id,
                employee_id: employeeId,
                full_name: form.fullName,
                email: form.email,
                whatsapp: form.whatsapp,
                contact_number: form.contactNumber,
                district: form.district,
                upazila: form.upazila,
                village: form.village,
                gender: form.gender,
                has_nid: form.hasNid,
                nid_region: form.nidRegion,
                nid_number: form.nidNumber,
                referral_code: form.referralCode.trim().toUpperCase(),
                account_name: form.accountName,
                account_number: form.accountNumber,
                password: form.password,
                status: 'PENDING'
            }).select().single()

            if (insertError) throw insertError

            router.push(`/dashboard/tasks/form-fillup/success?id=${data.id}`)
        } catch (err: any) {
            console.error('Submission error:', err)
            setError(err.message || 'Failed to submit the form.')
            setSubmitting(false)
        }
    }

    if (isChecking) {
        return (
            <div className="flex items-center justify-center p-20 animate-fade-in-up">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
                    <p className="text-slate-400 font-semibold">Verifying team access...</p>
                </div>
            </div>
        )
    }

    if (!isAssigned) {
        return (
            <div className="max-w-2xl mx-auto mt-10 p-8 glass-card border border-amber-500/20 text-center animate-fade-in-up">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-4">
                    <Shield size={32} />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
                <p className="text-slate-400 mb-6 font-medium">You are currently not assigned to any specific Team Leader or Trainer.</p>
                <div className="bg-white/5 p-4 rounded-xl text-sm text-slate-300 mb-6">
                    A system administrator must assign you to a team first before you are allowed to fill up forms. Please contact your admin for team placement.
                </div>
                <Link href="/dashboard/tasks/form-fillup" className="btn-primary w-full justify-center">Return to Safety</Link>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto animate-fade-in-up pb-10">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => router.back()} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 text-slate-300 transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">Form Fillup Application</h1>
                    <p className="text-slate-400">Please provide all accurate details for the applicant.</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-6 text-sm flex items-center gap-3">
                    <Shield size={16} /> {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="glass-card p-6 md:p-8">
                    <h2 className="text-lg font-bold text-white mb-6 border-b border-white/10 pb-4 flex items-center gap-3">
                        <User size={20} className="text-sky-400" /> Personal Information
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="form-label">Full Name <span className="text-red-500">*</span></label>
                            <input required type="text" name="fullName" value={form.fullName} onChange={handleChange} className="input-field" placeholder="Applicant Name" />
                        </div>
                        <div>
                            <label className="form-label">Email <span className="text-red-500">*</span></label>
                            <input required type="email" name="email" value={form.email} onChange={handleChange} className="input-field" placeholder="Email Address" />
                        </div>
                        <div>
                            <label className="form-label">WhatsApp Number <span className="text-red-500">*</span></label>
                            <input required type="text" name="whatsapp" value={form.whatsapp} onChange={handleChange} className="input-field" placeholder="01XXXXXXXXX" />
                        </div>
                        <div>
                            <label className="form-label">Contact Number <span className="text-red-500">*</span></label>
                            <input required type="text" name="contactNumber" value={form.contactNumber} onChange={handleChange} className="input-field" placeholder="Active Phone Number" />
                        </div>
                        <div>
                            <label className="form-label">Gender <span className="text-red-500">*</span></label>
                            <select required name="gender" value={form.gender} onChange={handleChange} className="input-field">
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Address Information */}
                <div className="glass-card p-6 md:p-8">
                    <h2 className="text-lg font-bold text-white mb-6 border-b border-white/10 pb-4 flex items-center gap-3">
                        <MapPin size={20} className="text-emerald-400" /> Address Information
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="form-label">Zilla (District) <span className="text-red-500">*</span></label>
                            <input required type="text" name="district" value={form.district} onChange={handleChange} className="input-field" placeholder="e.g. Dhaka" />
                        </div>
                        <div>
                            <label className="form-label">Upazila <span className="text-red-500">*</span></label>
                            <input required type="text" name="upazila" value={form.upazila} onChange={handleChange} className="input-field" placeholder="e.g. Savar" />
                        </div>
                        <div>
                            <label className="form-label">Village / Area <span className="text-red-500">*</span></label>
                            <input required type="text" name="village" value={form.village} onChange={handleChange} className="input-field" placeholder="e.g. Ashulia" />
                        </div>
                    </div>
                </div>

                {/* NID Information */}
                <div className="glass-card p-6 md:p-8">
                    <h2 className="text-lg font-bold text-white mb-6 border-b border-white/10 pb-4 flex items-center gap-3">
                        <FileText size={20} className="text-amber-400" /> NID Information (Optional)
                    </h2>
                    
                    <div className="mb-6 flex items-center gap-3">
                        <input type="checkbox" id="hasNid" name="hasNid" checked={form.hasNid} onChange={handleChange} 
                            className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-sky-500 focus:ring-sky-500" />
                        <label htmlFor="hasNid" className="text-sm font-semibold text-slate-300 cursor-pointer">Applicant has NID/Smart Card?</label>
                    </div>

                    {form.hasNid && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 border border-amber-500/20 rounded-xl bg-amber-500/5 animate-fade-in-up">
                            <div>
                                <label className="form-label">NID Region/Area</label>
                                <input required={form.hasNid} type="text" name="nidRegion" value={form.nidRegion} onChange={handleChange} className="input-field bg-slate-900 border-white/5" placeholder="Issuing Region" />
                            </div>
                            <div>
                                <label className="form-label">NID Number</label>
                                <input required={form.hasNid} type="text" name="nidNumber" value={form.nidNumber} onChange={handleChange} className="input-field bg-slate-900 border-white/5" placeholder="10 or 17 digit NID Number" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Account Settings */}
                <div className="glass-card p-6 md:p-8 border-l-4 border-l-sky-500">
                    <h2 className="text-lg font-bold text-white mb-6 border-b border-white/10 pb-4 flex items-center gap-3">
                        <Lock size={20} className="text-indigo-400" /> Account Settings
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Referral Code - Full width, highlighted */}
                        <div className="md:col-span-2">
                            <label className="form-label">Private Code (Referral Code) <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input 
                                    required 
                                    type="text" 
                                    name="referralCode" 
                                    value={form.referralCode} 
                                    onChange={handleChange} 
                                    className="input-field font-mono tracking-widest uppercase border-sky-500/40 bg-sky-500/5" 
                                    placeholder="Enter the referral code you received" 
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-1.5 italic">This is the private referral code of the person who invited the applicant. It is mandatory for commission tracking.</p>
                        </div>
                        <div>
                            <label className="form-label">Account Name <span className="text-red-500">*</span></label>
                            <input required type="text" name="accountName" value={form.accountName} onChange={handleChange} className="input-field" placeholder="Username" />
                        </div>
                        <div>
                            <label className="form-label">Account Number (WhatsApp) <span className="text-red-500">*</span></label>
                            <input required type="text" name="accountNumber" value={form.accountNumber} onChange={handleChange} className="input-field" placeholder="01XXXXXXXXX" />
                        </div>
                        <div>
                            <label className="form-label">Password <span className="text-red-500">*</span></label>
                            <input required minLength={6} type="password" name="password" value={form.password} onChange={handleChange} className="input-field" placeholder="Minimum 6 characters" />
                        </div>
                        <div>
                            <label className="form-label">Confirm Password <span className="text-red-500">*</span></label>
                            <input required minLength={6} type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} className="input-field" placeholder="Re-type password" />
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <div className="flex justify-end pt-4">
                    <button type="submit" disabled={submitting} className="btn-primary py-4 px-10 text-lg w-full md:w-auto shadow-xl shadow-sky-500/20">
                        {submitting ? (
                            <span className="flex items-center gap-2">Processing <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /></span>
                        ) : (
                            <span className="flex items-center gap-2"><Save size={20} /> Submit Your Form</span>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
