'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, FileText, CheckCircle, Clock, UserPlus, MessageCircle, AlertCircle } from 'lucide-react'

// Server Action
import { createAccountFromForm } from './actions'

export default function AdminFormsPage() {
    const [forms, setForms] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [isProcessing, setIsProcessing] = useState<string | null>(null)
    const [errorMsg, setErrorMsg] = useState('')

    useEffect(() => {
        fetchForms()
    }, [])

    const fetchForms = async () => {
        setIsLoading(true)
        const supabase = createClient()
        try {
            const { data, error } = await supabase
                .from('registration_forms')
                .select('*, users:submitted_by(full_name, whatsapp)')
                .order('created_at', { ascending: false })

            if (error) throw error
            setForms(data || [])
        } catch (err: any) {
            console.error("Error fetching forms:", err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreateAccount = async (form: any) => {
        if (!confirm(`Are you sure you want to create an account for ${form.account_name} (${form.account_number})?`)) return
        
        setIsProcessing(form.id)
        setErrorMsg('')
        try {
            const result = await createAccountFromForm(form.id)
            if (result && result.error) {
                throw new Error(result.error)
            }
            alert('Account created successfully! It is currently inactive and awaits manual activation.')
            await fetchForms()
        } catch (err: any) {
            console.error(err)
            setErrorMsg(err.message || 'Failed to create account. Did you restart the server for env variables?')
        } finally {
            setIsProcessing(null)
        }
    }

    const filteredForms = forms.filter(f => 
        f.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) || 
        f.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.whatsapp.includes(searchQuery) ||
        f.account_number.includes(searchQuery)
    )

    return (
        <div className="max-w-7xl mx-auto animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Form Submissions</h1>
                    <p className="text-slate-400">Manage all offline and submitted registration forms globally.</p>
                </div>
                
                <div className="relative w-full md:w-80 shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search EMP ID or WhatsApp..."
                        className="input-field pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-6 text-sm flex items-center gap-3">
                    <AlertCircle size={16} /> {errorMsg}
                </div>
            )}

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="border-b bg-white/5" style={{ borderColor: 'var(--border)' }}>
                                <th className="p-4 font-semibold text-slate-300">Date & EMP ID</th>
                                <th className="p-4 font-semibold text-slate-300">Account Details</th>
                                <th className="p-4 font-semibold text-slate-300">Submitted By</th>
                                <th className="p-4 font-semibold text-slate-300 text-center">Status</th>
                                <th className="p-4 font-semibold text-slate-300 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-400">Loading forms...</td></tr>
                            ) : filteredForms.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-16 text-center">
                                        <FileText size={48} className="mx-auto text-slate-600 mb-4" />
                                        <p className="text-slate-400">No forms found matching your search.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredForms.map((form) => (
                                    <tr key={form.id} className="border-b hover:bg-white/5 transition-colors" style={{ borderColor: 'var(--border)' }}>
                                        <td className="p-4 whitespace-nowrap">
                                            <div className="font-mono text-sky-400 font-bold mb-1">{form.employee_id}</div>
                                            <div className="text-xs text-slate-400">{new Date(form.created_at).toLocaleDateString()} {new Date(form.created_at).toLocaleTimeString()}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-200">{form.account_name}</div>
                                            <div className="text-xs text-emerald-400 font-mono mt-1 gap-1 flex items-center">
                                                <MessageCircle size={10} /> {form.account_number}
                                            </div>
                                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">PWD: {form.password}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-slate-300">{form.users?.full_name || 'Unknown'}</div>
                                            <div className="text-xs text-slate-500 font-mono">{form.users?.whatsapp}</div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider
                                                ${form.status === 'ACCOUNT_CREATED' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'}`}>
                                                {form.status === 'ACCOUNT_CREATED' ? <CheckCircle size={10} /> : <Clock size={10} />}
                                                {form.status === 'ACCOUNT_CREATED' ? 'Processed' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            {form.status === 'PENDING' ? (
                                                <button 
                                                    onClick={() => handleCreateAccount(form)}
                                                    disabled={isProcessing === form.id}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-lg hover:bg-sky-500 hover:text-white transition-all text-xs font-bold disabled:opacity-50"
                                                >
                                                    {isProcessing === form.id ? (
                                                        <div className="w-3 h-3 border-2 border-sky-400/30 border-t-sky-400 rounded-full animate-spin" />
                                                    ) : <UserPlus size={14} />}
                                                    Create Account
                                                </button>
                                            ) : (
                                                <a href={`https://wa.me/88${form.account_number}`} target="_blank" rel="noopener noreferrer" 
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500 hover:text-white transition-all text-xs font-bold">
                                                    <MessageCircle size={14} /> WhatsApp
                                                </a>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
