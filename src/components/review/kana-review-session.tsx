"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useReviewAnswerRecorder } from "@/components/review/use-review-answer-recorder"
import { ReviewOptionGrid } from "@/components/review/review-option-grid"
import { KanaReviewPrompt } from "@/components/review/review-prompt-content"
import { ReviewNextButton, ReviewPromptCard, ReviewSessionFrame } from "@/components/review/review-session-frame"
import { ReviewDone, ReviewEmptyQuestionState } from "@/components/review/review-status"
import { useReviewSessionState } from "@/components/review/use-review-session-state"
import { useReviewAudio } from "@/components/review/use-review-audio"
import { PracticeSaveError } from "@/components/practice/practice-save-error"
import { kanaData } from "@/data/kana-data"
import type { useLearningProgress } from "@/lib/learning-progress"
import type { useMistakeNotebook } from "@/lib/mistake-notebook"
import type { Question, QuestionResult } from "@/lib/questions"
import type { useSrsDeck } from "@/lib/srs"
import { makeKanaReviewQuestion } from "@/lib/review-questions"

export function KanaReviewSession({
  ids,
  onExit,
  notebook,
  learning,
  srs,
}: {
  ids: string[]
  onExit: () => void
  notebook: ReturnType<typeof useMistakeNotebook>
  learning: ReturnType<typeof useLearningProgress>
  srs: ReturnType<typeof useSrsDeck>
}) {
  const [question, setQuestion] = useState<Question | null>(null)
  const [saveError, setSaveError] = useState(false)
  const review = useReviewSessionState(ids)
  const selected = review.selectedAnswer
  const { dropCurrent } = review

  const currentId = review.currentItem
  const item = useMemo(() => (currentId ? kanaData.find((k) => k.romaji === currentId) ?? null : null), [currentId])

  useEffect(() => {
    if (currentId && !item) {
      dropCurrent()
    }
  }, [currentId, dropCurrent, item])

  useEffect(() => {
    let cancelled = false

    Promise.resolve().then(() => {
      if (cancelled) return
      if (!item) {
        setQuestion(null)
        setSaveError(false)
        return
      }

      setQuestion(makeKanaReviewQuestion(item.romaji))
      setSaveError(false)
    })

    return () => {
      cancelled = true
    }
  }, [item])

  const { playAudio } = useReviewAudio({
    autoPlayText: item?.hiragana,
    autoPlayKey: item?.romaji,
  })

  const recordAnswerSelection = useReviewAnswerRecorder({
    progress: learning,
    notebook,
    recordAnswer: review.recordAnswer,
    canRecord: useCallback(() => {
      if (!item) return false
      return srs.has(item.romaji)
    }, [item, srs]),
    grade: useCallback((result: QuestionResult) => {
      if (!item) return false
      return srs.gradeExisting(item.romaji, result.correct ? "good" : "again")
    }, [item, srs]),
  })

  if (review.isComplete) {
    return (
      <ReviewDone
        title={review.isInvalidated ? "学习数据已更新，请重新开始复习" : "假名复习完成"}
        onExit={onExit}
        stats={review.isInvalidated ? undefined : review.completionStats}
      />
    )
  }

  if (!item) {
    return null
  }

  if (!question) {
    return (
      <ReviewEmptyQuestionState
        title="当前假名复习题不足"
        message="这一轮假名复习暂时凑不出足够的唯一选项。返回复习页后稍后再试，或先继续课程和测验扩充题库。"
        onExit={onExit}
      />
    )
  }

  const handleSelect = (val: string) => {
    const recorded = recordAnswerSelection(question, val)
    setSaveError(!recorded)
  }

  const handleNext = () => {
    setSaveError(false)
    review.advance()
  }

  return (
    <ReviewSessionFrame
      onExit={onExit}
      headerRight={<div className="text-xs text-muted-foreground font-mono">剩余: {review.remainingCount}</div>}
    >

      <ReviewPromptCard>
        <KanaReviewPrompt hiragana={item.hiragana} katakana={item.katakana} onPlay={playAudio} />
      </ReviewPromptCard>

      <ReviewOptionGrid
        options={question.options}
        correctAnswer={item.romaji}
        selectedAnswer={selected}
        onSelect={handleSelect}
        optionClassName="h-16 text-lg font-medium"
      />

      <PracticeSaveError show={saveError} />

      <ReviewNextButton show={review.isAnswered} onNext={handleNext} />
    </ReviewSessionFrame>
  )
}
