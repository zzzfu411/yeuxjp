"use client"

import { cn } from "@/lib/utils"
import type { KanaQuizScope, QuizMode, VocabQuizScope } from "@/lib/quiz-generators"

function scopeButtonClassName(active: boolean) {
  return cn(
    "border-[3px] border-foreground px-4 py-2 text-sm font-extrabold",
    active
      ? "z-[1] bg-foreground text-background dark:bg-primary dark:text-primary-foreground"
      : "bg-card hover:bg-primary"
  )
}

function filterButtonClassName(active: boolean) {
  return cn(
    "hard-chip px-4 py-2 text-sm hover:bg-primary",
    active && "bg-primary"
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
  onlyUnlearnedVocab: boolean
  onOnlyUnlearnedVocabChange: (value: boolean) => void
}) {
  if (mode === "hiragana-romaji" || mode === "audio-kana") {
    return (
      <div className="w-full flex flex-wrap items-center justify-center gap-2">
        <div className="flex">
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
            className={cn(scopeButtonClassName(kanaScope === "all"), "-ml-[3px] px-5")}
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
      <div className="w-full flex flex-wrap items-center justify-center gap-2">
        <div className="flex flex-wrap">
          {[
            ["survival", "生存"],
            ["daily", "日常"],
            ["fluent", "流利"],
            ["all", "全部"],
          ].map(([scope, label]) => (
            <button
              key={scope}
              type="button"
              aria-pressed={vocabScope === scope}
              onClick={() => onVocabScopeChange(scope as VocabQuizScope)}
              data-testid={`quiz-vocab-scope-${scope}`}
              className={cn(scopeButtonClassName(vocabScope === scope), scope !== "survival" && "-ml-[3px]")}
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
