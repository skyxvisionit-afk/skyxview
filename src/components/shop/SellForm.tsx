'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { ShoppingCart, ArrowLeft, User, Phone, MapPin, Package, AlertCircle } from 'lucide-react'
import type { EcommerceProduct } from '@/lib/types'

export default function SellForm({ productId, basePath }: { productId: string, basePath: string }) {
    const [product, setProduct] = useState<EcommerceProduct | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [sellingPrice, setSellingPrice] = useState<number>(0)
    const [quantity, setQuantity] = useState<number>(1)
    const [errorMsg, setErrorMsg] = useState('')
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        async function load() {
            const { data } = await supabase.from('ecommerce_products').select('*').eq('id', productId).single()
            if (data) {
                setProduct(data as EcommerceProduct)
                setSellingPrice(data.suggested_price)
            }
            setLoading(false)
        }
        load()
    }, [productId, supabase])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setErrorMsg('')
        if (!product) return

        if (sellingPrice < product.wholesale_price) {
            setErrorMsg(`Selling price cannot be less than the wholesale price (${formatCurrency(product.wholesale_price)})`)
            return
        }

        setSubmitting(true)
        const formData = new FormData(e.currentTarget)
        const customer_name = formData.get('customer_name') as string
        const customer_phone = formData.get('customer_phone') as string
        const customer_address = formData.get('customer_address') as string

        const total_wholesale_price = product.wholesale_price * quantity
        const total_selling_price = sellingPrice * quantity
        const profit = total_selling_price - total_wholesale_price

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase.from('ecommerce_orders').insert({
            user_id: user.id,
            product_id: product.id,
            customer_name,
            customer_phone,
            customer_address,
            quantity,
            selling_price: sellingPrice,
            total_wholesale_price,
            total_selling_price,
            profit,
            status: 'PENDING'
        })

        if (!error) {
            router.push(`${basePath}/orders?success=1`)
        } else {
            setErrorMsg('Failed to place order. Please try again.')
            setSubmitting(false)
        }
    }

    if (loading) return <div className="p-10 text-center text-slate-400">Loading checkout...</div>
    if (!product) return <div className="p-10 text-center text-slate-400">Product not found.</div>

    return (
        <div className="space-y-6 animate-fade-in-up pb-10 max-w-4xl mx-auto">
            <Link href={`${basePath}/shop/${product.id}`} className="inline-flex items-center gap-2 text-slate-400 hover:text-sky-400 transition-colors">
                <ArrowLeft size={16} /> Back to Details
            </Link>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Product Summary */}
                <div className="w-full md:w-1/3 space-y-4">
                    <div className="glass-card p-4">
                        <h3 className="font-bold text-slate-200 mb-4 flex items-center gap-2 border-b border-slate-700/50 pb-2">
                            <Package size={18} className="text-sky-400" /> Order Summary
                        </h3>
                        {product.image_url ? (
                            <img src={product.image_url} alt={product.title} className="w-full h-auto aspect-square object-cover rounded-xl mb-4 border border-slate-700" />
                        ) : (
                            <div className="w-full aspect-square bg-slate-800 rounded-xl mb-4 flex items-center justify-center border border-slate-700">
                                <Package className="w-10 h-10 text-slate-600" />
                            </div>
                        )}
                        <h4 className="font-bold text-sm text-slate-300 line-clamp-2">{product.title}</h4>

                        <div className="mt-4 space-y-2 text-sm bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Wholesale Rate:</span>
                                <span className="font-bold text-emerald-400">{formatCurrency(product.wholesale_price)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Your Selling Price:</span>
                                <span className="font-bold text-sky-400">{formatCurrency(sellingPrice)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Quantity:</span>
                                <span className="text-slate-300">x{quantity}</span>
                            </div>
                            <div className="border-t border-slate-700 pt-2 mt-2 flex justify-between">
                                <span className="text-slate-400">Total Bill (Customer Pays):</span>
                                <span className="font-black text-rose-400">{formatCurrency(sellingPrice * quantity)}</span>
                            </div>
                            <div className="flex justify-between bg-emerald-500/10 -mx-3 -mb-3 px-3 py-2 rounded-b-lg border-t border-emerald-500/20 mt-2">
                                <span className="font-bold text-emerald-500/80">Your Net Profit:</span>
                                <span className="font-black text-emerald-400">+{formatCurrency((sellingPrice - product.wholesale_price) * quantity)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sell Form */}
                <div className="w-full md:w-2/3 glass-card p-6 md:p-8">
                    <h2 className="text-2xl font-black text-slate-200 mb-2">Customer Details</h2>
                    <p className="text-sm text-slate-400 mb-6 border-b border-slate-700/50 pb-4">
                        Enter the details of the customer you sold this to. Our delivery team will handle the rest.
                    </p>

                    {errorMsg && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
                            <AlertCircle size={16} className="mt-0.5 shrink-0" />
                            <p>{errorMsg}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                    <User size={16} className="text-sky-500" /> Customer Name*
                                </label>
                                <input type="text" name="customer_name" required className="input-field w-full" placeholder="John Doe" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                    <Phone size={16} className="text-emerald-500" /> Customer Phone*
                                </label>
                                <input type="text" name="customer_phone" required className="input-field w-full" placeholder="01712345678" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                <MapPin size={16} className="text-rose-500" /> Full Delivery Address*
                            </label>
                            <textarea name="customer_address" required rows={3} className="input-field w-full resize-none" placeholder="House 12, Road 5, Block B, Dhaka..."></textarea>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-700/50">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-300">
                                    Final Selling Price (per item)*
                                </label>
                                <input type="number" required min={product.wholesale_price} step="1"
                                    className="input-field w-full text-lg font-bold"
                                    value={sellingPrice} onChange={e => setSellingPrice(Number(e.target.value))} />
                                <p className="text-[10px] text-slate-500">Minimum: {formatCurrency(product.wholesale_price)}</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-300">
                                    Quantity*
                                </label>
                                <input type="number" required min="1" max={product.stock}
                                    className="input-field w-full text-lg font-bold"
                                    value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
                                <p className="text-[10px] text-slate-500">Max available: {product.stock}</p>
                            </div>
                        </div>

                        <button type="submit" disabled={submitting} className="btn-primary w-full py-4 text-lg justify-center mt-6">
                            <ShoppingCart size={20} className="mr-2" />
                            {submitting ? 'Placing Order...' : 'Confirm & Place Order'}
                        </button>
                        <p className="text-xs text-center text-slate-500 mt-4">
                            By placing this order, you confirm the customer agreed to pay {formatCurrency(sellingPrice * quantity)} at delivery.
                        </p>
                    </form>
                </div>
            </div>
        </div>
    )
}
