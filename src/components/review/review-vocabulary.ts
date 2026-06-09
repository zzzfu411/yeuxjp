"use client"

import { useCallback, useEffect, useState } from "react"
import { loadVocabularyReviewPool, loadVocabularyScope } from "@/data/vocabulary/loader"
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

export function useVocabularyReviewPool(ids: readonly string[], enabled: boolean) {
  const [state, setState] = useState<{ data: Vocabulary[]; loadedKey: string | null; error: string | null }>({
    data: [],
    loadedKey: null,
    error: null,
  })
  const [retryToken, setRetryToken] = useState(0)
  const key = ids.join("\n")

  const retry = useCallback(() => {
    if (!enabled) return
    setState({ data: [], loadedKey: null, error: null })
    setRetryToken((value) => value + 1)
  }, [enabled])

  useEffect(() => {
    if (!enabled) return

    let cancelled = false
    const reviewIds = key ? key.split("\n") : []

    loadVocabularyReviewPool(reviewIds)
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
  }, [enabled, key, retryToken])

  return {
    data: enabled && state.loadedKey === key ? state.data : [],
    loading: enabled && state.loadedKey !== key,
    error: enabled && state.loadedKey === key ? state.error : null,
    retry,
  }
}
