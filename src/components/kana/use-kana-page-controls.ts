"use client"

import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { parseKanaSet, type KanaSet } from "@/lib/kana-page-model"
import type { KanaMode } from "@/components/kana/kana-controls"

export function useKanaPageControls() {
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<KanaMode>("hiragana")
  const [kanaSet, setKanaSet] = useState<KanaSet>("seion")
  const [showRomaji, setShowRomaji] = useState(true)
  const [onlyUnmastered, setOnlyUnmastered] = useState(false)

  const urlMode = searchParams.get("mode")
  const urlSet = searchParams.get("set")

  useEffect(() => {
    let cancelled = false

    Promise.resolve().then(() => {
      if (cancelled) return

      if (urlMode === "hiragana" || urlMode === "katakana") {
        setMode(urlMode)
      }

      const parsedSet = parseKanaSet(urlSet)
      if (parsedSet) setKanaSet(parsedSet)
    })

    return () => {
      cancelled = true
    }
  }, [urlMode, urlSet])

  const toggleShowRomaji = useCallback(() => {
    setShowRomaji((value) => !value)
  }, [])

  const toggleOnlyUnmastered = useCallback(() => {
    setOnlyUnmastered((value) => !value)
  }, [])

  return {
    mode,
    setMode,
    kanaSet,
    setKanaSet,
    showRomaji,
    onlyUnmastered,
    toggleShowRomaji,
    toggleOnlyUnmastered,
  }
}
