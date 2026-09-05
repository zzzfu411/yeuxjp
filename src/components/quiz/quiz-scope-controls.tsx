"use client"

import { cn } from "@/lib/utils"
import type { KanaQuizScope, QuizMode, VocabQuizScope } from "@/lib/quiz-generators"

function scopeButtonClassName(active: boolean) {
  return cn(
    "relative min-h-10 border-0 border-b border-dashed px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    active
      ? "border-accent bg-primary/10 text-foreground"
      : "border-border/50 bg-transparent text-muted-foreground hover:border-foreground/40 hover:bg-primary/5 hover:text-foreground"
  )
}

function filterButtonClassName(active: boolean) {
  return cn(
    "min-h-10 border border-dashed border-border/60 bg-transparent px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-primary/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    active && "border-accent/70 bg-accent/10 text-accent"
  )
}

export function QuizScopeControls({
  mode,
  kanaScope,
  onKanaScopeChange,
  onlyUnmasteredKana,
  onOnlyUnmasteredKanaChange,
  vocabScope,
  onVocabScopeChange,
  vocabScopeDisabled = false,
  onlyUnlearnedVocab,
  onOnlyUnlearnedVocabChange,
}: {
  mode: QuizMode
  kanaScope: KanaQuizScope
  onKanaScopeChange: (scope: KanaQuizScope) => void
  onlyUnmasteredKana: boolean
  onOnlyUnmasteredKanaChange: (value: boolean) => void
  vocabScope: VocabQuizScope
  onVocabScopeChange: (scope: VocabQuizScope) => void
  vocabScopeDisabled?: boolean
  onlyUnlearnedVocab: boolean
  onOnlyUnlearnedVocabChange: (value: boolean) => void
}) {
  if (mode === "hiragana-romaji" || mode === "audio-kana") {
    return (
      <div className="flex w-full flex-wrap items-center justify-center gap-3 border-y border-dashed border-border/50 py-3">
        <div className="flex gap-1">
          <button
            type="button"
            aria-pressed={kanaScope === "seion"}
            onClick={() => onKanaScopeChange("seion")}
            data-testid="quiz-kana-scope-seion"
            className={cn(scopeButtonClassName(kanaScope === "seion"), "px-5")}
          >
            清音
          </button>
          <button
            type="button"
            aria-pressed={kanaScope === "all"}
            onClick={() => onKanaScopeChange("all")}
            data-testid="quiz-kana-scope-all"
            className={cn(scopeButtonClassName(kanaScope === "all"), "px-5")}
          >
            全部
          </button>
        </div>

        <button
          type="button"
          aria-pressed={onlyUnmasteredKana}
          onClick={() => onOnlyUnmasteredKanaChange(!onlyUnmasteredKana)}
          data-testid="quiz-only-unmastered-kana"
          className={filterButtonClassName(onlyUnmasteredKana)}
        >
          {onlyUnmasteredKana ? "只出未掌握" : "全部出题"}
        </button>
      </div>
    )
  }

  if (mode === "meaning-vocab") {
    return (
      <div className="flex w-full flex-wrap items-center justify-center gap-3 border-y border-dashed border-border/50 py-3">
        <div className="flex flex-wrap gap-1">
          {[
            ["survival", "入门"],
            ["daily", "日常"],
            ["fluent", "进阶"],
            ["all", "全部"],
          ].map(([scope, label]) => (
            <button
              key={scope}
              type="button"
              aria-pressed={vocabScope === scope}
              disabled={vocabScopeDisabled}
              onClick={() => onVocabScopeChange(scope as VocabQuizScope)}
              data-testid={`quiz-vocab-scope-${scope}`}
              className={cn(scopeButtonClassName(vocabScope === scope), vocabScopeDisabled && "cursor-not-allowed opacity-50")}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          aria-pressed={onlyUnlearnedVocab}
          onClick={() => onOnlyUnlearnedVocabChange(!onlyUnlearnedVocab)}
          data-testid="quiz-only-unlearned-vocab"
          className={filterButtonClassName(onlyUnlearnedVocab)}
        >
          {onlyUnlearnedVocab ? "只出未掌握" : "全部出题"}
        </button>
      </div>
    )
  }

  return null
}
