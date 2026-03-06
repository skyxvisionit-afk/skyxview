import SellForm from '@/components/shop/SellForm'

export const dynamic = 'force-dynamic'

export default async function LeaderSellPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return <SellForm productId={id} basePath="/leader" />
}
