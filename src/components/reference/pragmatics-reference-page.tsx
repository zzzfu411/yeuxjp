import { ReferenceCatalog } from "@/components/reference/reference-catalog"
import { Suspense } from "react"
import { Users } from "lucide-react"
import { pragmaticsData } from "@/data/pragmatics-data"
import { PragmaticsFocusModal } from "@/components/reference/pragmatics-focus-modal"
import { ReferenceQueryRedirect } from "@/components/reference/reference-query-redirect"
import { getReferenceIndex, getReferenceNavigation, makeReferenceItemHref } from "@/lib/reference-routes"

export function getPragmaticsIndex(itemId: string | undefined) {
  return getReferenceIndex(pragmaticsData, itemId)
}

export function pragmaticsItemHref(index: number) {
  return makeReferenceItemHref("/pragmatics", pragmaticsData[index].id)
}

interface PragmaticsReferencePageProps {
  selectedItemId?: string
  enableQueryRedirect?: boolean
}

export function PragmaticsReferencePage({
  selectedItemId,
  enableQueryRedirect = false,
}: PragmaticsReferencePageProps) {
  const selectedIndex = getPragmaticsIndex(selectedItemId)
  const { selectedItem: selectedScenario, prevHref, nextHref } = getReferenceNavigation(
    pragmaticsData,
    "/pragmatics",
    selectedIndex
  )

  return (
    <div className="paper-wrap mb-20 max-w-4xl space-y-12 py-10">
      {enableQueryRedirect && (
        <Suspense fallback={null}>
          <ReferenceQueryRedirect basePath="/pragmatics" validIds={pragmaticsData.map((scenario) => scenario.id)} />
        </Suspense>
      )}

      <div className="space-y-2 text-center">
        <p className="eyebrow">按场景学习表达</p>
        <h1 className="flex items-center justify-center gap-3 font-brush text-4xl">
          <Users className="h-7 w-7 text-muted-foreground" />
          情境表达
          <span className="sr-only">Context Dojo</span>
        </h1>
        <p className="text-sm text-muted-foreground">选择一个情境，看看不同场合下怎样表达更自然。</p>
      </div>

      <ReferenceCatalog label="情境表达" entries={pragmaticsData.map(scenario => ({ id: scenario.id, title: scenario.title, japanese: scenario.responses.slice(0, 2).map(response => response.expression).join(" / "), description: scenario.situation + " · " + scenario.context, href: makeReferenceItemHref("/pragmatics", scenario.id) }))} />

      {selectedIndex !== null && selectedScenario && (
        <PragmaticsFocusModal
          scenario={selectedScenario}
          selectedPosition={selectedIndex + 1}
          total={pragmaticsData.length}
          closeHref="/pragmatics"
          prevHref={prevHref}
          nextHref={nextHref}
        />
      )}
    </div>
  )
}
