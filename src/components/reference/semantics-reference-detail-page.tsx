import { semanticsData } from "@/data/semantics-data"
import { SemanticsFocusModal } from "@/components/reference/semantics-focus-modal"
import { getReferenceIndex, getReferenceNavigation } from "@/lib/reference-routes"

interface SemanticsReferenceDetailPageProps {
  selectedItemId: string
}

export function SemanticsReferenceDetailPage({ selectedItemId }: SemanticsReferenceDetailPageProps) {
  const selectedIndex = getReferenceIndex(semanticsData, selectedItemId)
  const { selectedItem: selectedPoint, prevHref, nextHref } = getReferenceNavigation(
    semanticsData,
    "/semantics",
    selectedIndex
  )

  if (selectedIndex === null || !selectedPoint) return null

  return (
    <div className="paper-wrap max-w-4xl py-8 sm:py-10">
      <SemanticsFocusModal
        point={selectedPoint}
        selectedPosition={selectedIndex + 1}
        total={semanticsData.length}
        closeHref="/semantics"
        prevHref={prevHref}
        nextHref={nextHref}
        presentation="page"
      />
    </div>
  )
}
