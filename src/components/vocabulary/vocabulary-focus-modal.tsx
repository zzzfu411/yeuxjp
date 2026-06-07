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
  onClose: () => void
  onFlip: () => void
  onNext: () => void
  onPrev: () => void
  onPlay: () => void
  onToggleLearned: () => void
}) {
  return (
    <Modal isOpen={vocab !== null} onClose={onClose} className="max-w-xl h-[70vh] flex flex-col p-0 overflow-hidden rounded-2xl">
      {vocab && (
        <>
          <div
            className="flex-1 relative cursor-pointer group bg-gradient-to-b from-card to-secondary/10"
            onClick={onFlip}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
              {!flipped ? (
                <div className="animate-in fade-in zoom-in duration-200 space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-6xl sm:text-7xl font-bold text-foreground tracking-tight">{vocab.kanji || vocab.kana}</h2>
                    {vocab.kanji && <p className="text-2xl text-muted-foreground/80 font-medium">{vocab.kana}</p>}
                  </div>
                  <div className="absolute bottom-8 left-0 right-0 flex justify-center opacity-50 group-hover:opacity-100 transition-opacity">
                    <div className="bg-background/80 backdrop-blur px-4 py-1.5 rounded-full text-xs font-medium text-muted-foreground shadow-sm flex items-center gap-2 border">
                      <RotateCw className="w-3 h-3" /> Tap or Space to Flip
                    </div>
                  </div>
                </div>
              ) : (
                <div className="animate-in fade-in zoom-in duration-200 space-y-8 w-full max-w-sm">
                  <div className="space-y-1">
                    <p className="text-4xl font-bold text-primary">{vocab.meaning}</p>
                    <p className="text-xl text-muted-foreground font-serif italic">{vocab.romaji}</p>
                  </div>
                  <div className="pt-2">
                    <Button
                      size="lg"
                      className="w-full rounded-full gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                      onClick={(event) => {
                        event.stopPropagation()
                        onPlay()
                      }}
                    >
                      <Volume2 className="w-5 h-5" /> Listen
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
              <ChevronLeft className="w-4 h-4" /> Prev
            </Button>
            <div className="text-xs font-mono text-muted-foreground bg-secondary px-3 py-1 rounded-full">
              {(selectedIndex ?? 0) + 1} / {total}
            </div>
            <Button variant="ghost" size="sm" onClick={onNext} className="gap-1 pr-2 text-muted-foreground hover:text-foreground">
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}
    </Modal>
  )
}
