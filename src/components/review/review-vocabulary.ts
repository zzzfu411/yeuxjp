"use client"

import { useEffect, useState } from "react"
import { loadVocabularyForIds, loadVocabularyScope } from "@/data/vocabulary/loader"
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

export function useVocabularyForReviewIds(ids: readonly string[], enabled: boolean) {
  const [state, setState] = useState<{ data: Vocabulary[]; loadedKey: string | null; error: string | null }>({
    data: [],
    loadedKey: null,
    error: null,
  })
  const key = ids.join("\n")

  useEffect(() => {
    if (!enabled) return

    let cancelled = false
    const reviewIds = key ? key.split("\n") : []

    loadVocabularyForIds(reviewIds)
      .then((data) => {
        if (cancelled) return
        setState({ data, loadedKey: key, error: null })
      })
      .catch((err) => {
        if (cancelled) return
        setState({ data: [], loadedKey: key, error: err instanceof Error ? err.message : String(err) })
      })

    return () => {
      cancelled = true
    }
  }, [enabled, key])

  return {
    data: enabled && state.loadedKey === key ? state.data : [],
    loading: enabled && state.loadedKey !== key,
    error: enabled && state.loadedKey === key ? state.error : null,
  }
}
