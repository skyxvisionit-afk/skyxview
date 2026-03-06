'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { Heart, Package, ShoppingCart } from 'lucide-react'
import type { EcommerceProduct, EcommerceFavorite } from '@/lib/types'

export default function FavoritesList({ basePath }: { basePath: string }) {
    const [favorites, setFavorites] = useState<EcommerceFavorite[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('ecommerce_favorites')
                .select(`
                    id, product_id, created_at,
                    product:ecommerce_products(*)
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (data) setFavorites(data as any)
            setLoading(false)
        }
        load()
    }, [supabase])

    const removeFavorite = async (e: React.MouseEvent, favId: string) => {
        e.preventDefault()
        setFavorites(favorites.filter(f => f.id !== favId))
        await supabase.from('ecommerce_favorites').delete().eq('id', favId)
    }

    if (loading) return <div className="p-10 text-center text-slate-400">Loading favorites...</div>

    return (
        <div className="space-y-6 animate-fade-in-up pb-10">
            <div>
                <h1 className="text-2xl font-black text-rose-400 flex items-center gap-2">
                    <Heart className="text-rose-500" fill="currentColor" /> My Favorite Products
                </h1>
                <p className="text-sm text-slate-400">Keep track of the hot items you want to sell.</p>
            </div>

            {favorites.length === 0 ? (
                <div className="glass-card p-12 text-center text-slate-400 flex flex-col items-center">
                    <Heart size={48} className="mb-4 text-slate-600 opacity-50" />
                    <p>No favorite products yet. Browse the shop and click the heart icon to add some.</p>
                    <Link href={`${basePath}/shop`} className="mt-4 px-6 py-2 rounded-full border border-sky-500/30 text-sky-400 hover:bg-sky-500/10 transition-colors">
                        Browse Shop
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {favorites.map(fav => {
                        const p = fav.product
                        if (!p) return null
                        return (
                            <Link key={fav.id} href={`${basePath}/shop/${p.id}`} className="glass-card overflow-hidden group hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_0_20px_rgba(244,63,94,0.15)] flex flex-col">
                                <div className="relative aspect-square bg-slate-800 overflow-hidden">
                                    {p.image_url ? (
                                        <img src={p.image_url} alt={p.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    ) : (
                                        <Package className="w-10 h-10 m-auto mt-[40%] text-slate-600" />
                                    )}
                                    <button onClick={(e) => removeFavorite(e, fav.id)}
                                        className="absolute top-2 right-2 p-2 rounded-full bg-slate-900/50 backdrop-blur border border-white/10 text-rose-500 hover:bg-slate-900/80 transition-colors"
                                        title="Remove from favorites">
                                        <Heart size={16} fill="currentColor" />
                                    </button>
                                </div>
                                <div className="p-4 flex flex-col flex-1">
                                    <h3 className="font-bold text-slate-200 line-clamp-2 mb-3 leading-tight flex-1">{p.title}</h3>
                                    <div className="space-y-1 mt-auto">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-500">Margin:</span>
                                            <span className="font-bold text-emerald-400 max-w-[80px] truncate text-right">
                                                +{formatCurrency(p.suggested_price - p.wholesale_price)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
