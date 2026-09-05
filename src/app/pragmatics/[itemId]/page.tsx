import { pageMetadata } from "@/lib/site-metadata"
import { notFound } from "next/navigation"
import { pragmaticsData } from "@/data/pragmatics-data"
import { PragmaticsReferenceDetailPage } from "@/components/reference/pragmatics-reference-detail-page"
import { getReferenceIndex } from "@/lib/reference-routes"

interface PragmaticsItemPageProps {
  params: Promise<{ itemId: string }>
}

export async function generateMetadata({ params }: PragmaticsItemPageProps) {
  const { itemId } = await params
  const point = pragmaticsData.find(point => point.id === itemId)
  if (!point) notFound()
  return pageMetadata(`/pragmatics/${point.id}`, point.title,
    `学习「${point.title}」场景的日语表达：${point.situation}。${point.context}${point.culturalNote}`)
}

export function generateStaticParams() {
  return pragmaticsData.map((scenario) => ({ itemId: scenario.id }))
}

export default async function PragmaticsItemPage({ params }: PragmaticsItemPageProps) {
  const { itemId } = await params
  if (getReferenceIndex(pragmaticsData, itemId) === null) notFound()

  return <PragmaticsReferenceDetailPage selectedItemId={itemId} />
}
