import { InvestmentDetailView } from '@/components/portfolio/InvestmentDetailView'

export default async function InvestmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <InvestmentDetailView investmentId={id} />
}
