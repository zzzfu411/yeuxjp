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
  
  const hasStrokes = propHasStrokes ?? (!!kana.strokes && mode === "hiragana");

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`打开 ${mainChar}（${kana.romaji}）的详情`}
      className={cn(
        "group relative flex flex-col items-center justify-center p-2 sm:p-4 aspect-square",
        "bg-card border rounded-xl shadow-sm cursor-pointer select-none",
        "transition-all duration-200 hover:shadow-md hover:-translate-y-1 hover:border-primary/50",
        "active:scale-95 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        mastered && "border-primary/30 bg-primary/5"
      )}
    >
      <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
        <Volume2 className="w-3 h-3 sm:w-4 sm:h-4 text-primary/60" />
      </div>
      
      {hasStrokes && (
        <div className="absolute bottom-1.5 right-2 opacity-30 group-hover:opacity-100 transition-opacity" title="Writing Practice Available">
          <PenTool className="w-3 h-3 text-primary" />
        </div>
      )}

      {mastered && (
        <div className="absolute bottom-1.5 left-2 opacity-70" title="Mastered">
          <CheckCircle2 className="w-3 h-3 text-primary" />
        </div>
      )}
      
      <div
        className={cn(
          "font-bold text-foreground mb-1 leading-none text-center",
          mainChar.length > 1 ? "text-xl sm:text-2xl tracking-tight" : "text-3xl sm:text-4xl"
        )}
      >
        {mainChar}
      </div>
      {showRomaji && <div className="text-xs sm:text-sm text-muted-foreground font-medium">{kana.romaji}</div>}

      {/* Sub-char watermark — only useful for single-char rows; combo kana
          (yoon like きゃ) would overflow the corner, so we hide it there. */}
      {mainChar.length === 1 && (
        <div className="absolute top-2 left-2 sm:left-3 text-[10px] sm:text-xs text-muted-foreground/30 font-serif select-none">
          {subChar}
        </div>
      )}
    </button>
  )
}
