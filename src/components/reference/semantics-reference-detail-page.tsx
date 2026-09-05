import Link from "next/link"
import { BrainCircuit } from "lucide-react"
import { semanticsData } from "@/data/semantics-data"
import { SemanticsFocusModal } from "@/components/reference/semantics-focus-modal"
import { buttonVariants } from "@/components/ui/button"
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
    <div className="paper-wrap min-h-[70vh] max-w-4xl py-10">
      <div className="paper-sheet relative mx-auto max-w-2xl space-y-3 px-6 py-10 text-center sm:px-10">
        <span className="paper-tape" aria-hidden="true" />
        <p className="eyebrow">近义表达对比</p>
        <h1 className="flex items-center justify-center gap-3 font-brush text-4xl font-normal">
          <BrainCircuit className="h-7 w-7 text-muted-foreground" />
          语义辨析
        </h1>
        <p className="font-scribble text-xl text-muted-foreground">Nuance Lab</p>
        <p className="pt-2 text-lg text-foreground/80">{selectedPoint.title}</p>
        <Link
          href="/semantics"
          className={buttonVariants({
            variant: "ghost",
            className: "mt-3 rounded-none border-0 border-b border-dashed border-border bg-transparent px-1 font-normal shadow-none hover:translate-y-0 hover:border-accent hover:bg-transparent",
          })}
        >
          返回语义辨析
        </Link>
        <span className="sr-only">{selectedPoint.id}</span>
      </div>

      <SemanticsFocusModal
        point={selectedPoint}
        selectedPosition={selectedIndex + 1}
        total={semanticsData.length}
        closeHref="/semantics"
        prevHref={prevHref}
        nextHref={nextHref}
      />
    </div>
  )
}
