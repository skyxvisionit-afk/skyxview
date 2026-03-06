import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Save, ArrowLeft, Package, DollarSign, Tag, Image as ImageIcon, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

export default async function AdminEditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const { data: profile } = await supabase
        .from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'ADMIN') redirect('/dashboard')

    const { data: product } = await supabase
        .from('ecommerce_products')
        .select('*')
        .eq('id', id)
        .single()

    if (!product) redirect('/admin/ecommerce/products')

    async function updateProduct(formData: FormData) {
        'use server'
        const sp = await createClient()
        const title = formData.get('title') as string
        const description = formData.get('description') as string
        const image_url = formData.get('image_url') as string
        const category = formData.get('category') as string
        const wholesale_price = Number(formData.get('wholesale_price'))
        const suggested_price = Number(formData.get('suggested_price'))
        const stock = Number(formData.get('stock'))

        if (!title || !image_url || wholesale_price <= 0 || suggested_price <= 0) {
            return
        }

        const { error } = await sp.from('ecommerce_products').update({
            title,
            description,
            image_url,
            category: category || null,
            wholesale_price,
            suggested_price,
            stock
        }).eq('id', id)

        if (!error) {
            revalidatePath('/admin/ecommerce/products')
            redirect('/admin/ecommerce/products')
        }
    }

    return (
        <div className="space-y-6 animate-fade-in-up pb-10 max-w-3xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/admin/ecommerce/products" className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-slate-200 flex items-center gap-2">
                        Edit Product
                    </h1>
                    <p className="text-sm text-slate-400">Update product details and pricing.</p>
                </div>
            </div>

            <div className="glass-card p-6 md:p-8">
                <form action={updateProduct} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                            <Package size={16} className="text-sky-500" />
                            Product Title*
                        </label>
                        <input type="text" name="title" required
                            defaultValue={product.title}
                            className="input-field w-full"
                            placeholder="e.g. Premium Health Supplement" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                            <Tag size={16} className="text-emerald-500" />
                            Category
                        </label>
                        <input type="text" name="category"
                            defaultValue={product.category || ''}
                            className="input-field w-full"
                            placeholder="e.g. Health & Wellness" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                            <ImageIcon size={16} className="text-purple-500" />
                            Image URL* (Ensure valid public link)
                        </label>
                        <input type="url" name="image_url" required
                            defaultValue={product.image_url}
                            className="input-field w-full"
                            placeholder="https://example.com/image.jpg" />
                        <p className="text-xs text-slate-500">Provide a direct link to the product image.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                <DollarSign size={16} className="text-amber-500" />
                                Wholesale Price* (৳)
                            </label>
                            <input type="number" name="wholesale_price" required min="1" step="0.01"
                                defaultValue={product.wholesale_price}
                                className="input-field w-full"
                                placeholder="e.g. 500" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                <DollarSign size={16} className="text-emerald-500" />
                                Suggested Retail Price* (৳)
                            </label>
                            <input type="number" name="suggested_price" required min="1" step="0.01"
                                defaultValue={product.suggested_price}
                                className="input-field w-full"
                                placeholder="e.g. 800" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                            <CheckCircle size={16} className="text-blue-500" />
                            Stock
                        </label>
                        <input type="number" name="stock" required min="0"
                            defaultValue={product.stock}
                            className="input-field w-full"
                            placeholder="e.g. 100" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                            Product Description
                        </label>
                        <textarea name="description" rows={5}
                            defaultValue={product.description || ''}
                            className="input-field w-full resize-y"
                            placeholder="Describe the product details, features, and selling points..."></textarea>
                    </div>

                    <div className="pt-4 border-t border-slate-700/50">
                        <button type="submit" className="btn-primary w-full md:w-auto px-8 py-3 text-lg flex items-center justify-center gap-2">
                            <Save size={20} /> Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
