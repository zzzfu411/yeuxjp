"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { createSeededRandom } from "@/lib/seeded-random"
import { shuffleSentenceChunks, SENTENCE_ASSEMBLY_INSTRUCTION } from "@/lib/sentence-assembly"
import type { Question } from "@/lib/questions"

export function ReviewSentenceBuild({ chunks, question, disabled, onSubmit, seed }: {
  chunks: string[]; disabled: boolean; onSubmit: (answer: string) => Promise<unknown>; seed: string
  question: Pick<Question, "correctAnswer" | "acceptedAnswers">
}) {
  const [pool] = useState(() => shuffleSentenceChunks(chunks, question, createSeededRandom(seed)))
  const [selected, setSelected] = useState<number[]>([])
  const [pending, setPending] = useState(false)
  const locked = disabled || pending
  return <section className="w-full space-y-4" aria-label="词块组句">
    <p className="text-sm leading-6 text-muted-foreground">{SENTENCE_ASSEMBLY_INSTRUCTION}</p>
    <p className="min-h-16 border-b border-border py-3 font-jp text-xl leading-9" aria-live="polite">{selected.map(id => chunks[id]).join("") || "点击词块组成句子"}</p>
    <div className="flex flex-wrap gap-2">{pool.map(({ chunk, idx }) => <Button key={idx} variant="outline" disabled={locked || selected.includes(idx)} onClick={() => setSelected(prev => [...prev, idx])} data-testid={`review-chunk-${idx}`}>{chunk}</Button>)}</div>
    <div className="flex gap-3"><Button variant="outline" disabled={locked || !selected.length} onClick={() => setSelected(prev => prev.slice(0, -1))}>撤回词块</Button>
      <Button disabled={locked || selected.length !== chunks.length} data-testid="review-submit-sentence" onClick={async () => {
        setPending(true)
        try { await onSubmit(selected.map(id => chunks[id]).join("")) } finally { setPending(false) }
      }}>确认句子</Button></div>
  </section>
}
