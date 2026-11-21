"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { LEARNING_STORE_EVENT } from "@/lib/learning-events"
import { LEARNING_EVENT } from "@/lib/learning-storage"
import { calculateStudyStreak, type ItemProgressMap, type LessonProgressMap, type PracticeResult } from "@/lib/learning-progress-model"
import { includesProgressStorageKey, isProgressStorageKey } from "@/lib/learning-progress-keys"
import { readItemProgressMapResult, readLessonProgressMapResult, readPracticeResultsResult } from "@/lib/learning-progress-storage"
import { readStudyCalendarResult } from "@/lib/study-calendar-storage"
import { calendarStudyDates, mergeLegacyStudyCalendar, type StudyCalendar } from "@/lib/study-calendar-model"
import { useLocalDay } from "@/lib/use-local-day"

export function subscribeLearningProgress(load: () => void) {
  let cancelled = false
  Promise.resolve().then(() => {
    if (!cancelled) load()
  })

  const sync = (event: Event) => {
    const detail = (event as CustomEvent).detail as { key?: string } | undefined
    if (isProgressStorageKey(detail?.key)) {
      load()
    }
  }

  const syncStore = (event: Event) => {
    const detail = (event as CustomEvent).detail as { keys?: readonly string[] } | undefined
    if (includesProgressStorageKey(detail?.keys)) {
      load()
    }
  }

  const onStorage = (event: StorageEvent) => {
    if (isProgressStorageKey(event.key)) {
      load()
    }
  }

  window.addEventListener("storage", onStorage)
  window.addEventListener(LEARNING_EVENT, sync)
  window.addEventListener(LEARNING_STORE_EVENT, syncStore)
  return () => {
    cancelled = true
    window.removeEventListener("storage", onStorage)
    window.removeEventListener(LEARNING_EVENT, sync)
    window.removeEventListener(LEARNING_STORE_EVENT, syncStore)
  }
}

/** Shared state and subscription for both read-only and writable progress APIs. */
export function useLearningProgressState() {
  const [calendar, setCalendar] = useState<StudyCalendar>({})
  const currentLocalDay = useLocalDay()
  const [lessons, setLessons] = useState<LessonProgressMap>({})
  const [items, setItems] = useState<ItemProgressMap>({})
  const [results, setResults] = useState<PracticeResult[]>([])
  const [loaded, setLoaded] = useState(false)

  const load = useCallback(() => {
    setCalendar(readStudyCalendarResult().value)
    setLessons(readLessonProgressMapResult().value)
    setItems(readItemProgressMapResult().value)
    setResults(readPracticeResultsResult().value)
    setLoaded(true)
  }, [])

  useEffect(() => subscribeLearningProgress(load), [load])

  const completedLessonIds = useMemo(() => {
    return new Set(Object.values(lessons).filter((item) => item.status === "completed").map((item) => item.lessonId))
  }, [lessons])

  const studyCalendar = useMemo(() => mergeLegacyStudyCalendar(calendar, lessons, results), [calendar, lessons, results])
  const studyDates = useMemo(() => calendarStudyDates(studyCalendar), [studyCalendar])

  const streak = useMemo(() => {
    return calculateStudyStreak(studyDates, currentLocalDay)
  }, [studyDates, currentLocalDay])

  return {
    snapshot: {
      lessons,
      items,
      results,
      loaded,
      completedLessonIds,
      streak,
      studyCalendar,
      currentLocalDay,
    },
    setLessons,
    setItems,
    setResults,
  }
}

export function useLearningProgressSnapshot() {
  return useLearningProgressState().snapshot
}

export type LearningProgressSnapshot = ReturnType<typeof useLearningProgressSnapshot>
