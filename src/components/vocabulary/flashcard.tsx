"use client"
import { useEffect, useRef, useState } from "react"
import type { Vocabulary } from "@/data/vocabulary/types"
import { cn } from "@/lib/utils"
import { CheckCircle2, Volume2, RotateCw, Maximize2 } from "lucide-react"
import { cancelJapaneseSpeech, speakJapanese } from "@/lib/speech"
interface FlashcardProps { vocab: Vocabulary; onExpand?: () => void; learned?: boolean; showRomaji?: boolean }

export function Flashcard({ vocab, onExpand, learned = false, showRomaji = true }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const example = vocab.exampleSentences?.[0]
  useEffect(() => () => {
    const utterance = utteranceRef.current
    utteranceRef.current = null
    if (utterance) cancelJapaneseSpeech(utterance)
  }, [vocab.id])
  return <article className="group paper-slip vocab-flashcard relative h-64 w-full text-left perspective-1000 sm:h-72">
    <span className="paper-tape" aria-hidden="true" />
    {learned && <span className="seal-stamp pointer-events-none absolute bottom-3 left-3 z-20 gap-1 text-xs" title="已掌握"><CheckCircle2 className="h-3 w-3" />熟</span>}
    <div className={cn("relative h-full w-full transform preserve-3d transition-all duration-500", isFlipped && "rotate-y-180")}>
      <div className="absolute inset-0 flex h-full w-full flex-col items-center justify-center bg-card/20 p-6 text-center backface-hidden" aria-hidden={isFlipped}>
        <span lang="ja" className="font-scribble absolute left-4 top-4 text-sm text-muted-foreground">ことば</span>
        <div lang="ja" className="font-jp text-4xl font-medium text-foreground sm:text-5xl">{vocab.kanji || vocab.kana}</div>
        {vocab.kanji && <div lang="ja" className="mt-3 text-lg text-muted-foreground">{vocab.kana}</div>}
      </div>
      <div className="absolute inset-0 flex h-full min-h-0 w-full rotate-y-180 flex-col items-center overflow-y-auto bg-card/20 px-5 py-12 text-center backface-hidden" aria-hidden={!isFlipped}>
        <div className="text-2xl font-semibold text-accent">{vocab.meaning}</div>
        {showRomaji && <div className="font-scribble mt-1 text-lg text-muted-foreground">{vocab.romaji}</div>}
        {example && <div className="ledger-row mt-3 w-full border-y border-border/40 px-2 py-2">
          <p lang="ja" className="line-clamp-2 text-sm leading-snug text-foreground/90">{example.japanese}</p>
          <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground">{example.meaning}</p>
        </div>}
      </div>
    </div>
    <button type="button" className={cn("absolute z-10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent", isFlipped ? "bottom-0 right-0 h-11 w-20" : "inset-0")}
      aria-pressed={isFlipped} aria-label={`${vocab.kanji || vocab.kana}，${isFlipped ? `释义：${vocab.meaning}，点击返回正面` : "点击翻面查看释义"}`}
      onClick={() => setIsFlipped(value => !value)}>
      <span className="absolute bottom-3 right-4 flex items-center gap-1 text-sm text-muted-foreground"><RotateCw className="h-3 w-3" aria-hidden="true" />翻面</span>
    </button>
    <button type="button" hidden={isFlipped} style={{ display: isFlipped ? "none" : undefined }} tabIndex={isFlipped ? -1 : 0} aria-label={`放大查看 ${vocab.kanji || vocab.kana}`} onClick={onExpand}
      data-testid={`vocabulary-expand-${vocab.id}`} className="absolute right-2 top-2 z-20 flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-foreground">
      <Maximize2 className="h-4 w-4" />
    </button>
    <button type="button" hidden={!isFlipped} style={{ display: !isFlipped ? "none" : undefined }} tabIndex={isFlipped ? 0 : -1} aria-label={`放大查看 ${vocab.kanji || vocab.kana}`} onClick={onExpand}
      data-testid={`vocabulary-expand-back-${vocab.id}`} className="absolute right-2 top-2 z-20 flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-foreground">
      <Maximize2 className="h-4 w-4" />
    </button>
    <button type="button" onClick={() => { utteranceRef.current = speakJapanese(vocab.kana) }} aria-label={`朗读 ${vocab.kana}`}
      className="absolute bottom-2 left-1/2 z-20 flex h-11 w-11 -translate-x-1/2 items-center justify-center text-muted-foreground hover:text-accent">
      <Volume2 className="h-5 w-5" />
    </button>
  </article>
}
