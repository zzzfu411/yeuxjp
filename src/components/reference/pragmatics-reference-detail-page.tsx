import { pragmaticsData } from "@/data/pragmatics-data"
import { PragmaticsFocusModal } from "@/components/reference/pragmatics-focus-modal"
import { getReferenceIndex, getReferenceNavigation } from "@/lib/reference-routes"

interface PragmaticsReferenceDetailPageProps {
  selectedItemId: string
}

export function PragmaticsReferenceDetailPage({ selectedItemId }: PragmaticsReferenceDetailPageProps) {
  const selectedIndex = getReferenceIndex(pragmaticsData, selectedItemId)
  const { selectedItem: selectedScenario, prevHref, nextHref } = getReferenceNavigation(
    pragmaticsData,
    "/pragmatics",
    selectedIndex
  )

  if (selectedIndex === null || !selectedScenario) return null

  return (
    <div className="paper-wrap max-w-3xl py-8 sm:py-10">
      <PragmaticsFocusModal
        scenario={selectedScenario}
        selectedPosition={selectedIndex + 1}
        total={pragmaticsData.length}
        closeHref="/pragmatics"
        prevHref={prevHref}
        nextHref={nextHref}
        presentation="page"
      />
    </div>
  )
}
