import { notFound } from "next/navigation"
import { semanticsData } from "@/data/semantics-data"
import { getSemanticsIndex, SemanticsReferencePage } from "@/components/reference/semantics-reference-page"

interface SemanticsItemPageProps {
  params: Promise<{ itemId: string }>
}

export function generateStaticParams() {
  return semanticsData.map((point) => ({ itemId: point.id }))
}

export default async function SemanticsItemPage({ params }: SemanticsItemPageProps) {
  const { itemId } = await params
  if (getSemanticsIndex(itemId) === null) notFound()

  return <SemanticsReferencePage selectedItemId={itemId} />
}
