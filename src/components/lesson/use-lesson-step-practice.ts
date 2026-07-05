"use client"

import { useCallback, useRef, useState } from "react"
import type { LessonStep } from "@/data/lessons"
import type { QuestionResult } from "@/lib/questions"

type LessonAnswerRecorder = (step: LessonStep, answer: string) => QuestionResult | null

export function useLessonStepPractice({
  current,
  readOnly,
  recordAnswer,
  setSaveError,
}: {
  current: LessonStep
  readOnly: boolean
  recordAnswer: LessonAnswerRecorder
  setSaveError: (value: boolean) => void
}) {
  const answerPendingRef = useRef(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [typed, setTyped] = useState("")
  const [built, setBuilt] = useState<string[]>([])
  const [result, setResult] = useState<"correct" | "wrong" | null>(null)

  const resetStepState = useCallback(() => {
    setSelected(null)
    setTyped("")
    setBuilt([])
    setResult(null)
    answerPendingRef.current = false
    setSaveError(false)
  }, [setSaveError])

  const applyRecordedAnswer = useCallback(
    (answer: string, afterSuccess?: () => void) => {
      if (answerPendingRef.current) return
      answerPendingRef.current = true

      const recorded = recordAnswer(current, answer)
      if (!recorded) {
        answerPendingRef.current = false
        setSaveError(true)
        return
      }

      setSaveError(false)
      afterSuccess?.()
      setResult(recorded.correct ? "correct" : "wrong")
    },
    [current, recordAnswer, setSaveError]
  )

  const submitChoice = useCallback(
    (answer: string) => {
      if (readOnly) return
      if (current.type !== "multipleChoice" || result) return
      applyRecordedAnswer(answer, () => setSelected(answer))
    },
    [applyRecordedAnswer, current, readOnly, result]
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
    [result]
  )

  const undoChunk = useCallback(() => {
    setBuilt((prev) => prev.slice(0, -1))
  }, [])

  const resetChunks = useCallback(() => {
    setBuilt([])
  }, [])

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
