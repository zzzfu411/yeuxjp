"use client"

import { CheckCircle2, ChevronLeft, ChevronRight, RotateCw, Volume2 } from "lucide-react"
import type { Vocabulary } from "@/data/vocabulary/types"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"

export function VocabularyFocusModal({
  vocab,
  selectedIndex,
  total,
  flipped,
  learned,
  showRomaji = true,
  onClose,
  onFlip,
  onNext,
  onPrev,
  onPlay,
  onToggleLearned,
}: {
  vocab: Vocabulary | null
  selectedIndex: number | null
  total: number
  flipped: boolean
  learned: boolean
  showRomaji?: boolean
  onClose: () => void
  onFlip: () => void
  onNext: () => void
  onPrev: () => void
  onPlay: () => void
  onToggleLearned: () => void
}) {
  const titleId = "vocabulary-focus-modal-title"
  const descriptionId = "vocabulary-focus-modal-description"
  const handleCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return
    if (event.key !== " " && event.key !== "Enter") return

    event.preventDefault()
    onFlip()
  }

  return (
    <Modal
      isOpen={vocab !== null}
      onClose={onClose}
      className="max-w-xl h-[70vh] flex flex-col p-0 overflow-hidden rounded-2xl"
      ariaLabelledBy={titleId}
      ariaDescribedBy={descriptionId}
    >
      {vocab && (
        <>
          <h2 id={titleId} className="sr-only">
            {vocab.kanji || vocab.kana}
          </h2>
          <p id={descriptionId} className="sr-only">
            {vocab.meaning}
          </p>
          <div
            role="button"
            tabIndex={0}
            className="group relative min-h-0 flex-1 cursor-pointer overflow-y-auto overscroll-contain bg-gradient-to-b from-card to-secondary/10 text-inherit outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={onFlip}
            onKeyDown={handleCardKeyDown}
            aria-pressed={flipped}
            data-testid="vocabulary-focus-card"
          >
            <div className="flex min-h-full flex-col items-center justify-center p-6 text-center sm:p-8">
              {!flipped ? (
                <div className="animate-in fade-in zoom-in duration-200 space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-6xl sm:text-7xl font-bold text-foreground tracking-tight">{vocab.kanji || vocab.kana}</h2>
                    {vocab.kanji && <p className="text-2xl text-muted-foreground/80 font-medium">{vocab.kana}</p>}
                  </div>
                  <div className="mt-8 flex justify-center opacity-50 transition-opacity group-hover:opacity-100">
                    <div className="bg-background/80 backdrop-blur px-4 py-1.5 rounded-full text-xs font-medium text-muted-foreground shadow-sm flex items-center gap-2 border">
                      <RotateCw className="w-3 h-3" /> 点击或按空格翻面
                    </div>
                  </div>
                </div>
              ) : (
                <div className="animate-in fade-in zoom-in duration-200 space-y-6 w-full max-w-sm">
                  <div className="space-y-1">
                    <p className="text-4xl font-bold text-primary">{vocab.meaning}</p>
                    {showRomaji && <p className="text-xl text-muted-foreground font-serif italic">{vocab.romaji}</p>}
                  </div>
                  {vocab.exampleSentences?.[0] && (
                    <div className="rounded-xl border bg-background/70 px-4 py-3 text-left space-y-1">
                      <p className="text-base text-foreground leading-relaxed">{vocab.exampleSentences[0].japanese}</p>
                      {showRomaji && vocab.exampleSentences[0].romaji && (
                        <p className="text-xs text-muted-foreground font-serif italic">{vocab.exampleSentences[0].romaji}</p>
                      )}
                      <p className="text-sm text-muted-foreground">{vocab.exampleSentences[0].meaning}</p>
                    </div>
                  )}
                  <div className="pt-2">
                    <Button
                      size="lg"
                      className="w-full rounded-full gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                      onClick={(event) => {
                        event.stopPropagation()
                        onPlay()
                      }}
                    >
                      <Volume2 className="w-5 h-5" /> 朗读
                    </Button>
                  </div>
                  <div className="pt-2">
                    <Button
                      size="lg"
                      variant={learned ? "default" : "secondary"}
                      className="w-full rounded-full gap-2"
                      onClick={(event) => {
                        event.stopPropagation()
                        onToggleLearned()
                      }}
                      aria-pressed={learned}
                      data-testid="vocabulary-learned-toggle"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      {learned ? "已掌握" : "标记已掌握"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-background border-t flex justify-between items-center shrink-0 select-none">
            <Button variant="ghost" size="sm" onClick={onPrev} className="gap-1 pl-2 text-muted-foreground hover:text-foreground">
              <ChevronLeft className="w-4 h-4" /> 上一条
            </Button>
            <div className="text-xs font-mono text-muted-foreground bg-secondary px-3 py-1 rounded-full">
              {(selectedIndex ?? 0) + 1} / {total}
            </div>
            <Button variant="ghost" size="sm" onClick={onNext} className="gap-1 pr-2 text-muted-foreground hover:text-foreground">
              下一条 <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}
    </Modal>
  )
}
