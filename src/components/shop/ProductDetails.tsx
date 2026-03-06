'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { Store, Heart, Package, Download, ShoppingCart, ArrowLeft, CheckCircle, Tag, DollarSign, Share2 } from 'lucide-react'
import type { EcommerceProduct } from '@/lib/types'

export default function ProductDetails({ productId, basePath }: { productId: string, basePath: string }) {
    const [product, setProduct] = useState<EcommerceProduct | null>(null)
    const [isFavorite, setIsFavorite] = useState(false)
    const [loading, setLoading] = useState(true)
    const [downloading, setDownloading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const [prodRes, favRes] = await Promise.all([
                supabase.from('ecommerce_products').select('*').eq('id', productId).single(),
                supabase.from('ecommerce_favorites').select('id').eq('user_id', user.id).eq('product_id', productId).single()
            ])

            if (prodRes.data) setProduct(prodRes.data as EcommerceProduct)
            if (favRes.data) setIsFavorite(true)
            setLoading(false)
        }
        load()
    }, [productId, supabase])

    const toggleFavorite = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || !product) return

        if (isFavorite) {
            setIsFavorite(false)
            await supabase.from('ecommerce_favorites').delete().eq('user_id', user.id).eq('product_id', product.id)
        } else {
            setIsFavorite(true)
            await supabase.from('ecommerce_favorites').insert({ user_id: user.id, product_id: product.id })
        }
    }

    const downloadImage = async () => {
        if (!product?.image_url) return
        try {
            setDownloading(true)
            const response = await fetch(product.image_url)
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.style.display = 'none'
            a.href = url
            a.download = `${product.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            a.remove()
        } catch (error) {
            console.error('Error downloading image:', error)
            alert('Could not download the image directly. Please right-click or long-press the image to save it.')
        } finally {
            setDownloading(false)
        }
    }

    if (loading) return <div className="p-10 text-center text-slate-400">Loading product details...</div>
    if (!product) return <div className="p-10 text-center text-slate-400">Product not found.</div>

    return (
        <div className="space-y-6 animate-fade-in-up pb-10 max-w-5xl mx-auto">
            <Link href={`${basePath}/shop`} className="inline-flex flex-col text-slate-400 hover:text-sky-400 transition-colors group">
                <div className="flex items-center gap-2 font-semibold">
                    <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" /> Back to Shop
                </div>
            </Link>

            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                {/* Image Gallery */}
                <div className="glass-card p-4 relative flex items-center justify-center min-h-[300px] lg:min-h-[500px] bg-slate-800/50">
                    <button onClick={toggleFavorite} className="absolute top-4 right-4 p-3 rounded-full bg-slate-900/50 backdrop-blur border border-white/10 z-10 text-rose-500 hover:bg-slate-900/80 hover:scale-110 transition-all">
                        <Heart size={24} fill={isFavorite ? "currentColor" : "none"} />
                    </button>
                    {product.image_url ? (
                        <img src={product.image_url} alt={product.title} className="max-w-full max-h-[500px] object-contain rounded-xl shadow-2xl" />
                    ) : (
                        <Package className="w-20 h-20 text-slate-600" />
                    )}
                </div>

                {/* Details */}
                <div className="space-y-6 flex flex-col">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="badge bg-sky-500/10 text-sky-400 border-sky-500/20 px-3 py-1 font-bold text-xs">
                                {product.category || 'Product'}
                            </span>
                            {product.stock > 0 ? (
                                <span className="badge bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1 font-bold text-xs flex items-center gap-1">
                                    <CheckCircle size={12} /> In Stock ({product.stock})
                                </span>
                            ) : (
                                <span className="badge bg-rose-500/10 text-rose-400 border-rose-500/20 px-3 py-1 font-bold text-xs flex items-center gap-1">
                                    Out of Stock
                                </span>
                            )}
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-black text-slate-200 leading-tight mb-2 tracking-tight">
                            {product.title}
                        </h1>
                    </div>

                    <div className="p-6 rounded-2xl border border-emerald-500/20" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.05), rgba(16,185,129,0.02))' }}>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-slate-400 font-medium mb-1 flex items-center gap-1"><Tag size={14} /> Wholesale Price</p>
                                <p className="text-3xl font-black text-emerald-400">{formatCurrency(product.wholesale_price)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400 font-medium mb-1 flex items-center gap-1"><DollarSign size={14} /> Suggested Retail</p>
                                <p className="text-3xl font-bold text-slate-300 line-through opacity-70">{formatCurrency(product.suggested_price)}</p>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-emerald-500/20 flex items-center justify-between">
                            <span className="text-sm font-bold text-emerald-500/70">Potential Profit Margin:</span>
                            <span className="text-lg font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                                Up to {formatCurrency(product.suggested_price - product.wholesale_price)}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h3 className="font-bold text-lg text-slate-200">Description</h3>
                        <p className="text-slate-400 leading-relaxed text-sm whitespace-pre-wrap">
                            {product.description || 'No description provided for this product. Use the marketing materials to sell it to your customers.'}
                        </p>
                    </div>

                    <div className="mt-auto pt-6 flex flex-col sm:flex-row gap-4">
                        <button onClick={downloadImage} disabled={downloading || !product.image_url}
                            className="btn-accent flex-1 justify-center py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 hover:border-slate-600 disabled:opacity-50">
                            <Download size={20} className={downloading ? 'animate-bounce' : ''} />
                            {downloading ? 'Downloading...' : 'Download Image'}
                        </button>

                        <Link href={`${basePath}/shop/${product.id}/sell`}
                            className={`btn-primary flex-[2] justify-center py-4 text-lg shadow-lg shadow-sky-500/20 hover:shadow-sky-500/40 transition-all hover:-translate-y-1 ${product.stock <= 0 ? 'pointer-events-none opacity-50' : ''}`}>
                            <ShoppingCart size={22} className="mr-1" />
                            Sell Now (Place Order)
                        </Link>
                    </div>

                    <div className="flex items-center justify-center gap-2 mt-4 text-xs font-bold text-amber-500 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                        <Share2 size={16} /> Tip: Download the image and post it on Facebook/WhatsApp with your price!
                    </div>
                </div>
            </div>
        </div>
    )
}
