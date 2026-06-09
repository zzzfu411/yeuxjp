"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { loadVocabularyScope } from "@/data/vocabulary/loader"
import type { Vocabulary } from "@/data/vocabulary/types"
import type { QuizMode, VocabQuizScope } from "@/lib/quiz-generators"

type QuizVocabularyPoolState = {
  scope: VocabQuizScope | null
  base: Vocabulary[]
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
    error: null,
  })
  const [retryToken, setRetryToken] = useState(0)

  const retry = useCallback(() => {
    if (mode !== "meaning-vocab") return
    setState({
      scope: null,
      base: [],
      error: null,
    })
    setRetryToken((value) => value + 1)
  }, [mode])

  useEffect(() => {
    if (mode !== "meaning-vocab") return
    let cancelled = false

    ;(async () => {
      const base = await loadVocabularyScope(vocabScope)
      if (cancelled) return
      setState({
        scope: vocabScope,
        base,
        error: null,
      })
    })().catch(() => {
      if (cancelled) return
      setState({
        scope: vocabScope,
        base: [],
        error: "Failed to load vocabulary",
      })
    })

    return () => {
      cancelled = true
    }
  }, [mode, retryToken, vocabScope])

  const loading = mode === "meaning-vocab" && state.scope !== vocabScope

  const basePool = useMemo(() => {
    return mode === "meaning-vocab" && !loading ? state.base : []
  }, [loading, mode, state.base])

  return {
    loading,
    basePool,
    error: mode === "meaning-vocab" ? state.error : null,
    retry,
  }
}
