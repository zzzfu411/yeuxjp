"use client"

import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react"
import type { GrammarPoint } from "@/data/grammar-data"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { SpeakButton } from "@/components/ui/speak-button"
import { GrammarPracticePanel } from "@/components/reference/grammar-practice-panel"

export function GrammarFocusModal({
  point,
  isOpen,
  selectedPosition,
  total,
  onClose,
  onPrev,
  onNext,
}: {
  point: GrammarPoint | null
  isOpen: boolean
  selectedPosition: number | null
  total: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}) {
  const titleId = "grammar-focus-modal-title"
  const descriptionId = "grammar-focus-modal-description"

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="paper-sheet flex h-[min(85vh,52rem)] max-w-3xl flex-col overflow-hidden border border-border/60 bg-card p-0 shadow-paper"
      ariaLabelledBy={titleId}
      ariaDescribedBy={descriptionId}
    >
      {point && (
        <>
          <div className="flex-1 space-y-9 overflow-y-auto px-5 py-8 sm:px-8">
            <div className="space-y-4 border-b border-border/50 pb-7 text-center">
              <div className="eyebrow flex items-center justify-center gap-2 text-base">
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                {point.level} 语法 No.{selectedPosition}
              </div>
              <h2 id={titleId} className="inkline font-jp text-4xl font-medium">{point.title}</h2>
              <p id={descriptionId} className="mx-auto max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">{point.explanation}</p>
            </div>

            <div className="space-y-8">
              <div className="ledger-row border-y border-border/50 px-4 py-6 text-center">
                <div className="eyebrow mb-3">结构 · Pattern</div>
                <code className="font-jp block text-3xl font-medium text-foreground">{point.structure}</code>
              </div>

              {point.plainExplanation && (
                <div className="border-l-2 border-border/70 px-5 py-1">
                  <div className="eyebrow mb-2">白话理解 · In plain words</div>
                  <p className="text-base leading-relaxed">{point.plainExplanation}</p>
                </div>
              )}

              {point.pitfalls && point.pitfalls.length > 0 && (
                <div className="border-l-2 border-accent/70 bg-accent/[0.035] px-5 py-4">
                  <div className="mb-3"><span className="seal-stamp">注意</span></div>
                  <div className="eyebrow mb-2">常见坑 · Notes</div>
                  <ul className="list-disc space-y-1.5 pl-5 text-base leading-relaxed">
                    {point.pitfalls.map((pitfall, i) => (
                      <li key={i}>{pitfall}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-border/60" />
                  <div className="eyebrow">例句 · samples</div>
                  <div className="h-px flex-1 bg-border/60" />
                </div>

                <div className="grid">
                  {point.examples.map((ex, i) => (
                    <div key={i} className="ledger-row space-y-2 border-b border-border/45 px-2 py-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="font-jp text-2xl font-medium text-foreground">{ex.japanese}</div>
                        <SpeakButton text={ex.japanese} label="朗读例句" className="shrink-0" />
                      </div>
                      <div className="font-scribble text-base text-muted-foreground">{ex.romaji}</div>
                      <div className="text-lg text-muted-foreground">{ex.meaning}</div>
                    </div>
                  ))}
                </div>
              </div>

              <GrammarPracticePanel key={point.id} point={point} />
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-between border-t border-border/50 bg-card/70 p-4">
            <Button
              variant="ghost"
              onClick={onPrev}
              className="gap-2 rounded-none border-0 bg-transparent pl-2 font-normal text-muted-foreground shadow-none hover:translate-y-0 hover:border-0 hover:bg-transparent hover:text-foreground"
              data-testid="grammar-modal-prev"
            >
              <ChevronLeft className="h-5 w-5" /> 上一条
            </Button>
            <div className="font-scribble text-base text-muted-foreground" data-testid="grammar-modal-position">
              {selectedPosition} / {total}
            </div>
            <Button
              variant="ghost"
              onClick={onNext}
              className="gap-2 rounded-none border-0 bg-transparent pr-2 font-normal text-muted-foreground shadow-none hover:translate-y-0 hover:border-0 hover:bg-transparent hover:text-foreground"
              data-testid="grammar-modal-next"
            >
              下一条 <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </>
      )}
    </Modal>
  )
}
