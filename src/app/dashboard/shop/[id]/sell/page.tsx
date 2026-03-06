import SellForm from '@/components/shop/SellForm'

export const dynamic = 'force-dynamic'

export default async function MemberSellPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return <SellForm productId={id} basePath="/dashboard" />
}
