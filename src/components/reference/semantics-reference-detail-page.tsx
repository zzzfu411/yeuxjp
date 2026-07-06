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
    <div className="container py-10 px-4 mx-auto max-w-4xl min-h-[70vh]">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-3">
          <BrainCircuit className="w-8 h-8 text-primary" />
          Nuance Lab
        </h1>
        <p className="text-muted-foreground text-lg">{selectedPoint.title}</p>
        <Link href="/semantics" className={buttonVariants({ variant: "outline" })}>
          Back to all nuance cards
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
