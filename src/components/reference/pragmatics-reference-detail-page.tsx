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
    <div className="container py-10 px-4 mx-auto max-w-4xl min-h-[70vh]">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          Context Dojo
        </h1>
        <p className="text-muted-foreground text-lg">{selectedScenario.title}</p>
        <Link href="/pragmatics" className={buttonVariants({ variant: "outline" })}>
          Back to all scenarios
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
