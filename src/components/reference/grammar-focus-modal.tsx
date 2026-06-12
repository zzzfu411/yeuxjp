"use client"

import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react"
import type { GrammarPoint } from "@/data/grammar-data"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { SpeakButton } from "@/components/ui/speak-button"

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
      className="max-w-3xl h-[85vh] flex flex-col p-0 overflow-hidden"
      ariaLabelledBy={titleId}
      ariaDescribedBy={descriptionId}
    >
      {point && (
        <>
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            <div className="space-y-4 text-center pb-6 border-b">
              <div className="flex items-center justify-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                <BookOpen className="w-4 h-4" />
                {point.level} 语法 No.{selectedPosition}
              </div>
              <h2 id={titleId} className="text-4xl font-bold tracking-tight">{point.title}</h2>
              <p id={descriptionId} className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">{point.explanation}</p>
            </div>

            <div className="space-y-8">
              <div className="bg-primary/5 p-6 rounded-xl border border-primary/20 text-center">
                <div className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">结构</div>
                <code className="text-3xl font-mono font-bold text-primary block">{point.structure}</code>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-px bg-border flex-1" />
                  <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">例句</div>
                  <div className="h-px bg-border flex-1" />
                </div>

                <div className="grid gap-6">
                  {point.examples.map((ex, i) => (
                    <div key={i} className="bg-card p-6 rounded-xl border shadow-sm space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-2xl font-medium tracking-wide text-foreground">{ex.japanese}</div>
                        <SpeakButton text={ex.japanese} label="朗读例句" className="shrink-0" />
                      </div>
                      <div className="text-base text-primary/80 font-serif italic">{ex.romaji}</div>
                      <div className="text-lg text-muted-foreground">{ex.meaning}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t bg-muted/20 flex justify-between items-center shrink-0">
            <Button variant="ghost" onClick={onPrev} className="gap-2 pl-2">
              <ChevronLeft className="w-5 h-5" /> 上一条
            </Button>
            <div className="text-sm text-muted-foreground font-mono">
              {selectedPosition} / {total}
            </div>
            <Button variant="ghost" onClick={onNext} className="gap-2 pr-2">
              下一条 <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </>
      )}
    </Modal>
  )
}
