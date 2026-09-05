import Link from "next/link"
import { Users } from "lucide-react"
import { pragmaticsData } from "@/data/pragmatics-data"
import { PragmaticsFocusModal } from "@/components/reference/pragmatics-focus-modal"
import { buttonVariants } from "@/components/ui/button"
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
    <div className="paper-wrap min-h-[70vh] max-w-4xl py-10">
      <div className="paper-sheet relative mx-auto max-w-2xl space-y-3 px-6 py-10 text-center sm:px-10">
        <span className="paper-tape" aria-hidden="true" />
        <p className="eyebrow">按场景学习表达</p>
        <h1 className="flex items-center justify-center gap-3 font-brush text-4xl font-normal">
          <Users className="h-7 w-7 text-muted-foreground" />
          情境表达
        </h1>
        <p className="font-scribble text-xl text-muted-foreground">Context Dojo</p>
        <p className="pt-2 text-lg text-foreground/80">{selectedScenario.title}</p>
        <Link
          href="/pragmatics"
          className={buttonVariants({
            variant: "ghost",
            className: "mt-3 rounded-none border-0 border-b border-dashed border-border bg-transparent px-1 font-normal shadow-none hover:translate-y-0 hover:border-accent hover:bg-transparent",
          })}
        >
          返回情境列表
        </Link>
        <span className="sr-only">{selectedScenario.id}</span>
      </div>

      <PragmaticsFocusModal
        scenario={selectedScenario}
        selectedPosition={selectedIndex + 1}
        total={pragmaticsData.length}
        closeHref="/pragmatics"
        prevHref={prevHref}
        nextHref={nextHref}
      />
    </div>
  )
}
