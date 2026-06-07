"use client"

import { cn } from "@/lib/utils"
import type { KanaQuizScope, QuizMode, VocabQuizScope } from "@/lib/quiz-generators"

function scopeButtonClassName(active: boolean) {
  return cn(
    "px-4 py-2 rounded-md text-sm font-medium transition-all",
    active
      ? "bg-background text-foreground shadow-sm"
      : "text-muted-foreground hover:text-foreground"
  )
}

function filterButtonClassName(active: boolean) {
  return cn(
    "px-4 py-2 rounded-full border transition-colors bg-background hover:bg-secondary/60 text-sm",
    active && "border-primary/40 bg-primary/5"
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
        <div className="flex p-1 bg-secondary rounded-lg">
          <button
            onClick={() => onKanaScopeChange("seion")}
            className={cn(scopeButtonClassName(kanaScope === "seion"), "px-5")}
          >
            清音
          </button>
          <button
            onClick={() => onKanaScopeChange("all")}
            className={cn(scopeButtonClassName(kanaScope === "all"), "px-5")}
          >
            全部
          </button>
        </div>

        <button
          onClick={() => onOnlyUnmasteredKanaChange(!onlyUnmasteredKana)}
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
        <div className="flex flex-wrap p-1 bg-secondary rounded-lg">
          {[
            ["survival", "生存"],
            ["daily", "日常"],
            ["fluent", "流利"],
            ["all", "全部"],
          ].map(([scope, label]) => (
            <button
              key={scope}
              onClick={() => onVocabScopeChange(scope as VocabQuizScope)}
              className={scopeButtonClassName(vocabScope === scope)}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={() => onOnlyUnlearnedVocabChange(!onlyUnlearnedVocab)}
          className={filterButtonClassName(onlyUnlearnedVocab)}
        >
          {onlyUnlearnedVocab ? "只出未掌握" : "全部出题"}
        </button>
      </div>
    )
  }

  return null
}
