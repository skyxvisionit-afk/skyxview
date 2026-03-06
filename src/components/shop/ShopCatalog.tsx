'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { Store, Heart, Search, Package } from 'lucide-react'
import type { EcommerceProduct } from '@/lib/types'

export default function ShopCatalog({ basePath }: { basePath: string }) {
    const [products, setProducts] = useState<EcommerceProduct[]>([])
    const [favorites, setFavorites] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const supabase = createClient()

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const [prodRes, favRes] = await Promise.all([
                supabase.from('ecommerce_products').select('*').order('created_at', { ascending: false }),
                supabase.from('ecommerce_favorites').select('product_id').eq('user_id', user.id)
            ])

            if (prodRes.data) setProducts(prodRes.data as EcommerceProduct[])
            if (favRes.data) setFavorites(favRes.data.map(f => f.product_id))
            setLoading(false)
        }
        load()
    }, [supabase])

    const toggleFavorite = async (e: React.MouseEvent, productId: string) => {
        e.preventDefault()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        if (favorites.includes(productId)) {
            setFavorites(favorites.filter(id => id !== productId))
            await supabase.from('ecommerce_favorites').delete().eq('user_id', user.id).eq('product_id', productId)
        } else {
            setFavorites([...favorites, productId])
            await supabase.from('ecommerce_favorites').insert({ user_id: user.id, product_id: productId })
        }
    }

    const filtered = products.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase()))

    if (loading) return <div className="p-10 text-center text-slate-400">Loading products...</div>

    return (
        <div className="space-y-6 animate-fade-in-up pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-200 flex items-center gap-2">
                        <Store className="text-sky-500" /> Reseller Shop
                    </h1>
                    <p className="text-sm text-slate-400">Browse hot products, set your margin, and earn profits.</p>
                </div>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)}
                        className="input-field w-full pl-10 h-10" />
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="glass-card p-10 text-center text-slate-400">No products available.</div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filtered.map(p => (
                        <Link key={p.id} href={`${basePath}/shop/${p.id}`} className="glass-card overflow-hidden group hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_0_20px_rgba(14,165,233,0.15)] flex flex-col">
                            <div className="relative aspect-square bg-slate-800 overflow-hidden">
                                {p.image_url ? (
                                    <img src={p.image_url} alt={p.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                ) : (
                                    <Package className="w-10 h-10 m-auto mt-[40%] text-slate-600" />
                                )}
                                <button onClick={(e) => toggleFavorite(e, p.id)}
                                    className="absolute top-2 right-2 p-2 rounded-full bg-slate-900/50 backdrop-blur border border-white/10 text-rose-500 hover:bg-slate-900/80 transition-colors">
                                    <Heart size={16} fill={favorites.includes(p.id) ? "currentColor" : "none"} />
                                </button>
                                {p.stock === 0 && (
                                    <div className="absolute inset-x-0 bottom-0 bg-red-500/90 text-white text-xs text-center py-1 font-bold backdrop-blur">
                                        OUT OF STOCK
                                    </div>
                                )}
                            </div>
                            <div className="p-4 flex flex-col flex-1">
                                <span className="text-[0.6rem] uppercase tracking-wider text-sky-400 font-bold mb-1">{p.category || 'Product'}</span>
                                <h3 className="font-bold text-slate-200 line-clamp-2 mb-2 leading-tight flex-1">{p.title}</h3>
                                <div className="space-y-1 mt-auto">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500">Wholesale:</span>
                                        <span className="font-bold text-emerald-400">{formatCurrency(p.wholesale_price)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500">Suggested:</span>
                                        <span className="text-slate-300 line-through">{formatCurrency(p.suggested_price)}</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
