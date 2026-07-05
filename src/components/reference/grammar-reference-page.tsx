import { grammarData } from "@/data/grammar-data"
import { GrammarReferenceControls } from "@/components/reference/grammar-reference-controls"
import { NextStepCard } from "@/components/learning/next-step-card"

export function GrammarReferencePage() {
  return (
    <div className="container py-10 px-4 mx-auto space-y-8 max-w-4xl mb-20">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">语法道场 (Grammar Dojo)</h1>
      </div>

      <GrammarReferenceControls pointsByLevel={grammarData} />

      <NextStepCard />
    </div>
  )
}
