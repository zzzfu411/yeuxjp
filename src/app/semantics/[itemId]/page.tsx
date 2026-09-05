import { pageMetadata } from "@/lib/site-metadata"
import { notFound } from "next/navigation"
import { semanticsData } from "@/data/semantics-data"
import { SemanticsReferenceDetailPage } from "@/components/reference/semantics-reference-detail-page"
import { getReferenceIndex } from "@/lib/reference-routes"

interface SemanticsItemPageProps {
  params: Promise<{ itemId: string }>
}

export async function generateMetadata({ params }: SemanticsItemPageProps) {
  const { itemId } = await params
  const point = semanticsData.find(point => point.id === itemId)
  if (!point) notFound()
  return pageMetadata(`/semantics/${point.id}`, point.title, point.explanation)
}

export function generateStaticParams() {
  return semanticsData.map((point) => ({ itemId: point.id }))
}

export default async function SemanticsItemPage({ params }: SemanticsItemPageProps) {
  const { itemId } = await params
  if (getReferenceIndex(semanticsData, itemId) === null) notFound()

  return <SemanticsReferenceDetailPage selectedItemId={itemId} />
}
