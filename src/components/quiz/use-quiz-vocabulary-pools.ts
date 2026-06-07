"use client"

import { useEffect, useMemo, useState } from "react"
import { loadVocabularyScope } from "@/data/vocabulary/loader"
import type { Vocabulary } from "@/data/vocabulary/types"
import type { QuizMode, VocabQuizScope } from "@/lib/quiz-generators"

type QuizVocabularyPoolState = {
  scope: VocabQuizScope | null
  base: Vocabulary[]
  fallback: Vocabulary[]
  error: string | null
}

export function useQuizVocabularyPools({
  mode,
  vocabScope,
}: {
  mode: QuizMode
  vocabScope: VocabQuizScope
}) {
  const [state, setState] = useState<QuizVocabularyPoolState>({
    scope: null,
    base: [],
    fallback: [],
    error: null,
  })

  useEffect(() => {
    if (mode !== "meaning-vocab") return
    let cancelled = false

    ;(async () => {
      const base = await loadVocabularyScope(vocabScope)
      const fallback = base.length >= 4 ? base : await loadVocabularyScope("all")
      if (cancelled) return
      setState({
        scope: vocabScope,
        base,
        fallback,
        error: null,
      })
    })().catch(() => {
      if (cancelled) return
      setState({
        scope: vocabScope,
        base: [],
        fallback: [],
        error: "Failed to load vocabulary",
      })
    })

    return () => {
      cancelled = true
    }
  }, [mode, vocabScope])

  const loading = mode === "meaning-vocab" && state.scope !== vocabScope

  const basePool = useMemo(() => {
    return mode === "meaning-vocab" && !loading ? state.base : []
  }, [loading, mode, state.base])

  const fallbackPool = useMemo(() => {
    return mode === "meaning-vocab" && !loading ? state.fallback : []
  }, [loading, mode, state.fallback])

  return {
    loading,
    basePool,
    fallbackPool,
    error: mode === "meaning-vocab" ? state.error : null,
  }
}
