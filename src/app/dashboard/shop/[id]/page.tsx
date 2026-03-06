import ProductDetails from '@/components/shop/ProductDetails'

export const dynamic = 'force-dynamic'

export default async function MemberProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return <ProductDetails productId={id} basePath="/dashboard" />
}
