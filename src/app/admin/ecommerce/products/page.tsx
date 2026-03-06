import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Plus, Package, Edit, Trash2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminProductsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const { data: profile } = await supabase
        .from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'ADMIN') redirect('/dashboard')

    const { data: products } = await supabase
        .from('ecommerce_products')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6 animate-fade-in-up pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-200 flex items-center gap-2">
                        <Package className="text-sky-500" /> Manage Products
                    </h1>
                    <p className="text-sm text-slate-400">Add, view, and manage available reseller products.</p>
                </div>
                <Link href="/admin/ecommerce/products/new" className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2">
                    <Plus size={18} /> Add New Product
                </Link>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-700/50 bg-slate-800/20 text-xs uppercase tracking-wider text-slate-400">
                                <th className="p-4 font-semibold">Product</th>
                                <th className="p-4 font-semibold">Category</th>
                                <th className="p-4 font-semibold">Wholesale Price</th>
                                <th className="p-4 font-semibold">Suggested Retail</th>
                                <th className="p-4 font-semibold">Stock</th>
                                <th className="p-4 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50 text-sm">
                            {products?.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500">
                                        No products found. Click "Add New Product" to create one.
                                    </td>
                                </tr>
                            ) : (
                                products?.map((p) => (
                                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-lg bg-slate-800 flex-shrink-0 overflow-hidden border border-slate-700">
                                                    {p.image_url ? (
                                                        <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Package className="w-6 h-6 m-auto text-slate-500" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-200 line-clamp-1">{p.title}</p>
                                                    <p className="text-xs text-slate-500">{formatDateTime(p.created_at)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="badge bg-slate-800/50 text-slate-300 border-slate-700">{p.category || 'Uncategorized'}</span>
                                        </td>
                                        <td className="p-4 font-bold text-sky-400">{formatCurrency(p.wholesale_price)}</td>
                                        <td className="p-4 font-bold text-emerald-400">{formatCurrency(p.suggested_price)}</td>
                                        <td className="p-4 text-slate-300">
                                            {p.stock > 0 ? (
                                                <span>{p.stock} in stock</span>
                                            ) : (
                                                <span className="text-red-400">Out of stock</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <Link href={`/admin/ecommerce/products/${p.id}/edit`} className="p-2 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg transition-colors" title="Edit Product">
                                                    <Edit size={16} />
                                                </Link>
                                                <form action={async () => {
                                                    'use server'
                                                    const sp = await createClient()
                                                    await sp.from('ecommerce_products').delete().eq('id', p.id)
                                                }}>
                                                    <button type="submit" className="p-2 bg-slate-800 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors" title="Delete Product" formAction={async () => {
                                                        'use server'
                                                        const sp = await createClient()
                                                        await sp.from('ecommerce_products').delete().eq('id', p.id)
                                                    }}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </form>
                                            </div>
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
