"use client"

import { useEffect, useRef, useState } from "react"
import { Vocabulary } from "@/data/vocabulary/types"
import { cn } from "@/lib/utils"
import { CheckCircle2, Volume2, RotateCw, Maximize2 } from "lucide-react"
import { cancelJapaneseSpeech, speakJapanese } from "@/lib/speech"

interface FlashcardProps {
  vocab: Vocabulary
  onExpand?: () => void
  learned?: boolean
  showRomaji?: boolean
}

export function Flashcard({ vocab, onExpand, learned = false, showRomaji = true }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const example = vocab.exampleSentences?.[0]

  useEffect(() => () => {
    const utterance = utteranceRef.current
    utteranceRef.current = null
    if (utterance) cancelJapaneseSpeech(utterance)
  }, [vocab.id])

  const handlePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    utteranceRef.current = speakJapanese(vocab.kana)
  }

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation()
    onExpand?.()
  }

  const stopCardKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return

    if (e.key === " " || e.key === "Enter") {
      e.preventDefault()
      setIsFlipped((prev) => !prev)
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className="group paper-slip relative h-64 w-full cursor-pointer text-left perspective-1000 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:h-72"
      onClick={() => setIsFlipped(!isFlipped)}
      onKeyDown={handleKeyDown}
      aria-pressed={isFlipped}
      aria-label={`${vocab.kanji || vocab.kana}，${isFlipped ? `释义：${vocab.meaning}` : "点击翻面查看释义"}`}
    >
      <span className="paper-tape" aria-hidden="true" />
      {learned && (
        <div className="seal-stamp pointer-events-none absolute bottom-3 left-3 z-20 gap-1 text-xs" title="已掌握">
          <CheckCircle2 className="h-3 w-3" />
          熟
        </div>
      )}
      <div className={cn(
        "relative h-full w-full transform preserve-3d transition-all duration-500",
        isFlipped ? "rotate-y-180" : ""
      )}>
        <div
          className="absolute inset-0 flex h-full w-full flex-col items-center justify-center bg-card/20 p-6 text-center backface-hidden"
          aria-hidden={isFlipped}
        >
          <span className="font-scribble absolute left-4 top-4 text-sm text-muted-foreground/70">ことば</span>
          <div className="font-jp text-4xl font-medium text-foreground sm:text-5xl">{vocab.kanji || vocab.kana}</div>
          {vocab.kanji && <div className="mt-3 text-lg text-muted-foreground">{vocab.kana}</div>}

          <div className="font-scribble absolute bottom-3 right-4 flex items-center gap-1 text-sm text-muted-foreground/55">
            <RotateCw className="h-3 w-3" aria-hidden="true" /> flip
          </div>

          <button
            type="button"
            aria-label={`放大查看 ${vocab.kanji || vocab.kana}`}
            onClick={handleExpand}
            onKeyDown={stopCardKeyDown}
            tabIndex={isFlipped ? -1 : 0}
            data-testid={`vocabulary-expand-${vocab.id}`}
            className="absolute right-3 top-3 p-2 text-muted-foreground/45 transition-colors hover:text-foreground"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>

        <div
          className="absolute inset-0 flex h-full min-h-0 w-full rotate-y-180 flex-col items-center overflow-y-auto bg-card/20 px-5 py-6 text-center backface-hidden"
          aria-hidden={!isFlipped}
        >
          <div className="my-auto flex w-full flex-col items-center">
            <div className="text-2xl font-semibold text-accent">{vocab.meaning}</div>
            {showRomaji && <div className="font-scribble mt-1 text-lg text-muted-foreground">{vocab.romaji}</div>}
            {example && (
              <div className="ledger-row mt-4 w-full border-y border-border/40 px-2 py-3">
                <div className="line-clamp-2 text-sm leading-snug text-foreground/90">{example.japanese}</div>
                <div className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground">{example.meaning}</div>
              </div>
            )}

            <button
              type="button"
              onClick={handlePlay}
              onKeyDown={stopCardKeyDown}
              tabIndex={isFlipped ? 0 : -1}
              className="mt-3 inline-flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:text-accent"
              aria-label={`朗读 ${vocab.kana}`}
            >
              <Volume2 className="h-5 w-5" />
            </button>
          </div>

          <button
            type="button"
            aria-label={`放大查看 ${vocab.kanji || vocab.kana}`}
            onClick={handleExpand}
            onKeyDown={stopCardKeyDown}
            tabIndex={isFlipped ? 0 : -1}
            data-testid={`vocabulary-expand-back-${vocab.id}`}
            className="absolute right-3 top-3 p-2 text-muted-foreground/45 transition-colors hover:text-foreground"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
