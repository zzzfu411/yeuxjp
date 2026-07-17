"use client"

import { useCallback, useEffect, useMemo, useState, type SetStateAction } from "react"
import { STARTER_LESSONS, getNextLesson, type Lesson } from "@/data/lessons"
import { useLearningProgress } from "@/lib/learning-progress"
import { useMistakeNotebook } from "@/lib/mistake-notebook"
import { isLessonUnlocked } from "@/lib/learning-entry"
import {
  buildLessonRunnerViewModel,
  countPracticeSteps,
  getLatestLessonStepAnswers,
  getLessonAnsweredFromResults,
  resolveLessonResumeStepIndex,
} from "@/lib/lesson-session"

export function useLessonRunnerState(lesson: Lesson) {
  const progress = useLearningProgress()
  const mistakes = useMistakeNotebook()
  const { lessons, results, loaded, startLesson, completeLesson, saveLessonPosition } = progress
  const [manualStep, setManualStep] = useState<{ lessonId: string; index: number } | null>(null)
  const [answeredDraft, setAnsweredDraft] = useState<{ lessonId: string; answers: Record<string, boolean> } | null>(null)
  const [saveError, setSaveError] = useState(false)
  const savedLessonProgress = lessons[lesson.id]
  const lessonUnlocked = useMemo(() => {
    if (!loaded) return true
    return isLessonUnlocked(lesson, progress.completedLessonIds)
  }, [lesson, loaded, progress.completedLessonIds])
  const recommendedLesson = useMemo(() => getNextLesson(progress.completedLessonIds), [progress.completedLessonIds])

  useEffect(() => {
    if (!loaded) return
    if (!lessonUnlocked) return
    const saved = startLesson(lesson.id)
    const timer = window.setTimeout(() => setSaveError(!saved), 0)
    return () => window.clearTimeout(timer)
  }, [lesson.id, lessonUnlocked, loaded, startLesson])

  const resumedStepIndex = useMemo(() => {
    if (!loaded) return 0
    return resolveLessonResumeStepIndex(savedLessonProgress, lesson.steps)
  }, [lesson.steps, loaded, savedLessonProgress])

  const stepIndex = manualStep?.lessonId === lesson.id ? manualStep.index : resumedStepIndex

  useEffect(() => {
    if (!loaded) return
    if (!lessonUnlocked) return
    const step = lesson.steps[stepIndex]
    const saved = saveLessonPosition(lesson.id, stepIndex, step?.id)
    const timer = window.setTimeout(() => setSaveError(!saved), 0)
    return () => window.clearTimeout(timer)
  }, [lesson.id, lesson.steps, lessonUnlocked, loaded, stepIndex, saveLessonPosition])

  const current = lesson.steps[stepIndex]
  const isLast = stepIndex === lesson.steps.length - 1
  const practiceSteps = useMemo(() => countPracticeSteps(lesson.steps), [lesson.steps])
  const persistedStepAnswers = useMemo(() => {
    return getLatestLessonStepAnswers(lesson.id, lesson.steps, results)
  }, [lesson.id, lesson.steps, results])
  const restoredAnswered = useMemo(() => {
    return getLessonAnsweredFromResults(lesson.id, lesson.steps, results)
  }, [lesson.id, lesson.steps, results])

  const answered = useMemo(() => {
    if (answeredDraft?.lessonId !== lesson.id) return restoredAnswered
    return { ...restoredAnswered, ...answeredDraft.answers }
  }, [answeredDraft, lesson.id, restoredAnswered])

  const setAnsweredForLesson = useCallback(
    (update: SetStateAction<Record<string, boolean>>) => {
      setAnsweredDraft((prev) => {
        const base = {
          ...restoredAnswered,
          ...(prev?.lessonId === lesson.id ? prev.answers : {}),
        }
        const answers = typeof update === "function" ? update(base) : update
        return { lessonId: lesson.id, answers }
      })
    },
    [lesson.id, restoredAnswered]
  )

  const lessonView = useMemo(() => {
    return buildLessonRunnerViewModel({
      lesson,
      courseLessons: STARTER_LESSONS,
      lessons,
      stepIndex,
      answered,
      practiceSteps,
      loaded,
      lessonUnlocked,
    })
  }, [answered, lesson, lessons, loaded, lessonUnlocked, practiceSteps, stepIndex])

  const setManualStepIndex = useCallback(
    (index: number) => {
      setManualStep({ lessonId: lesson.id, index })
    },
    [lesson.id]
  )

  const completeCurrentLesson = useCallback(
    (completionScore: number) => {
      setSaveError(!completeLesson(lesson.id, completionScore))
    },
    [completeLesson, lesson.id]
  )

  return {
    progress,
    mistakes,
    loaded,
    savedLessonProgress,
    lessonUnlocked,
    recommendedLesson,
    stepIndex,
    current,
    isLast,
    practiceSteps,
    persistedStepAnswers,
    setAnsweredForLesson,
    lessonView,
    saveError,
    setSaveError,
    setManualStepIndex,
    completeCurrentLesson,
  }
}
