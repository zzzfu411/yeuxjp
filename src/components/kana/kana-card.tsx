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
        "group relative flex flex-col items-center justify-center p-2 sm:p-4 aspect-square",
        "bg-card border-[3px] border-foreground shadow-hard-sm cursor-pointer select-none",
        "transition-transform hover:-translate-x-px hover:-translate-y-px",
        "active:translate-x-0 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        mastered && "bg-primary/40"
      )}
    >
      <div className="absolute top-2 right-2 opacity-60 transition-opacity group-hover:opacity-100">
        <Volume2 className="w-3 h-3 sm:w-4 sm:h-4 text-foreground" />
      </div>
      
      {propHasStrokes && (
        <div className="absolute bottom-1.5 right-2 opacity-30 group-hover:opacity-100 transition-opacity" title="笔顺可用">
          <PenTool className="w-3 h-3 text-foreground" />
        </div>
      )}

      {mastered && (
        <div className="absolute bottom-1.5 left-2 opacity-70" title="已掌握">
          <CheckCircle2 className="w-3 h-3 text-foreground" />
        </div>
      )}
      
      <div
        className={cn(
          "font-jp font-bold text-foreground mb-1 leading-none text-center",
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
