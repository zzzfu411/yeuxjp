"use client"

import type { ReactNode } from "react"
import { Eye, EyeOff } from "lucide-react"
import { GlossaryButton, GlossaryTerm } from "@/components/ui/glossary"
import type { KanaSet } from "@/lib/kana-page-model"
import { cn } from "@/lib/utils"

export type KanaMode = "hiragana" | "katakana"

export interface KanaControlsProps {
  mode: KanaMode
  kanaSet: KanaSet
  showRomaji: boolean
  onlyUnmastered: boolean
  progress: {
    learned: number
    total: number
  }
  hint: ReactNode
  onModeChange: (mode: KanaMode) => void
  onKanaSetChange: (set: KanaSet) => void
  onToggleRomaji: () => void
  onToggleOnlyUnmastered: () => void
  onClearMastered: () => void
}

const kanaSets: { id: KanaSet; label: string }[] = [
  { id: "seion", label: "清音" },
  { id: "dakuon", label: "浊音/半浊音" },
  { id: "yoon", label: "拗音" },
  { id: "special", label: "促音(っ)" },
  { id: "all", label: "全部" },
]

export function KanaControls({
  mode,
  kanaSet,
  showRomaji,
  onlyUnmastered,
  progress,
  hint,
  onModeChange,
  onKanaSetChange,
  onToggleRomaji,
  onToggleOnlyUnmastered,
  onClearMastered,
}: KanaControlsProps) {
  return (
    <section className="mx-auto w-full max-w-4xl" aria-label="假名练习筛选">
      <div className="flex justify-center gap-7 border-b border-border/35">
        <button
          type="button"
          aria-pressed={mode === "hiragana"}
          data-testid="kana-mode-hiragana"
          onClick={() => onModeChange("hiragana")}
          className={cn(
            "relative border-b-2 border-transparent px-1 py-2 text-sm font-semibold transition-colors sm:px-3",
            mode === "hiragana"
              ? "border-accent text-accent"
              : "text-muted-foreground hover:border-border hover:text-foreground"
          )}
        >
          平假名 <span className="font-scribble ml-1 font-normal">Hiragana</span>
        </button>
        <button
          type="button"
          aria-pressed={mode === "katakana"}
          data-testid="kana-mode-katakana"
          onClick={() => onModeChange("katakana")}
          className={cn(
            "relative border-b-2 border-transparent px-1 py-2 text-sm font-semibold transition-colors sm:px-3",
            mode === "katakana"
              ? "border-accent text-accent"
              : "text-muted-foreground hover:border-border hover:text-foreground"
          )}
        >
          片假名 <span className="font-scribble ml-1 font-normal">Katakana</span>
        </button>
      </div>

      <div className="mt-5 flex flex-col items-center gap-4">
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
          {kanaSets.map((set) => (
            <button
              key={set.id}
              type="button"
              aria-pressed={kanaSet === set.id}
              data-testid={`kana-set-${set.id}`}
              onClick={() => onKanaSetChange(set.id)}
              className={cn(
                "border-b px-0.5 py-1 text-sm font-semibold transition-colors",
                kanaSet === set.id
                  ? "border-accent text-accent"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
              )}
            >
              {set.label}
            </button>
          ))}
        </div>

        <div className="max-w-2xl text-center text-xs leading-relaxed text-muted-foreground">
          {hint} <GlossaryButton className="ml-2 h-auto border-0 bg-transparent px-1 py-0 text-xs shadow-none">术语笺</GlossaryButton>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-y border-border/35 px-3 py-3">
          <button
            type="button"
            aria-pressed={showRomaji}
            data-testid="kana-romaji-toggle"
            onClick={onToggleRomaji}
            className={cn(
              "inline-flex items-center gap-2 border-b border-transparent px-0.5 py-1 text-sm font-semibold text-muted-foreground transition-colors hover:border-border hover:text-foreground",
              showRomaji && "text-foreground"
            )}
          >
            {showRomaji ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showRomaji ? "隐藏罗马音" : "显示罗马音"}
          </button>

          <button
            type="button"
            aria-pressed={onlyUnmastered}
            data-testid="kana-only-unmastered-toggle"
            onClick={onToggleOnlyUnmastered}
            className={cn(
              "inline-flex items-center gap-2 border-b border-transparent px-0.5 py-1 text-sm font-semibold text-muted-foreground transition-colors hover:border-border hover:text-foreground",
              onlyUnmastered && "border-accent text-accent"
            )}
          >
            {onlyUnmastered ? "显示全部" : "只看未掌握"}
          </button>

          <button
            type="button"
            onClick={onClearMastered}
            data-testid="kana-clear-progress"
            className={cn(
              "inline-flex items-center gap-2 border-b border-transparent px-0.5 py-1 text-sm font-semibold",
              "text-muted-foreground hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
            )}
          >
            清空进度
          </button>
        </div>

        <div className="font-scribble text-sm text-muted-foreground">
          进度：{progress.learned}/{progress.total}
        </div>

        {showRomaji && (
          <div className="max-w-2xl text-center text-xs text-muted-foreground">
            小提示：熟悉后可隐藏 <GlossaryTerm termId="romaji">罗马音</GlossaryTerm>，训练直接读{" "}
            <GlossaryTerm termId="kana">假名</GlossaryTerm>。
          </div>
        )}
      </div>
    </section>
  )
}
