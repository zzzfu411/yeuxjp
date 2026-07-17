"use client"

import { useCallback, useRef, useState } from "react"
import type { LessonStep } from "@/data/lessons"
import type { PersistedLessonStepAnswer } from "@/lib/lesson-session"
import type { QuestionResult } from "@/lib/questions"

type LessonAnswerRecorder = (step: LessonStep, answer: string) => QuestionResult | null

interface LessonPracticeState {
  step: LessonStep
  restoredAnswer?: PersistedLessonStepAnswer
  selected: string | null
  typed: string
  built: string[]
  result: "correct" | "wrong" | null
}

export function useLessonStepPractice({
  current,
  readOnly,
  recordAnswer,
  restoredAnswer,
  setSaveError,
}: {
  current: LessonStep
  readOnly: boolean
  recordAnswer: LessonAnswerRecorder
  restoredAnswer?: PersistedLessonStepAnswer
  setSaveError: (value: boolean) => void
}) {
  const answerPendingRef = useRef<LessonStep | null>(null)
  const [draft, setDraft] = useState<LessonPracticeState | null>(null)
  const state = draft?.step === current && draft.restoredAnswer === restoredAnswer
    ? draft
    : createLessonPracticeState(current, restoredAnswer)
  const { selected, typed, built, result } = state

  const updateDraft = useCallback(
    (update: (previous: LessonPracticeState) => LessonPracticeState) => {
      setDraft((previous) => {
        const base = previous?.step === current && previous.restoredAnswer === restoredAnswer
          ? previous
          : createLessonPracticeState(current, restoredAnswer)
        return update(base)
      })
    },
    [current, restoredAnswer]
  )

  const setSelected = useCallback((value: string | null) => {
    updateDraft((previous) => ({ ...previous, selected: value }))
  }, [updateDraft])

  const setTyped = useCallback((value: string) => {
    updateDraft((previous) => ({ ...previous, typed: value }))
  }, [updateDraft])

  const setBuilt = useCallback((update: string[] | ((previous: string[]) => string[])) => {
    updateDraft((previous) => ({
      ...previous,
      built: typeof update === "function" ? update(previous.built) : update,
    }))
  }, [updateDraft])

  const setResult = useCallback((value: "correct" | "wrong" | null) => {
    updateDraft((previous) => ({ ...previous, result: value }))
  }, [updateDraft])

  const resetStepState = useCallback(() => {
    setDraft(createLessonPracticeState(current))
    answerPendingRef.current = null
    setSaveError(false)
  }, [current, setSaveError])

  const applyRecordedAnswer = useCallback(
    (answer: string, afterSuccess?: () => void) => {
      if (answerPendingRef.current === current) return
      answerPendingRef.current = current

      const recorded = recordAnswer(current, answer)
      if (!recorded) {
        answerPendingRef.current = null
        setSaveError(true)
        return
      }

      setSaveError(false)
      afterSuccess?.()
      setResult(recorded.correct ? "correct" : "wrong")
    },
    [current, recordAnswer, setResult, setSaveError]
  )

  const submitChoice = useCallback(
    (answer: string) => {
      if (readOnly) return
      if (current.type !== "multipleChoice" || result) return
      applyRecordedAnswer(answer, () => setSelected(answer))
    },
    [applyRecordedAnswer, current, readOnly, result, setSelected]
  )

  const submitTyping = useCallback(() => {
    if (readOnly) return
    if ((current.type !== "typing" && current.type !== "dictation") || result) return
    applyRecordedAnswer(typed)
  }, [applyRecordedAnswer, current, readOnly, result, typed])

  const submitSentence = useCallback(() => {
    if (readOnly) return
    if (current.type !== "sentenceBuild" || result) return
    applyRecordedAnswer(built.join(""))
  }, [applyRecordedAnswer, built, current, readOnly, result])

  const pickChunk = useCallback(
    (chunk: string) => {
      if (result) return
      setBuilt((prev) => [...prev, chunk])
    },
    [result, setBuilt]
  )

  const undoChunk = useCallback(() => {
    setBuilt((prev) => prev.slice(0, -1))
  }, [setBuilt])

  const resetChunks = useCallback(() => {
    setBuilt([])
  }, [setBuilt])

  return {
    selected,
    typed,
    setTyped,
    built,
    result,
    resetStepState,
    submitChoice,
    submitTyping,
    pickChunk,
    undoChunk,
    resetChunks,
    submitSentence,
  }
}

function restoreSentenceChunks(chunks: readonly string[], answer: string) {
  const visit = (remaining: string, available: number[]): string[] | null => {
    if (!remaining) return []

    for (const index of available) {
      const chunk = chunks[index]
      if (!remaining.startsWith(chunk)) continue
      const restored = visit(remaining.slice(chunk.length), available.filter((item) => item !== index))
      if (restored) return [chunk, ...restored]
    }

    return null
  }

  return visit(answer, chunks.map((_, index) => index)) ?? (answer ? [answer] : [])
}

function createLessonPracticeState(
  current: LessonStep,
  restoredAnswer?: PersistedLessonStepAnswer
): LessonPracticeState {
  const answer = restoredAnswer?.answer ?? ""
  return {
    step: current,
    restoredAnswer,
    selected: current.type === "multipleChoice" && restoredAnswer ? answer : null,
    typed: (current.type === "typing" || current.type === "dictation") && restoredAnswer ? answer : "",
    built: current.type === "sentenceBuild" && restoredAnswer ? restoreSentenceChunks(current.chunks, answer) : [],
    result: restoredAnswer ? (restoredAnswer.correct ? "correct" : "wrong") : null,
  }
}
