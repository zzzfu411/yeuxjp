import { Suspense } from "react"
import { GrammarReferencePage } from "@/components/reference/grammar-reference-page"

export default function GrammarPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20">加载中...</div>}>
      <GrammarReferencePage />
    </Suspense>
  )
}
