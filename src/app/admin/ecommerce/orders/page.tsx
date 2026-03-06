import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { ClipboardList, CheckCircle, XCircle, Truck, Package, Clock } from 'lucide-react'
import type { OrderStatus } from '@/lib/types'

export const dynamic = 'force-dynamic'

const statusColors: Record<OrderStatus, string> = {
    PENDING: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    PROCESSING: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    SHIPPED: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    DELIVERED: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    CANCELLED: 'text-red-400 bg-red-400/10 border-red-400/20'
}

export default async function AdminOrdersPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const { data: profile } = await supabase
        .from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'ADMIN') redirect('/dashboard')

    // Fetch orders with related product and user
    const { data: orders } = await supabase
        .from('ecommerce_orders')
        .select(`
            *,
            product:ecommerce_products!product_id(title, image_url),
            reseller:users!user_id(full_name, whatsapp)
        `)
        .order('created_at', { ascending: false })

    async function updateOrderStatus(orderId: string, status: OrderStatus) {
        'use server'
        const sp = await createClient()
        await sp.from('ecommerce_orders').update({ status }).eq('id', orderId)
    }

    return (
        <div className="space-y-6 animate-fade-in-up pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-200 flex items-center gap-2">
                        <ClipboardList className="text-sky-500" /> Manage Orders
                    </h1>
                    <p className="text-sm text-slate-400">Review and process reseller product orders.</p>
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-700/50 bg-slate-800/20 text-xs uppercase tracking-wider text-slate-400">
                                <th className="p-4 font-semibold">Order Details</th>
                                <th className="p-4 font-semibold">Customer info</th>
                                <th className="p-4 font-semibold">Reseller Info</th>
                                <th className="p-4 font-semibold">Financials</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50 text-sm">
                            {orders?.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500">
                                        No orders found.
                                    </td>
                                </tr>
                            ) : (
                                orders?.map((o: any) => (
                                    <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="w-12 h-12 rounded-lg bg-slate-800 flex-shrink-0 overflow-hidden border border-slate-700">
                                                    {o.product?.image_url ? (
                                                        <img src={o.product.image_url} alt="Product" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Package className="w-6 h-6 m-auto text-slate-500" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-200 line-clamp-2" title={o.product?.title}>{o.product?.title || 'Unknown Product'}</p>
                                                    <p className="text-xs text-slate-400 mt-1">Qty: {o.quantity} • {formatDateTime(o.created_at)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <p className="font-bold text-slate-200">{o.customer_name}</p>
                                            <p className="text-xs text-slate-400">{o.customer_phone}</p>
                                            <p className="text-xs text-slate-500 mt-1 line-clamp-2 max-w-[150px]" title={o.customer_address}>{o.customer_address}</p>
                                        </td>
                                        <td className="p-4">
                                            <p className="font-bold text-slate-200">{o.reseller?.full_name || 'Unknown'}</p>
                                            <p className="text-xs text-slate-400">{o.reseller?.whatsapp}</p>
                                        </td>
                                        <td className="p-4">
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-slate-500">Wholesale:</span>
                                                    <span className="font-medium text-slate-300">{formatCurrency(o.total_wholesale_price)}</span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-slate-500">Selling Price:</span>
                                                    <span className="font-bold text-sky-400">{formatCurrency(o.total_selling_price)}</span>
                                                </div>
                                                <div className="flex justify-between text-xs pt-1 border-t border-slate-700">
                                                    <span className="text-slate-500">Profit/Com:</span>
                                                    <span className="font-black text-emerald-400">+{formatCurrency(o.profit)}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`badge border ${statusColors[o.status as OrderStatus]}`}>
                                                {o.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && (
                                                <div className="flex items-center gap-2">
                                                    {o.status === 'PENDING' && (
                                                        <form action={updateOrderStatus.bind(null, o.id, 'PROCESSING')}>
                                                            <button type="submit" className="p-2 bg-slate-800 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors" title="Process Order">
                                                                <Clock size={16} />
                                                            </button>
                                                        </form>
                                                    )}
                                                    {o.status === 'PROCESSING' && (
                                                        <form action={updateOrderStatus.bind(null, o.id, 'SHIPPED')}>
                                                            <button type="submit" className="p-2 bg-slate-800 hover:bg-purple-500/20 text-purple-400 rounded-lg transition-colors" title="Ship Order">
                                                                <Truck size={16} />
                                                            </button>
                                                        </form>
                                                    )}
                                                    {(o.status === 'SHIPPED' || o.status === 'PROCESSING') && (
                                                        <form action={updateOrderStatus.bind(null, o.id, 'DELIVERED')}>
                                                            <button type="submit" className="p-2 bg-slate-800 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors" title="Mark Delivered (Pays Reseller)">
                                                                <CheckCircle size={16} />
                                                            </button>
                                                        </form>
                                                    )}
                                                    <form action={updateOrderStatus.bind(null, o.id, 'CANCELLED')}>
                                                        <button type="submit" className="p-2 bg-slate-800 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors" title="Cancel Order">
                                                            <XCircle size={16} />
                                                        </button>
                                                    </form>
                                                </div>
                                            )}
                                            {(o.status === 'DELIVERED' || o.status === 'CANCELLED') && (
                                                <span className="text-xs text-slate-500 italic">No actions available</span>
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
