"use client"

import { runLearningWrite } from "@/lib/learning-write-lock"

import { useCallback, useEffect, useMemo, useRef, useState, type SetStateAction } from "react"
import type { Lesson } from "@/data/lesson-types"
import { STARTER_LESSONS, getNextLesson } from "@/data/lesson-catalog"
import { useLearningProgress, useLearningProfile } from "@/lib/learning-progress"
import { useMistakeNotebook } from "@/lib/mistake-notebook"
import { isLessonUnlocked } from "@/lib/learning-entry"
import {
  buildLessonRunnerViewModel,
  countPracticeSteps,
  getLatestLessonStepAnswers,
  getLessonAnsweredFromStepMap,
  resolveLessonResumeStepIndex,
} from "@/lib/lesson-session"
import { mergeLessonStepAnswers } from "@/lib/lesson-step-answers"
import { readLessonProgressMapResult } from "@/lib/learning-progress-storage"

export function useLessonRunnerState(lesson: Lesson) {
  const restartPending = useRef(false)
  const progress = useLearningProgress()
  const { profile } = useLearningProfile()
  const mistakes = useMistakeNotebook()
  const { lessons, results, loaded, startLesson, completeLesson, saveLessonPosition } = progress
  const [manualStep, setManualStep] = useState<{ lessonId: string; index: number; attemptId?: string } | null>(null)
  const [answeredDraft, setAnsweredDraft] = useState<{ lessonId: string; answers: Record<string, boolean>; attemptId?: string } | null>(null)
  const [saveError, setSaveError] = useState(false)
  const savedLessonProgress = lessons[lesson.id]
  const kanaLevel = profile?.kanaLevel
  const lessonUnlocked = useMemo(() => {
    if (!loaded) return true
    return isLessonUnlocked(lesson, progress.completedLessonIds, kanaLevel)
  }, [kanaLevel, lesson, loaded, progress.completedLessonIds])
  const recommendedLesson = useMemo(
    () => getNextLesson(progress.completedLessonIds, kanaLevel),
    [kanaLevel, progress.completedLessonIds]
  )

  useEffect(() => {
    if (!loaded) return
    if (!lessonUnlocked) return
    let cancelled = false
    void runLearningWrite(() => !cancelled && startLesson(lesson.id)).then(saved => { if (!cancelled) setSaveError(!saved) })
    return () => { cancelled = true }
  }, [lesson.id, lessonUnlocked, loaded, startLesson])

  const resumedStepIndex = useMemo(() => {
    if (!loaded) return 0
    return resolveLessonResumeStepIndex(savedLessonProgress, lesson.steps)
  }, [lesson.steps, loaded, savedLessonProgress])

  const stepIndex = manualStep?.lessonId === lesson.id && manualStep.attemptId === savedLessonProgress?.attemptId ? manualStep.index : resumedStepIndex

  useEffect(() => {
    if (!loaded) return
    if (!lessonUnlocked) return
    const step = lesson.steps[stepIndex]
    let cancelled = false
    void runLearningWrite(() => !cancelled && saveLessonPosition(lesson.id, stepIndex, step?.id, { attemptId: savedLessonProgress?.attemptId })).then(saved => { if (!cancelled) setSaveError(!saved) })
    return () => { cancelled = true }
  }, [lesson.id, lesson.steps, lessonUnlocked, loaded, stepIndex, saveLessonPosition, savedLessonProgress?.attemptId])

  const current = useMemo(() => ({ ...lesson.steps[stepIndex], attemptId: savedLessonProgress?.attemptId }), [lesson.steps, stepIndex, savedLessonProgress?.attemptId])
  const isLast = stepIndex === lesson.steps.length - 1
  const practiceSteps = useMemo(() => countPracticeSteps(lesson.steps), [lesson.steps])
  const persistedStepAnswers = useMemo(() => {
    return mergeLessonStepAnswers(
      savedLessonProgress?.stepAnswers,
      getLatestLessonStepAnswers(lesson.id, lesson.steps, results, savedLessonProgress?.attemptId)
    )
  }, [lesson.id, lesson.steps, results, savedLessonProgress?.stepAnswers, savedLessonProgress?.attemptId])
  const restoredAnswered = useMemo(() => {
    return getLessonAnsweredFromStepMap(persistedStepAnswers)
  }, [persistedStepAnswers])

  const answered = useMemo(() => {
    if (answeredDraft?.lessonId !== lesson.id || answeredDraft.attemptId !== savedLessonProgress?.attemptId) return restoredAnswered
    return { ...restoredAnswered, ...answeredDraft.answers }
  }, [answeredDraft, lesson.id, restoredAnswered, savedLessonProgress?.attemptId])

  const setAnsweredForLesson = useCallback(
    (update: SetStateAction<Record<string, boolean>>) => {
      setAnsweredDraft((prev) => {
        const base = {
          ...restoredAnswered,
          ...(prev?.lessonId === lesson.id && prev.attemptId === savedLessonProgress?.attemptId ? prev.answers : {}),
        }
        const answers = typeof update === "function" ? update(base) : update
        return { lessonId: lesson.id, answers, attemptId: savedLessonProgress?.attemptId }
      })
    },
    [lesson.id, restoredAnswered, savedLessonProgress?.attemptId]
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
      completedLessonIds: progress.completedLessonIds,
      kanaLevel,
    })
  }, [answered, kanaLevel, lesson, lessons, loaded, lessonUnlocked, practiceSteps, progress.completedLessonIds, stepIndex])

  const setManualStepIndex = useCallback(
    (index: number) => {
      setManualStep({ lessonId: lesson.id, index, attemptId: savedLessonProgress?.attemptId })
    },
    [lesson.id, savedLessonProgress?.attemptId]
  )

  const completeCurrentLesson = useCallback(
    async (completionScore: number) => {
      setSaveError(!await runLearningWrite(() => {
        const stored = readLessonProgressMapResult()
        if (!stored.ok) return false
        const answers = stored.value[lesson.id]?.stepAnswers ?? {}
        const correct = Object.values(answers).filter(answer => answer.correct && !answer.assisted).length
        const score = practiceSteps > 0 ? Math.round(correct / practiceSteps * 100) : completionScore
        return completeLesson(lesson.id, score, { attemptId: savedLessonProgress?.attemptId })
      }))
    },
    [completeLesson, lesson.id, practiceSteps, savedLessonProgress?.attemptId]
  )

  const restartCurrentLesson = async () => {
    if (!loaded || !lessonUnlocked || restartPending.current) return
    restartPending.current = true
    const saved = await runLearningWrite(() => progress.restartLesson(lesson.id))
    restartPending.current = false
    setSaveError(!saved)
    if (saved) {
      setManualStep(null)
      setAnsweredDraft(null)
    }
  }

  const revealCurrentHint = async () => {
    if (!loaded || !lessonUnlocked) return
    setSaveError(!await runLearningWrite(() => progress.revealLessonHint(lesson.id, current.id, savedLessonProgress?.attemptId)))
  }

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
    restartCurrentLesson,
    revealCurrentHint,
  }
}
