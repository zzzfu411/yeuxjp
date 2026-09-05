"use client"

import { CheckCircle2, ChevronLeft, ChevronRight, RotateCw, Volume2 } from "lucide-react"
import type { Vocabulary } from "@/data/vocabulary/types"
import { PracticeSaveError } from "@/components/practice/practice-save-error"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { VocabCourseAppearances } from "@/components/vocabulary/vocab-course-appearances"
import { VocabularySelfAssessmentControls } from "@/components/vocabulary/vocabulary-self-assessment-controls"
import type { VocabularySelfAssessment } from "@/lib/vocabulary-self-assessment"

export function VocabularyFocusModal({
  vocab,
  selectedIndex,
  total,
  flipped,
  learned,
  assessment,
  saveError,
  showRomaji = true,
  onClose,
  onFlip,
  onNext,
  onPrev,
  onPlay,
  onSelfAssess,
  onToggleLearned,
}: {
  vocab: Vocabulary | null
  selectedIndex: number | null
  total: number
  flipped: boolean
  learned: boolean
  assessment: VocabularySelfAssessment | null
  saveError: boolean
  showRomaji?: boolean
  onClose: () => void
  onFlip: () => void
  onNext: () => void
  onPrev: () => void
  onPlay: () => void
  onSelfAssess: (rating: VocabularySelfAssessment) => void
  onToggleLearned: () => void
}) {
  const titleId = "vocabulary-focus-modal-title"
  const descriptionId = "vocabulary-focus-modal-description"

  return (
    <Modal
      isOpen={vocab !== null}
      onClose={onClose}
      className="paper-sheet flex h-[min(76vh,46rem)] max-w-xl flex-col overflow-hidden border border-border/60 bg-card p-0 shadow-paper"
      ariaLabelledBy={titleId}
      ariaDescribedBy={descriptionId}
    >
      {vocab && (
        <>
          <span className="paper-tape top-0" aria-hidden="true" />
          <h2 id={titleId} className="sr-only">
            {vocab.kanji || vocab.kana}
          </h2>
          <p id={descriptionId} className="sr-only">
            {vocab.meaning}
          </p>
          <div
            className="group relative min-h-0 flex-1 overflow-y-auto overscroll-contain bg-transparent text-inherit outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            <Button variant="outline" className="mx-6 mt-10" onClick={onFlip} aria-pressed={flipped} data-testid="vocabulary-focus-card">{flipped ? "返回词面" : "翻面查看释义"}</Button>
            <div className="flex min-h-full flex-col items-center justify-center p-6 text-center sm:p-9">
              {!flipped ? (
                <div className="animate-in fade-in zoom-in space-y-7 duration-200">
                  <div className="space-y-2">
                    <p className="eyebrow">ことば · Word</p>
                    <h2 className="font-jp text-6xl font-medium text-foreground sm:text-7xl" lang="ja">{vocab.kanji || vocab.kana}</h2>
                    {vocab.kanji && <p className="text-2xl text-muted-foreground/80" lang="ja">{vocab.kana}</p>}
                  </div>
                  <div className="flex justify-center">
                    <div className="font-scribble flex items-center gap-2 border-b border-dashed border-border/70 px-1 pb-1 text-sm text-muted-foreground">
                      <RotateCw className="h-3 w-3" /> 用上方按钮查看释义
                    </div>
                  </div>
                </div>
              ) : (
                <div className="animate-in fade-in zoom-in w-full max-w-sm space-y-6 duration-200">
                  <div className="space-y-1">
                    <p className="eyebrow">释义 · Meaning</p>
                    <p className="text-4xl font-semibold text-accent">{vocab.meaning}</p>
                    {showRomaji && <p className="font-scribble text-xl text-muted-foreground">{vocab.romaji}</p>}
                    <VocabCourseAppearances vocabId={vocab.id} />
                  </div>
                  {vocab.exampleSentences?.[0] && (
                    <div className="ledger-row space-y-1 border-y border-border/45 px-4 py-3 text-left">
                      <p className="text-base leading-relaxed text-foreground" lang="ja">{vocab.exampleSentences[0].japanese}</p>
                      {showRomaji && vocab.exampleSentences[0].romaji && (
                        <p className="font-scribble text-sm text-muted-foreground">{vocab.exampleSentences[0].romaji}</p>
                      )}
                      <p className="text-sm text-muted-foreground">{vocab.exampleSentences[0].meaning}</p>
                    </div>
                  )}
                  <div className="pt-2">
                    <Button
                      size="lg"
                      className="w-full gap-2 border border-border/60 bg-transparent text-foreground shadow-none transition-colors hover:translate-x-0 hover:translate-y-0 hover:bg-muted/40 hover:shadow-none"
                      onClick={(event) => {
                        event.stopPropagation()
                        onPlay()
                      }}
                    >
                      <Volume2 className="w-5 h-5" /> 朗读
                    </Button>
                  </div>
                  <VocabularySelfAssessmentControls value={assessment} onSelect={onSelfAssess} />
                  <PracticeSaveError show={saveError} />
                  <div className="pt-2">
                    <Button
                      size="lg"
                      variant={learned ? "default" : "secondary"}
                      className="w-full gap-2 border border-border/60 bg-transparent text-foreground shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-muted/40 hover:shadow-none aria-pressed:border-accent aria-pressed:text-accent"
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

          <div className="flex shrink-0 select-none items-center justify-between border-t border-border/50 bg-card/70 p-4">
            <Button variant="ghost" size="sm" onClick={onPrev} className="gap-1 border-0 bg-transparent pl-2 text-muted-foreground shadow-none hover:translate-x-0 hover:translate-y-0 hover:border-0 hover:bg-transparent hover:text-foreground hover:shadow-none">
              <ChevronLeft className="h-4 w-4" /> 上一条
            </Button>
            <div className="font-scribble text-base text-muted-foreground">
              {(selectedIndex ?? 0) + 1} / {total}
            </div>
            <Button variant="ghost" size="sm" onClick={onNext} className="gap-1 border-0 bg-transparent pr-2 text-muted-foreground shadow-none hover:translate-x-0 hover:translate-y-0 hover:border-0 hover:bg-transparent hover:text-foreground hover:shadow-none">
              下一条 <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </Modal>
  )
}
