"use client"

import { Kana } from "@/data/kana-data"
import { cn } from "@/lib/utils"
import { CheckCircle2, PenTool, Volume2 } from "lucide-react"

interface KanaCardProps {
  kana: Kana
  mode: "hiragana" | "katakana"
  onClick?: () => void
  hasStrokes?: boolean
  showRomaji?: boolean
  mastered?: boolean
}

export function KanaCard({
  kana,
  mode,
  onClick,
  hasStrokes: propHasStrokes,
  showRomaji = true,
  mastered = false,
}: KanaCardProps) {
  const mainChar = mode === "hiragana" ? kana.hiragana : kana.katakana
  const subChar = mode === "hiragana" ? kana.katakana : kana.hiragana

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`打开 ${mainChar}（${kana.romaji}）的详情`}
      data-testid={`kana-card-${kana.romaji}`}
      className={cn(
        "paper-slip kana-tile group relative flex aspect-square cursor-pointer select-none flex-col items-center justify-center p-2 sm:p-4",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        mastered && "bg-accent/[0.08] ring-1 ring-accent/35"
      )}
    >
      <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
        <Volume2 className="h-3 w-3 text-muted-foreground sm:h-4 sm:w-4" />
      </div>
      
      {propHasStrokes && (
        <div className="absolute bottom-1.5 right-2 opacity-30 transition-opacity group-hover:opacity-100" title="笔顺可用">
          <PenTool className="h-3 w-3 text-accent" />
        </div>
      )}

      {mastered && (
        <div className="absolute bottom-1.5 left-2 opacity-70" title="已掌握">
          <CheckCircle2 className="h-3 w-3 text-accent" />
        </div>
      )}
      
      <div
        lang="ja"
        className={cn(
          "font-jp mb-1 text-center font-semibold leading-none text-foreground",
          mainChar.length > 1 ? "text-xl sm:text-2xl" : "text-3xl sm:text-4xl"
        )}
      >
        {mainChar}
      </div>
      {showRomaji && <div className="font-scribble text-sm text-muted-foreground sm:text-base">{kana.romaji}</div>}

      {/* Sub-char watermark — only useful for single-char rows; combo kana
          (yoon like きゃ) would overflow the corner, so we hide it there. */}
      {mainChar.length === 1 && (
        <div lang="ja" aria-hidden="true" className="font-jp absolute left-2 top-2 select-none text-[10px] text-muted-foreground/30 sm:left-3 sm:text-xs">
          {subChar}
        </div>
      )}
    </button>
  )
}
