import { notFound } from "next/navigation"
import { pragmaticsData } from "@/data/pragmatics-data"
import { getPragmaticsIndex, PragmaticsReferencePage } from "@/components/reference/pragmatics-reference-page"

interface PragmaticsItemPageProps {
  params: Promise<{ itemId: string }>
}

export function generateStaticParams() {
  return pragmaticsData.map((scenario) => ({ itemId: scenario.id }))
}

export default async function PragmaticsItemPage({ params }: PragmaticsItemPageProps) {
  const { itemId } = await params
  if (getPragmaticsIndex(itemId) === null) notFound()

  return <PragmaticsReferencePage selectedItemId={itemId} />
}
