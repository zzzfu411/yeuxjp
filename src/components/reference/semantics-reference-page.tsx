import Link from "next/link"
import { Suspense } from "react"
import { ArrowRightLeft, BrainCircuit, Lightbulb } from "lucide-react"
import { semanticsData } from "@/data/semantics-data"
import { SemanticsFocusModal } from "@/components/reference/semantics-focus-modal"
import { ReferenceQueryRedirect } from "@/components/reference/reference-query-redirect"
import { getReferenceIndex, getReferenceNavigation, makeReferenceItemHref } from "@/lib/reference-routes"

export function getSemanticsIndex(itemId: string | undefined) {
  return getReferenceIndex(semanticsData, itemId)
}

export function semanticsItemHref(index: number) {
  return makeReferenceItemHref("/semantics", semanticsData[index].id)
}

interface SemanticsReferencePageProps {
  selectedItemId?: string
  enableQueryRedirect?: boolean
}

export function SemanticsReferencePage({
  selectedItemId,
  enableQueryRedirect = false,
}: SemanticsReferencePageProps) {
  const selectedIndex = getSemanticsIndex(selectedItemId)
  const { selectedItem: selectedPoint, prevHref, nextHref } = getReferenceNavigation(
    semanticsData,
    "/semantics",
    selectedIndex
  )

  return (
    <div className="paper-wrap mb-20 max-w-4xl space-y-12 py-10">
      {enableQueryRedirect && (
        <Suspense fallback={null}>
          <ReferenceQueryRedirect basePath="/semantics" validIds={semanticsData.map((point) => point.id)} />
        </Suspense>
      )}

      <div className="space-y-2 text-center">
        <p className="eyebrow">意味 · Nuance notes</p>
        <h1 className="flex items-center justify-center gap-3 font-brush text-4xl">
          <BrainCircuit className="h-7 w-7 text-muted-foreground" />
          语义辨析
          <span className="sr-only">Nuance Lab</span>
        </h1>
        <p className="text-sm text-muted-foreground">点击纸笺进入深度辨析。</p>
      </div>

      <div className="grid gap-10">
        {semanticsData.map((point, index) => (
          <Link
            key={point.id}
            href={semanticsItemHref(index)}
            className="paper-slip group relative"
          >
            <span className="paper-tape" aria-hidden="true" />
            <div className="flex flex-col justify-between gap-4 border-b border-border/35 p-6 md:flex-row md:items-center">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span className="text-primary">{point.pair[0]}</span>
                <ArrowRightLeft className="w-5 h-5 text-muted-foreground" />
                <span className="text-primary">{point.pair[1]}</span>
              </h2>
              <div className="font-scribble text-base text-muted-foreground">
                {point.title}
              </div>
            </div>

            <div className="p-6 grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="mt-1 h-5 w-5 shrink-0 text-accent" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">核心语义差异</h3>
                    <p className="text-muted-foreground leading-relaxed">{point.explanation}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {point.examples.slice(0, 1).map((example, exampleIndex) => (
                  <div key={exampleIndex} className="border-l border-border/45 bg-primary/[0.035] p-3 text-sm">
                    <div className="font-medium">{example.sentence}</div>
                    <div className="text-muted-foreground">{example.translation}</div>
                  </div>
                ))}
                <div className="font-scribble mt-2 text-center text-sm text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                  open note →
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {selectedIndex !== null && selectedPoint && (
        <SemanticsFocusModal
          point={selectedPoint}
          selectedPosition={selectedIndex + 1}
          total={semanticsData.length}
          closeHref="/semantics"
          prevHref={prevHref}
          nextHref={nextHref}
        />
      )}
    </div>
  )
}
