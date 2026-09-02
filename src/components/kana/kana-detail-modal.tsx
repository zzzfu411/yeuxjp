"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { CheckCircle2, ChevronLeft, ChevronRight, PenTool, Volume2 } from "lucide-react"
import type { Kana } from "@/data/kana-data"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { cn } from "@/lib/utils"
import type { StrokeAvailability } from "@/lib/kana-grid-model"

const KanaStrokeAnimCJK = dynamic(
  () => import("./kana-stroke-animcjk").then((mod) => mod.KanaStrokeAnimCJK),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center border-y border-border/40 bg-muted/20 text-sm text-muted-foreground">
        加载笔顺动画...
      </div>
    ),
  }
)

export function KanaDetailModal({
  kana,
  mode,
  currentChar,
  currentStrokeAvailability,
  selectedIndex,
  total,
  isWriting,
  isPlaying,
  hasStrokes,
  isComboChar,
  learned,
  canToggleMastered,
  onClose,
  onPrev,
  onNext,
  onPlay,
  onToggleWriting,
  onToggleMastered,
}: {
  kana: Kana | null
  mode: "hiragana" | "katakana"
  currentChar: string | null
  currentStrokeAvailability: StrokeAvailability
  selectedIndex: number | null
  total: number
  isWriting: boolean
  isPlaying: boolean
  hasStrokes: boolean
  isComboChar: boolean
  learned: boolean
  canToggleMastered: boolean
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  onPlay: () => void
  onToggleWriting: () => void
  onToggleMastered: () => void
}) {
  const isCheckingStrokeResource = !isWriting && !!currentChar && currentStrokeAvailability === "unknown"
  const isMissingStrokeResource = !isWriting && !!currentChar && currentStrokeAvailability === "missing"
  const titleId = "kana-detail-modal-title"
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null)

  // The stroke toggle sits below the glyph on a short screen. Browsers scroll
  // the focused button into view before React paints the new animation, which
  // can leave the animation surface above the modal viewport. Reset the
  // content scroll after entering stroke mode so the newly selected surface is
  // immediately visible.
  React.useEffect(() => {
    if (!isWriting) return
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0
  }, [currentChar, isWriting])

  return (
    <Modal
      isOpen={selectedIndex !== null}
      onClose={onClose}
      className="paper-sheet flex h-[min(76vh,46rem)] max-w-md flex-col overflow-hidden border border-border/60 bg-card p-0 shadow-paper"
      ariaLabelledBy={titleId}
    >
      {kana && (
        <div className="flex min-h-0 flex-1 flex-col">
          <h2 id={titleId} className="sr-only">
            {currentChar ? `${currentChar} ${kana.romaji}` : kana.romaji}
          </h2>
          <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="flex min-h-full flex-col items-center justify-start space-y-7 px-5 py-8 sm:justify-center sm:px-8">
              <div className="font-scribble text-lg text-muted-foreground">
                {kana.romaji}
              </div>

              {isWriting && currentChar ? (
                <div className={cn("flex h-64 w-full items-stretch justify-center sm:h-72", isComboChar ? "max-w-[22rem]" : "max-w-64")}>
                  <KanaStrokeAnimCJK
                    char={currentChar}
                    label={`笔顺：${kana.romaji}`}
                    className="w-full"
                  />
                </div>
              ) : (
                <div className="relative flex aspect-square w-full max-w-64 items-center justify-center overflow-hidden border-y border-border/40 bg-muted/15">
                  <span
                    className={cn(
                      "font-jp whitespace-nowrap pb-3 font-semibold leading-none text-foreground",
                      isComboChar ? "text-[5.25rem]" : "text-[8.5rem]"
                    )}
                  >
                    {mode === "hiragana" ? kana.hiragana : kana.katakana}
                  </span>
                  {!isComboChar && (
                    <span className="font-jp absolute left-4 top-4 select-none text-5xl text-muted-foreground/10">
                      {mode === "hiragana" ? kana.katakana : kana.hiragana}
                    </span>
                  )}
                </div>
              )}

              {isCheckingStrokeResource ? (
                <div
                  className="border-y border-border/35 bg-muted/15 px-4 py-3 text-center text-sm text-muted-foreground"
                  aria-live="polite"
                >
                  正在确认 AnimCJK 笔顺资源，确认可用后会显示笔顺入口。
                </div>
              ) : null}

              {isMissingStrokeResource ? (
                <div
                  className="border-y border-border/35 bg-muted/15 px-4 py-3 text-center text-sm text-muted-foreground"
                  aria-live="polite"
                >
                  当前字符暂无可用 AnimCJK 笔顺资源，仍可朗读和标记掌握。
                </div>
              ) : null}

              <div className="w-full space-y-3 border-t border-border/35 pt-5">
                <div className="flex w-full flex-wrap gap-3">
                  <Button
                    size="lg"
                    className="flex-1"
                    onClick={onPlay}
                    disabled={isPlaying}
                  >
                    <Volume2 className={cn("w-5 h-5 mr-2", isPlaying && "animate-pulse")} />
                    朗读
                  </Button>

                  {hasStrokes && (
                    <Button
                      size="lg"
                      variant="outline"
                      className="flex-1"
                      data-testid="kana-stroke-toggle"
                      onClick={onToggleWriting}
                    >
                      <PenTool className="w-5 h-5 mr-2" />
                      {isWriting ? "字形" : "笔顺"}
                    </Button>
                  )}
                </div>

                {canToggleMastered && (
                  <Button
                    size="lg"
                    variant={learned ? "default" : "secondary"}
                    className="w-full"
                    onClick={onToggleMastered}
                    aria-pressed={learned}
                    data-testid="kana-mastery-toggle"
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    {learned ? "已掌握" : "标记已掌握"}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-between border-t border-border/40 bg-muted/15 p-4">
            <Button variant="ghost" size="icon" aria-label="上一个假名" onClick={onPrev}>
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <div className="font-scribble text-sm text-muted-foreground">
              {(selectedIndex ?? 0) + 1} / {total}
            </div>
            <Button variant="ghost" size="icon" aria-label="下一个假名" onClick={onNext}>
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
