"use client"

import { useState } from "react"
import { Vocabulary } from "@/data/vocabulary/types"
import { cn } from "@/lib/utils"
import { CheckCircle2, Volume2, RotateCw, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { speakJapanese } from "@/lib/speech"

interface FlashcardProps {
  vocab: Vocabulary
  onExpand?: () => void
  learned?: boolean
  showRomaji?: boolean
}

export function Flashcard({ vocab, onExpand, learned = false, showRomaji = true }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const example = vocab.exampleSentences?.[0]

  const handlePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    speakJapanese(vocab.kana)
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
      className="group relative w-full h-64 sm:h-80 perspective-1000 cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
      onClick={() => setIsFlipped(!isFlipped)}
      onKeyDown={handleKeyDown}
      aria-pressed={isFlipped}
      aria-label={`${vocab.kanji || vocab.kana}，${isFlipped ? `释义：${vocab.meaning}` : "点击翻面查看释义"}`}
    >
      {learned && (
        <div className="absolute bottom-2 left-2 z-10 opacity-70" title="已掌握">
          <CheckCircle2 className="w-4 h-4 text-primary" />
        </div>
      )}
      <div className={cn(
        "relative w-full h-full transition-all duration-500 transform preserve-3d",
        isFlipped ? "rotate-y-180" : ""
      )}>
        {/* Front */}
        <div
          className="absolute w-full h-full backface-hidden hard-panel flex flex-col items-center justify-center p-6 text-center"
          aria-hidden={isFlipped}
        >
          <div className="font-jp text-3xl sm:text-4xl font-bold mb-4 text-foreground">{vocab.kanji || vocab.kana}</div>
          {vocab.kanji && <div className="text-lg text-muted-foreground">{vocab.kana}</div>}
          
          <div className="absolute bottom-3 right-3 text-muted-foreground/30">
            <RotateCw className="w-4 h-4" />
          </div>
          
          <button
            type="button"
            aria-label={`放大查看 ${vocab.kanji || vocab.kana}`}
            onClick={handleExpand}
            onKeyDown={stopCardKeyDown}
            tabIndex={isFlipped ? -1 : 0}
            data-testid={`vocabulary-expand-${vocab.id}`}
            className="absolute top-3 right-3 p-2 text-muted-foreground/30 hover:text-primary transition-colors hover:bg-muted rounded-full"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Back */}
        <div
          className="absolute w-full h-full backface-hidden hard-panel rotate-y-180 flex flex-col items-center justify-center p-6 text-center"
          aria-hidden={!isFlipped}
        >
          <div className="text-2xl font-bold text-primary mb-2">{vocab.meaning}</div>
          {showRomaji && <div className="text-lg text-muted-foreground font-medium mb-2">{vocab.romaji}</div>}
          {example && (
            <div className="mb-3 px-2 space-y-0.5">
              <div className="text-sm text-foreground/90 leading-snug">{example.japanese}</div>
              <div className="text-xs text-muted-foreground leading-snug">{example.meaning}</div>
            </div>
          )}

          <div className="flex gap-4">
            <Button
              size="icon"
              variant="ghost"
              onClick={handlePlay}
              onKeyDown={stopCardKeyDown}
              tabIndex={isFlipped ? 0 : -1}
              className="rounded-full"
              aria-label={`朗读 ${vocab.kana}`}
            >
              <Volume2 className="w-6 h-6 text-primary" />
            </Button>
          </div>

          <button
            type="button"
            aria-label={`放大查看 ${vocab.kanji || vocab.kana}`}
            onClick={handleExpand}
            onKeyDown={stopCardKeyDown}
            tabIndex={isFlipped ? 0 : -1}
            data-testid={`vocabulary-expand-back-${vocab.id}`}
            className="absolute top-3 right-3 p-2 text-muted-foreground/30 hover:text-primary transition-colors hover:bg-muted rounded-full"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
