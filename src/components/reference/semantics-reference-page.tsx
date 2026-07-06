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
    <div className="container py-10 px-4 mx-auto space-y-12 max-w-4xl mb-20">
      {enableQueryRedirect && (
        <Suspense fallback={null}>
          <ReferenceQueryRedirect basePath="/semantics" validIds={semanticsData.map((point) => point.id)} />
        </Suspense>
      )}

      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-3">
          <BrainCircuit className="w-8 h-8 text-primary" />
          语义辨析 (Nuance Lab)
        </h1>
        <p className="text-muted-foreground text-lg">点击卡片进入深度辨析模式。</p>
      </div>

      <div className="grid gap-10">
        {semanticsData.map((point, index) => (
          <Link
            key={point.id}
            href={semanticsItemHref(index)}
            className="group relative bg-card border rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden"
          >
            <div className="bg-secondary/30 p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 group-hover:bg-secondary/50 transition-colors">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span className="text-primary">{point.pair[0]}</span>
                <ArrowRightLeft className="w-5 h-5 text-muted-foreground" />
                <span className="text-primary">{point.pair[1]}</span>
              </h2>
              <div className="text-sm font-mono text-muted-foreground bg-background/50 px-3 py-1 rounded-full border">
                {point.title}
              </div>
            </div>

            <div className="p-6 grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-yellow-500 mt-1 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">核心语义差异</h3>
                    <p className="text-muted-foreground leading-relaxed">{point.explanation}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {point.examples.slice(0, 1).map((example, exampleIndex) => (
                  <div key={exampleIndex} className="bg-muted/30 p-3 rounded-lg text-sm">
                    <div className="font-medium">{example.sentence}</div>
                    <div className="text-muted-foreground">{example.translation}</div>
                  </div>
                ))}
                <div className="text-xs text-center text-muted-foreground mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to see full analysis
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
