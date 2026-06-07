"use client"

import { useEffect, useState } from "react"
import { loadVocabularyScope } from "@/data/vocabulary/loader"
import type { Vocabulary } from "@/data/vocabulary/types"

export function useAllVocabulary(enabled: boolean) {
  const [state, setState] = useState<{ data: Vocabulary[]; loaded: boolean; error: string | null }>({
    data: [],
    loaded: false,
    error: null,
  })

  useEffect(() => {
    if (!enabled) return

    let cancelled = false

    loadVocabularyScope("all")
      .then((data) => {
        if (cancelled) return
        setState({ data, loaded: true, error: null })
      })
      .catch((err) => {
        if (cancelled) return
        setState({ data: [], loaded: true, error: err instanceof Error ? err.message : String(err) })
      })

    return () => {
      cancelled = true
    }
  }, [enabled])

  return {
    data: enabled ? state.data : [],
    loading: enabled && !state.loaded && !state.error,
    error: enabled ? state.error : null,
  }
}
