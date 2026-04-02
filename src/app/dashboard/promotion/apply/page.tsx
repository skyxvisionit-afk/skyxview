'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, CheckCircle, AlertTriangle, Send } from 'lucide-react'
import Link from 'next/link'

function ApplyForm() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const supabase = createClient()
    
    const roleId = searchParams.get('role') || 'UNKNOWN'
    const roleTitle = searchParams.get('title') || 'Promotion'
    
    const [agreed, setAgreed] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [form, setForm] = useState({
        experience: '',
        whyMe: '',
        availability: '2-4 hours'
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage({ type: '', text: '' })
        
        if (!agreed) {
            return setMessage({ type: 'error', text: 'You must agree to follow the rules.' })
        }
        if (!form.experience || !form.whyMe) {
            return setMessage({ type: 'error', text: 'Please fill out all required fields.' })
        }

        setSubmitting(true)
        
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { error } = await supabase.from('promotion_applications').insert({
                user_id: user.id,
                target_role: roleId,
                experience: form.experience,
                why_me: form.whyMe,
                availability: form.availability,
                status: 'PENDING'
            })

            if (error) {
                // Highly likely the table doesn't exist yet, graceful fallback message
                if (error.code === '42P01') { // table_not_found
                    console.error("The 'promotion_applications' table is missing from your database.", error)
                    throw new Error('Database configuration missing. Admin needs to run the SQL query to create the applications table.')
                }
                throw error
            }

            setMessage({ type: 'success', text: 'Your application has been submitted successfully! The management will review it shortly.' })
            setTimeout(() => {
                router.push('/dashboard/promotion')
            }, 3000)
            
        } catch (err: any) {
            console.error('Submit error:', err)
            setMessage({ type: 'error', text: err.message || 'Failed to submit application.' })
        }
        
        setSubmitting(false)
    }

    if (message.type === 'success') {
        return (
            <div className="glass-card p-10 text-center animate-fade-in-up">
                <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={40} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Application Received!</h2>
                <p className="text-slate-400 max-w-md mx-auto">
                    {message.text} Redirecting you back to promotions page...
                </p>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="glass-card p-6 md:p-8">
                <h2 className="text-lg font-bold text-white mb-6 border-b border-white/10 pb-4">Application Details</h2>
                
                <div className="space-y-5">
                    <div>
                        <label className="form-label">Previous Experience <span className="text-red-500">*</span></label>
                        <textarea 
                            required
                            value={form.experience}
                            onChange={(e) => setForm({...form, experience: e.target.value})}
                            className="input-field min-h-[100px] py-3"
                            placeholder="Describe any previous experience you have related to this role..."
                        ></textarea>
                    </div>

                    <div>
                        <label className="form-label">Why should we select you? <span className="text-red-500">*</span></label>
                        <textarea 
                            required
                            value={form.whyMe}
                            onChange={(e) => setForm({...form, whyMe: e.target.value})}
                            className="input-field min-h-[100px] py-3"
                            placeholder="Explain why you are the best fit for this promotion..."
                        ></textarea>
                    </div>

                    <div>
                        <label className="form-label">Daily Availability <span className="text-red-500">*</span></label>
                        <select 
                            value={form.availability}
                            onChange={(e) => setForm({...form, availability: e.target.value})}
                            className="input-field py-3"
                        >
                            <option value="1-2 hours">1-2 hours per day</option>
                            <option value="2-4 hours">2-4 hours per day</option>
                            <option value="4-6 hours">4-6 hours per day</option>
                            <option value="6+ hours">6+ hours per day</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="glass-card p-6 md:p-8 border border-amber-500/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                
                <h3 className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
                    <AlertTriangle size={20} /> Conditions & Rules
                </h3>
                
                <ul className="list-disc list-inside text-sm text-slate-300 space-y-2 mb-6 ml-2">
                    <li>I promise to abide by all platform rules and guidelines.</li>
                    <li>I understand that violating rules may result in immediate demotion or account suspension.</li>
                    <li>I will maintain professionalism and help grow the community.</li>
                    <li>I acknowledge that the management's decision regarding this application is final.</li>
                </ul>

                <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="mt-0.5">
                        <input 
                            type="checkbox" 
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                            className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-500 cursor-pointer"
                        />
                    </div>
                    <span className="text-sm font-semibold text-white group-hover:text-amber-400 transition-colors">
                        I have read, understood, and agree to strictly follow all the rules and conditions.
                    </span>
                </label>
            </div>

            {message.text && message.type === 'error' && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-semibold text-center">
                    {message.text}
                </div>
            )}

            <button 
                type="submit"
                disabled={submitting || !agreed}
                className="btn-primary w-full py-4 text-base font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {submitting ? 'Submitting Application...' : 'Submit Application'}
                {!submitting && <Send size={18} />}
            </button>
        </form>
    )
}

export default function ApplyPromotionPage() {
    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up pb-10">
            {/* Header */}
            <div className="flex items-center gap-4 mb-2">
                <Link href="/dashboard/promotion" className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">Apply for Promotion</h1>
                    <p className="text-sm text-slate-400">Fill out the form below to submit your application.</p>
                </div>
            </div>

            <Suspense fallback={<div className="glass-card p-10 text-center text-slate-400 font-medium">Loading application form...</div>}>
                <ApplyForm />
            </Suspense>
        </div>
    )
}
