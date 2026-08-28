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
    <>
      <div className="flex">
        <button
          type="button"
          aria-pressed={mode === "hiragana"}
          data-testid="kana-mode-hiragana"
          onClick={() => onModeChange("hiragana")}
          className={cn(
            "border-[3px] border-foreground px-4 py-2 text-sm font-extrabold sm:px-8",
            mode === "hiragana"
              ? "bg-foreground text-background dark:bg-primary dark:text-primary-foreground"
              : "bg-card hover:bg-primary"
          )}
        >
          平假名 (Hiragana)
        </button>
        <button
          type="button"
          aria-pressed={mode === "katakana"}
          data-testid="kana-mode-katakana"
          onClick={() => onModeChange("katakana")}
          className={cn(
            "-ml-[3px] border-[3px] border-foreground px-4 py-2 text-sm font-extrabold sm:px-8",
            mode === "katakana"
              ? "z-[1] bg-foreground text-background dark:bg-primary dark:text-primary-foreground"
              : "bg-card hover:bg-primary"
          )}
        >
          片假名 (Katakana)
        </button>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="flex flex-wrap justify-center">
          {kanaSets.map((set, index) => (
            <button
              key={set.id}
              type="button"
              aria-pressed={kanaSet === set.id}
              data-testid={`kana-set-${set.id}`}
              onClick={() => onKanaSetChange(set.id)}
              className={cn(
                "border-[3px] border-foreground px-3 py-2 text-sm font-extrabold sm:px-5",
                index > 0 && "-ml-[3px]",
                kanaSet === set.id
                  ? "z-[1] bg-foreground text-background dark:bg-primary dark:text-primary-foreground"
                  : "bg-card hover:bg-primary"
              )}
            >
              {set.label}
            </button>
          ))}
        </div>

        <div className="max-w-2xl text-center text-xs leading-relaxed text-muted-foreground">
          {hint} <GlossaryButton className="ml-2 h-auto rounded-md px-2 py-1">术语表</GlossaryButton>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            aria-pressed={showRomaji}
            data-testid="kana-romaji-toggle"
            onClick={onToggleRomaji}
            className={cn(
              "inline-flex items-center gap-2 border-[3px] border-foreground px-4 py-2 text-sm font-extrabold shadow-hard-sm transition-transform hover:-translate-x-px hover:-translate-y-px",
              "bg-card hover:bg-primary"
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
              "inline-flex items-center gap-2 border-[3px] border-foreground px-4 py-2 text-sm font-extrabold shadow-hard-sm transition-transform hover:-translate-x-px hover:-translate-y-px",
              "bg-card hover:bg-primary"
            )}
          >
            {onlyUnmastered ? "显示全部" : "只看未掌握"}
          </button>

          <button
            type="button"
            onClick={onClearMastered}
            data-testid="kana-clear-progress"
            className={cn(
              "inline-flex items-center gap-2 border-[3px] border-foreground px-4 py-2 text-sm font-extrabold shadow-hard-sm transition-transform hover:-translate-x-px hover:-translate-y-px",
              "bg-card text-muted-foreground hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
            )}
          >
            清空进度
          </button>
        </div>

        <div className="font-mono text-xs text-muted-foreground">
          进度：{progress.learned}/{progress.total}
        </div>

        {showRomaji && (
          <div className="max-w-2xl text-center text-xs text-muted-foreground">
            小提示：熟悉后可隐藏 <GlossaryTerm termId="romaji">罗马音</GlossaryTerm>，训练直接读{" "}
            <GlossaryTerm termId="kana">假名</GlossaryTerm>。
          </div>
        )}
      </div>
    </>
  )
}
