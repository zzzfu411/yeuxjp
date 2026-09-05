import { ReferenceCatalog } from "@/components/reference/reference-catalog"
import { Suspense } from "react"
import { BrainCircuit } from "lucide-react"
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
        <p className="eyebrow">近义表达对比</p>
        <h1 className="flex items-center justify-center gap-3 font-brush text-4xl">
          <BrainCircuit className="h-7 w-7 text-muted-foreground" />
          语义辨析
          <span className="sr-only">Nuance Lab</span>
        </h1>
        <p className="text-sm text-muted-foreground">选择一组近义表达，查看它们在语气和用法上的区别。</p>
      </div>

      <ReferenceCatalog label="语义辨析" entries={semanticsData.map(point => ({ id: point.id, title: point.title, japanese: point.pair.join(" / "), description: point.explanation, href: makeReferenceItemHref("/semantics", point.id) }))} />

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
