import Link from "next/link"
import { Suspense } from "react"
import { MessageCircle, Users } from "lucide-react"
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
        <p className="eyebrow">場面 · Context notes</p>
        <h1 className="flex items-center justify-center gap-3 font-brush text-4xl">
          <Users className="h-7 w-7 text-muted-foreground" />
          情境模拟
          <span className="sr-only">Context Dojo</span>
        </h1>
        <p className="text-sm text-muted-foreground">选择一个情境，读一页对话。</p>
      </div>

      <div className="grid gap-8">
        {pragmaticsData.map((scenario, index) => (
          <Link
            key={scenario.id}
            href={pragmaticsItemHref(index)}
            className="paper-slip relative space-y-4 border-l-2 border-l-accent/45 p-6"
          >
            <span className="paper-tape" aria-hidden="true" />
            <div>
              <div className="mb-1 flex items-center gap-2 text-sm text-accent">
                <MessageCircle className="w-4 h-4" />
                场景：{scenario.situation}
              </div>
              <h2 className="text-2xl font-bold mb-2">{scenario.title}</h2>
              <p className="text-lg text-foreground/80 font-medium">{scenario.context}</p>
            </div>

            <div className="flex gap-2 opacity-60">
              {scenario.responses.slice(0, 2).map((response, responseIndex) => (
                <div key={responseIndex} className="border-b border-dashed border-border px-2 py-1 text-xs">
                  {response.expression}
                </div>
              ))}
              {scenario.responses.length > 2 && <div className="text-xs self-center">...</div>}
            </div>
          </Link>
        ))}
      </div>

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
