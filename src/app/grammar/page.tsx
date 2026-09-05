import { routeMetadata } from "@/lib/site-metadata"

export const metadata = routeMetadata("/grammar")

import { Suspense } from "react"
import { GrammarReferencePage } from "@/components/reference/grammar-reference-page"

export default function GrammarPage() {
  return (
    <div data-route-shell="grammar">
      <Suspense fallback={<div className="flex justify-center py-20">加载中...</div>}>
        <GrammarReferencePage />
      </Suspense>
    </div>
  )
}
