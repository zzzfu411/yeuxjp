"use client"

import { useCallback, useEffect, useState } from "react"
import { loadVocabularyReviewPool } from "@/data/vocabulary/loader"
import type { Vocabulary } from "@/data/vocabulary/types"

const REVIEW_VOCABULARY_LOAD_ERROR = "复习题库加载失败"

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
      .catch(() => {
        if (cancelled) return
        setState({ data: [], loadedKey: key, error: REVIEW_VOCABULARY_LOAD_ERROR })
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
