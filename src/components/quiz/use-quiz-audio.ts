"use client"

import { useCallback, useEffect, useRef } from "react"
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
  const autoPlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const playAudio = useCallback((text: string) => {
    const pendingTimer = autoPlayTimerRef.current
    if (pendingTimer !== null) {
      clearTimeout(pendingTimer)
      autoPlayTimerRef.current = null
    }

    const repeat = speech?.prefs.repeat ?? 1
    const gapMs = speech?.prefs.gapMs ?? 250
    speakJapaneseRepeated(text, { repeat, gapMs })
  }, [speech?.prefs.gapMs, speech?.prefs.repeat])
  const playAudioRef = useRef(playAudio)

  // Preference changes should affect the next playback without rearming the
  // current prompt's autoplay timer.
  useEffect(() => {
    playAudioRef.current = playAudio
  }, [playAudio])

  // Manual playback must also stop when the question changes or unmounts,
  // including when autoplay is disabled and no autoplay timer exists.
  useEffect(() => () => cancelJapaneseSpeech(), [autoPlayKey])

  useEffect(() => {
    if (!autoPlayText || !autoPlayEnabled) return

    const autoPlay = speech?.prefs.autoPlay ?? true
    if (!autoPlay) return

    const timer = setTimeout(() => {
      if (autoPlayTimerRef.current !== timer) return
      autoPlayTimerRef.current = null
      playAudioRef.current(autoPlayText)
    }, autoPlayDelayMs)
    autoPlayTimerRef.current = timer
    return () => {
      clearTimeout(timer)
      if (autoPlayTimerRef.current === timer) autoPlayTimerRef.current = null
    }
  }, [autoPlayDelayMs, autoPlayEnabled, autoPlayKey, autoPlayText, speech?.prefs.autoPlay])

  return { playAudio }
}
