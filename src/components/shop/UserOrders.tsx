'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { ClipboardList, Package, Clock, Truck, CheckCircle, XCircle } from 'lucide-react'
import type { EcommerceOrder, OrderStatus } from '@/lib/types'
import { useSearchParams } from 'next/navigation'

const statusConfig: Record<OrderStatus, { color: string, icon: any, label: string }> = {
    PENDING: { color: 'text-amber-400 bg-amber-400/10 border-amber-400/20', icon: Clock, label: 'Pending Review' },
    PROCESSING: { color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', icon: Package, label: 'Processing' },
    SHIPPED: { color: 'text-purple-400 bg-purple-400/10 border-purple-400/20', icon: Truck, label: 'Shipped' },
    DELIVERED: { color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', icon: CheckCircle, label: 'Delivered' },
    CANCELLED: { color: 'text-red-400 bg-red-400/10 border-red-400/20', icon: XCircle, label: 'Cancelled' }
}

export default function UserOrders() {
    const [orders, setOrders] = useState<EcommerceOrder[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()
    const searchParams = useSearchParams()
    const success = searchParams.get('success')

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('ecommerce_orders')
                .select(`
                    id, quantity, selling_price, total_selling_price, profit, status, created_at,
                    customer_name, customer_phone, customer_address,
                    product:ecommerce_products (title, image_url)
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (data) setOrders(data as any)
            setLoading(false)
        }
        load()
    }, [supabase])

    if (loading) return <div className="p-10 text-center text-slate-400">Loading your orders...</div>

    return (
        <div className="space-y-6 animate-fade-in-up pb-10">
            {success && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center gap-2 font-bold shadow-lg">
                    <CheckCircle size={20} /> Order placed successfully! Track it here.
                </div>
            )}
            <div>
                <h1 className="text-2xl font-black text-slate-200 flex items-center gap-2">
                    <ClipboardList className="text-sky-500" /> My Submitted Orders
                </h1>
                <p className="text-sm text-slate-400">Track deliveries to your customers and your earned profits.</p>
            </div>

            {orders.length === 0 ? (
                <div className="glass-card p-12 text-center text-slate-400 flex flex-col items-center">
                    <Package size={48} className="mb-4 text-slate-600 opacity-50" />
                    <p>You haven't placed any orders yet.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {orders.map(o => {
                        const StatusIcon = statusConfig[o.status].icon
                        return (
                            <div key={o.id} className="glass-card p-4 md:p-6 flex flex-col md:flex-row gap-6 relative overflow-hidden group">
                                {o.status === 'DELIVERED' && (
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -mr-10 -mt-10 rounded-full" />
                                )}

                                {/* Product Info */}
                                <div className="flex items-start gap-4 md:w-1/3">
                                    <div className="w-16 h-16 rounded-xl bg-slate-800 flex-shrink-0 overflow-hidden border border-slate-700">
                                        {o.product?.image_url ? (
                                            <img src={o.product.image_url} alt="Product" className="w-full h-full object-cover" />
                                        ) : (
                                            <Package className="w-8 h-8 m-auto text-slate-600 mt-4" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-200 line-clamp-2 text-sm md:text-base leading-tight">
                                            {o.product?.title || 'Unknown Product'}
                                        </p>
                                        <span className="text-xs text-slate-500 mt-1 block">Placed: {formatDateTime(o.created_at)}</span>
                                    </div>
                                </div>

                                {/* Customer Info */}
                                <div className="md:w-1/3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">Customer Details</p>
                                    <p className="font-bold text-slate-300 text-sm truncate">{o.customer_name}</p>
                                    <p className="text-xs text-slate-400 truncate">{o.customer_phone}</p>
                                    <p className="text-xs text-slate-500 mt-1 line-clamp-2" title={o.customer_address}>{o.customer_address}</p>
                                </div>

                                {/* Financials & Status */}
                                <div className="md:w-1/3 flex flex-col justify-between items-end gap-3 border-t md:border-t-0 md:border-l border-slate-700/50 pt-4 md:pt-0 md:pl-6 text-right">
                                    <div className="flex items-center gap-2">
                                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusConfig[o.status].color}`}>
                                            <StatusIcon size={14} />
                                            {statusConfig[o.status].label}
                                        </div>
                                    </div>

                                    <div className="w-full">
                                        <div className="flex justify-between md:justify-end md:gap-4 text-sm mb-1">
                                            <span className="text-slate-500">Total Bill:</span>
                                            <span className="font-bold text-slate-300">{formatCurrency(o.total_selling_price)}</span>
                                        </div>
                                        <div className="flex justify-between md:justify-end md:gap-4 text-sm border-t border-slate-700 mt-2 pt-2">
                                            <span className="text-slate-400 font-semibold">Your Profit:</span>
                                            {o.status === 'DELIVERED' ? (
                                                <span className="font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                                                    +{formatCurrency(o.profit)}
                                                </span>
                                            ) : (
                                                <span className="font-bold text-emerald-500/50">
                                                    +{formatCurrency(o.profit)} (Pending)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
