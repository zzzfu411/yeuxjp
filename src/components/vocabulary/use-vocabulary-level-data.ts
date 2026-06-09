"use client"

import { useCallback, useEffect, useState } from "react"
import { loadVocabularyLevel } from "@/data/vocabulary/loader"
import type { VocabLevel, Vocabulary } from "@/data/vocabulary/types"

const EMPTY_VOCAB: Vocabulary[] = []

interface VocabularyLevelDataState {
  level: VocabLevel | null
  data: Vocabulary[]
  error: string | null
}

export function useVocabularyLevelData(level: VocabLevel) {
  const [reloadToken, setReloadToken] = useState(0)
  const [state, setState] = useState<VocabularyLevelDataState>({
    level: null,
    data: [],
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    loadVocabularyLevel(level)
      .then((data) => {
        if (cancelled) return
        setState({ level, data, error: null })
      })
      .catch((err) => {
        if (cancelled) return
        setState({
          level,
          data: [],
          error: err instanceof Error ? err.message : String(err),
        })
      })

    return () => {
      cancelled = true
    }
  }, [level, reloadToken])

  const loading = state.level !== level
  const retry = useCallback(() => {
    setState((prev) => ({
      level: prev.level === level ? null : prev.level,
      data: prev.level === level ? [] : prev.data,
      error: null,
    }))
    setReloadToken((value) => value + 1)
  }, [level])

  return {
    data: loading ? EMPTY_VOCAB : state.data,
    loading,
    error: loading ? null : state.error,
    retry,
  }
}
