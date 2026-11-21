"use client"
import { useEffect, useRef, useState } from "react"
import { LEARNING_EVENT } from "@/lib/learning-storage"
import { LEARNING_STORE_EVENT } from "@/lib/learning-events"
import { runLearningWrite } from "@/lib/learning-write-lock"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import { readKanjiReadings, saveKanjiReading } from "@/lib/kanji-reading-storage"
import type { KanjiReadingStore } from "@/lib/kanji-reading-model"
import type { KanjiReadingQuestion } from "@/lib/kanji-reading-question"
import { useLearningPractice } from "@/lib/learning-progress-practice"

export function useKanjiReadings() {
  const [state, setState] = useState({ store: {} as KanjiReadingStore, loaded: false, error: false })
  const [pending, setPending] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const control = useRef({ mounted: false, writing: false })
  const progress = useLearningPractice()
  useEffect(() => {
    const local = control.current
    local.mounted = true
    let mounted = true
    const sync = () => { if (mounted) { const data = readKanjiReadings(); setState({ store: data.value, loaded: true, error: !data.ok }) } }
    const storage = (event: StorageEvent) => { if (event.key === null || event.key === STORAGE_KEYS.KANJI_READINGS) sync() }
    const unload = (event: BeforeUnloadEvent) => { if (local.writing) { event.preventDefault(); event.returnValue = "" } }
    queueMicrotask(sync)
    window.addEventListener("storage", storage); window.addEventListener(LEARNING_EVENT, sync); window.addEventListener(LEARNING_STORE_EVENT, sync); window.addEventListener("beforeunload", unload)
    return () => { mounted = false; local.mounted = false; window.removeEventListener("storage", storage); window.removeEventListener(LEARNING_EVENT, sync); window.removeEventListener(LEARNING_STORE_EVENT, sync); window.removeEventListener("beforeunload", unload) }
  }, [])
  const save = async (question: KanjiReadingQuestion, answer: string, token: string, review: boolean) => {
    if (!state.loaded || !progress.loaded || state.error || control.current.writing) return null
    control.current.writing = true; setPending(true)
    const result = await runLearningWrite(() => saveKanjiReading(question, answer, token, progress.recordPractice, review))
    control.current.writing = false
    if (control.current.mounted) { setPending(false); setSaveError(!result) }
    return result || null
  }
  return { ...state, loaded: state.loaded && progress.loaded, saveError, pending, save }
}
