"use client"

import { useCallback, useEffect } from "react"
import { useSpeechPreferences } from "@/components/ui/speech-preferences"
import { cancelJapaneseSpeech, speakJapaneseRepeated } from "@/lib/speech"

export function useQuizAudio({
  autoPlayText,
  autoPlayKey,
  autoPlayEnabled,
  autoPlayDelayMs = 500,
}: {
  autoPlayText?: string | null
  autoPlayKey?: unknown
  autoPlayEnabled?: boolean
  autoPlayDelayMs?: number
}) {
  const speech = useSpeechPreferences()

  const playAudio = useCallback((text: string) => {
    const repeat = speech?.prefs.repeat ?? 1
    const gapMs = speech?.prefs.gapMs ?? 250
    speakJapaneseRepeated(text, { repeat, gapMs })
  }, [speech?.prefs.gapMs, speech?.prefs.repeat])

  // Manual playback must also stop when the question changes or unmounts,
  // including when autoplay is disabled and no autoplay timer exists.
  useEffect(() => () => cancelJapaneseSpeech(), [autoPlayKey])

  useEffect(() => {
    if (!autoPlayText || !autoPlayEnabled) return

    const autoPlay = speech?.prefs.autoPlay ?? true
    if (!autoPlay) return

    const timer = setTimeout(() => playAudio(autoPlayText), autoPlayDelayMs)
    return () => clearTimeout(timer)
  }, [autoPlayDelayMs, autoPlayEnabled, autoPlayKey, autoPlayText, playAudio, speech?.prefs.autoPlay])

  return { playAudio }
}
