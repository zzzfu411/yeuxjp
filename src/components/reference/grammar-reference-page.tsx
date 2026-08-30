import { grammarData } from "@/data/grammar-data"
import { GrammarReferenceControls } from "@/components/reference/grammar-reference-controls"
import { NextStepCard } from "@/components/learning/next-step-card"

export function GrammarReferencePage() {
  return (
    <div className="paper-wrap mb-20 max-w-4xl space-y-10 py-10">
      <div className="text-center">
        <p className="eyebrow">文法 · Grammar Dojo</p>
        <h1 className="mt-2 font-brush text-4xl">语法手帖 <span className="sr-only">Grammar Dojo</span></h1>
      </div>

      <GrammarReferenceControls pointsByLevel={grammarData} />

      <NextStepCard />
    </div>
  )
}
