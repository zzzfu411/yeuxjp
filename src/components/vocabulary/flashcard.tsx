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
}

export function Flashcard({ vocab, onExpand, learned = false }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  const handlePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    speakJapanese(vocab.kana)
  }

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation()
    onExpand?.()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault()
      setIsFlipped((prev) => !prev)
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className="group relative w-full h-64 sm:h-80 perspective-1000 cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xl"
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
        <div className="absolute w-full h-full backface-hidden bg-card border rounded-xl shadow-sm flex flex-col items-center justify-center p-6 text-center hover:shadow-md transition-all">
          <div className="text-3xl sm:text-4xl font-bold mb-4 text-foreground">{vocab.kanji || vocab.kana}</div>
          {vocab.kanji && <div className="text-lg text-muted-foreground">{vocab.kana}</div>}
          
          <div className="absolute bottom-3 right-3 text-muted-foreground/30">
            <RotateCw className="w-4 h-4" />
          </div>
          
          <button
            type="button"
            aria-label={`放大查看 ${vocab.kanji || vocab.kana}`}
            onClick={handleExpand}
            data-testid={`vocabulary-expand-${vocab.id}`}
            className="absolute top-3 right-3 p-2 text-muted-foreground/30 hover:text-primary transition-colors hover:bg-muted rounded-full"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Back */}
        <div className="absolute w-full h-full backface-hidden bg-card border-2 border-primary/20 rounded-xl shadow-sm rotate-y-180 flex flex-col items-center justify-center p-6 text-center">
          <div className="text-2xl font-bold text-primary mb-2">{vocab.meaning}</div>
          <div className="text-lg text-muted-foreground font-medium mb-6">{vocab.romaji}</div>
          
          <div className="flex gap-4">
            <Button size="icon" variant="ghost" onClick={handlePlay} className="rounded-full">
              <Volume2 className="w-6 h-6 text-primary" />
            </Button>
          </div>

          <button
            type="button"
            aria-label={`放大查看 ${vocab.kanji || vocab.kana}`}
            onClick={handleExpand}
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
