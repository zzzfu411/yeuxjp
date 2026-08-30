"use client"

import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { parseKanaSet, type KanaSet } from "@/lib/kana-page-model"
import type { KanaMode } from "@/components/kana/kana-controls"
import { useLearningProfile } from "@/lib/learning-progress"
import { defaultShowStudyRomaji, nextRomajiVisibility } from "@/lib/romaji-visibility"

export function useKanaPageControls() {
  const searchParams = useSearchParams()
  const { profile } = useLearningProfile()
  const [mode, setMode] = useState<KanaMode>("hiragana")
  const [kanaSet, setKanaSet] = useState<KanaSet>("seion")
  const [romajiOverride, setRomajiOverride] = useState<boolean | null>(null)
  const [onlyUnmastered, setOnlyUnmastered] = useState(false)
  const showRomaji = romajiOverride ?? defaultShowStudyRomaji(profile?.romajiMode)

  const urlMode = searchParams.get("mode")
  const urlSet = searchParams.get("set")

  useEffect(() => {
    let cancelled = false

    Promise.resolve().then(() => {
      if (cancelled) return

      setMode(urlMode === "hiragana" || urlMode === "katakana" ? urlMode : "hiragana")

      const parsedSet = parseKanaSet(urlSet)
      setKanaSet(parsedSet ?? "seion")
    })

    return () => {
      cancelled = true
    }
  }, [urlMode, urlSet])

  const toggleShowRomaji = useCallback(() => {
    setRomajiOverride((value) => nextRomajiVisibility(value, profile?.romajiMode, defaultShowStudyRomaji))
  }, [profile?.romajiMode])

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
