import { notFound } from "next/navigation"
import { semanticsData } from "@/data/semantics-data"
import { SemanticsReferenceDetailPage } from "@/components/reference/semantics-reference-detail-page"
import { getReferenceIndex } from "@/lib/reference-routes"

interface SemanticsItemPageProps {
  params: Promise<{ itemId: string }>
}

export function generateStaticParams() {
  return semanticsData.map((point) => ({ itemId: point.id }))
}

export default async function SemanticsItemPage({ params }: SemanticsItemPageProps) {
  const { itemId } = await params
  if (getReferenceIndex(semanticsData, itemId) === null) notFound()

  return <SemanticsReferenceDetailPage selectedItemId={itemId} />
}
