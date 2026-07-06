import { notFound } from "next/navigation"
import { pragmaticsData } from "@/data/pragmatics-data"
import { PragmaticsReferenceDetailPage } from "@/components/reference/pragmatics-reference-detail-page"
import { getReferenceIndex } from "@/lib/reference-routes"

interface PragmaticsItemPageProps {
  params: Promise<{ itemId: string }>
}

export function generateStaticParams() {
  return pragmaticsData.map((scenario) => ({ itemId: scenario.id }))
}

export default async function PragmaticsItemPage({ params }: PragmaticsItemPageProps) {
  const { itemId } = await params
  if (getReferenceIndex(pragmaticsData, itemId) === null) notFound()

  return <PragmaticsReferenceDetailPage selectedItemId={itemId} />
}
