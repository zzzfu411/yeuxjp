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
    <section className="kana-controls mx-auto w-full max-w-3xl" aria-label="假名练习筛选">
      <div className="flex justify-center gap-7 border-b border-border/35">
        <button
          type="button"
          aria-pressed={mode === "hiragana"}
          data-testid="kana-mode-hiragana"
          onClick={() => onModeChange("hiragana")}
          className={cn(
            "level-tab relative px-2 py-2 text-sm font-semibold transition-colors sm:px-4",
            mode === "hiragana"
              ? "is-selected text-foreground"
              : "text-muted-foreground hover:text-foreground"
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
            "level-tab relative px-2 py-2 text-sm font-semibold transition-colors sm:px-4",
            mode === "katakana"
              ? "is-selected text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          片假名 <span className="font-scribble ml-1 font-normal">Katakana</span>
        </button>
      </div>

      <div className="mt-4 flex flex-col items-center gap-3">
        <div className="flex flex-wrap justify-center gap-2">
          {kanaSets.map((set) => (
            <button
              key={set.id}
              type="button"
              aria-pressed={kanaSet === set.id}
              data-testid={`kana-set-${set.id}`}
              onClick={() => onKanaSetChange(set.id)}
              className={cn(
                "filter-chip px-2.5 py-1.5 text-sm font-semibold transition-colors",
                kanaSet === set.id
                  ? "is-selected text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {set.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            aria-pressed={showRomaji}
            data-testid="kana-romaji-toggle"
            onClick={onToggleRomaji}
            className={cn(
              "filter-chip inline-flex items-center gap-2 px-2.5 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground",
              showRomaji && "is-selected text-foreground"
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
              "filter-chip inline-flex items-center gap-2 px-2.5 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground",
              onlyUnmastered && "is-selected text-foreground"
            )}
          >
            {onlyUnmastered ? "显示全部" : "只看未掌握"}
          </button>

          <button
            type="button"
            onClick={onClearMastered}
            data-testid="kana-clear-progress"
            className={cn(
              "filter-chip inline-flex items-center gap-2 px-2.5 py-1.5 text-sm font-semibold",
              "text-muted-foreground hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
            )}
          >
            清空进度
          </button>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-2 flex justify-between text-xs text-muted-foreground">
            <span>掌握进度</span><span>{progress.learned}/{progress.total}</span>
          </div>
          <div className="grid grid-cols-10 gap-1" aria-hidden="true">
            {Array.from({ length: 10 }, (_, index) => (
              <span key={index} className={index < Math.ceil((progress.learned / Math.max(progress.total, 1)) * 10) ? "h-1 bg-accent" : "h-1 bg-muted"} />
            ))}
          </div>
        </div>

        <details className="w-full text-xs text-muted-foreground">
          <summary className="cursor-pointer py-2 text-center">读音提示与术语</summary>
          <div className="mx-auto max-w-2xl pb-2 leading-7">
            {hint} <GlossaryButton className="ml-2 h-auto border-0 bg-transparent px-1 py-0 text-xs shadow-none">术语表</GlossaryButton>
          {showRomaji && <p>
            小提示：熟悉后可隐藏 <GlossaryTerm termId="romaji">罗马音</GlossaryTerm>，训练直接读{" "}
            <GlossaryTerm termId="kana">假名</GlossaryTerm>。
          </p>}
          </div>
        </details>
      </div>
    </section>
  )
}
