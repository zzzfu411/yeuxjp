import Link from "next/link"
import { Suspense } from "react"
import { MessageCircle, Users } from "lucide-react"
import { pragmaticsData } from "@/data/pragmatics-data"
import { PragmaticsFocusModal } from "@/components/reference/pragmatics-focus-modal"
import { ReferenceQueryRedirect } from "@/components/reference/reference-query-redirect"

export function getPragmaticsIndex(itemId: string | undefined) {
  if (!itemId) return null
  const index = pragmaticsData.findIndex((scenario) => scenario.id === itemId)
  return index >= 0 ? index : null
}

export function pragmaticsItemHref(index: number) {
  return `/pragmatics/${encodeURIComponent(pragmaticsData[index].id)}`
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
  const selectedScenario = selectedIndex === null ? null : pragmaticsData[selectedIndex]
  const prevHref =
    selectedIndex === null
      ? "/pragmatics"
      : pragmaticsItemHref((selectedIndex - 1 + pragmaticsData.length) % pragmaticsData.length)
  const nextHref =
    selectedIndex === null
      ? "/pragmatics"
      : pragmaticsItemHref((selectedIndex + 1) % pragmaticsData.length)

  return (
    <div className="container py-10 px-4 mx-auto space-y-12 max-w-4xl mb-20">
      {enableQueryRedirect && (
        <Suspense fallback={null}>
          <ReferenceQueryRedirect basePath="/pragmatics" validIds={pragmaticsData.map((scenario) => scenario.id)} />
        </Suspense>
      )}

      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          情境模拟 (Context Dojo)
        </h1>
        <p className="text-muted-foreground text-lg">选择一个情境进行挑战。</p>
      </div>

      <div className="grid gap-8">
        {pragmaticsData.map((scenario, index) => (
          <Link
            key={scenario.id}
            href={pragmaticsItemHref(index)}
            className="border-l-4 border-primary/50 pl-6 py-4 space-y-4 hover:bg-muted/20 transition-colors rounded-r-xl"
          >
            <div>
              <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-sm mb-1">
                <MessageCircle className="w-4 h-4" />
                Scenario: {scenario.situation}
              </div>
              <h2 className="text-2xl font-bold mb-2">{scenario.title}</h2>
              <p className="text-lg text-foreground/80 font-medium">{scenario.context}</p>
            </div>

            <div className="flex gap-2 opacity-60">
              {scenario.responses.slice(0, 2).map((response, responseIndex) => (
                <div key={responseIndex} className="text-xs bg-muted px-2 py-1 rounded border">
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
