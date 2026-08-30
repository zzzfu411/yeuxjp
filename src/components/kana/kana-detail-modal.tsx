"use client"

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
      <div className="flex h-full w-full items-center justify-center rounded-2xl border bg-muted/30 text-sm text-muted-foreground">
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

  return (
    <Modal isOpen={selectedIndex !== null} onClose={onClose} className="max-w-md" ariaLabelledBy={titleId}>
      {kana && (
        <div className="flex flex-col h-full">
          <h2 id={titleId} className="sr-only">
            {currentChar ? `${currentChar} ${kana.romaji}` : kana.romaji}
          </h2>
          <div className="flex-1 p-5 sm:p-8 flex flex-col items-center justify-center space-y-8">
            <div className="text-sm font-mono text-muted-foreground uppercase tracking-[0.2em]">
              {kana.romaji}
            </div>

            {isWriting && currentChar ? (
              <div className={cn("h-72 flex w-full items-stretch justify-center", isComboChar ? "max-w-[22rem]" : "max-w-64")}>
                <KanaStrokeAnimCJK
                  char={currentChar}
                  label={`笔顺：${kana.romaji}`}
                  className="w-full"
                />
              </div>
            ) : (
              <div className="relative h-56 w-full max-w-64 flex items-center justify-center bg-secondary/30 rounded-[2rem] border-4 border-background shadow-inner overflow-hidden">
                <span
                  className={cn(
                    "font-bold text-foreground leading-none pb-4 whitespace-nowrap",
                    isComboChar ? "text-[5.5rem] tracking-tight" : "text-[9rem]"
                  )}
                >
                  {mode === "hiragana" ? kana.hiragana : kana.katakana}
                </span>
                {!isComboChar && (
                  <span className="absolute top-4 left-5 text-5xl text-muted-foreground/10 font-serif font-black select-none">
                    {mode === "hiragana" ? kana.katakana : kana.hiragana}
                  </span>
                )}
              </div>
            )}

            {isCheckingStrokeResource ? (
              <div
                className="rounded-xl border bg-muted/30 px-4 py-3 text-center text-sm text-muted-foreground"
                aria-live="polite"
              >
                正在确认 AnimCJK 笔顺资源，确认可用后会显示笔顺入口。
              </div>
            ) : null}

            {isMissingStrokeResource ? (
              <div
                className="rounded-xl border bg-muted/30 px-4 py-3 text-center text-sm text-muted-foreground"
                aria-live="polite"
              >
                当前字符暂无可用 AnimCJK 笔顺资源，仍可朗读和标记掌握。
              </div>
            ) : null}

            <div className="w-full space-y-3">
              <div className="flex gap-3 w-full">
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

          <div className="p-4 border-t bg-muted/30 flex justify-between items-center shrink-0">
            <Button variant="ghost" size="icon" aria-label="上一个假名" onClick={onPrev}>
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <div className="text-xs font-mono text-muted-foreground">
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
