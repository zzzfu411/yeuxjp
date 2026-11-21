"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useReviewAnswerRecorder } from "@/components/review/use-review-answer-recorder"
import { ReviewAnswerFeedback } from "@/components/review/review-answer-feedback"
import { ReviewOptionGrid } from "@/components/review/review-option-grid"
import { KanaReviewPrompt } from "@/components/review/review-prompt-content"
import { ReviewNextButton, ReviewPromptCard, ReviewSessionFrame } from "@/components/review/review-session-frame"
import { ReviewDone, ReviewEmptyQuestionState } from "@/components/review/review-status"
import { useReviewSessionState } from "@/components/review/use-review-session-state"
import { useReviewAudio } from "@/components/review/use-review-audio"
import { PracticeSaveError } from "@/components/practice/practice-save-error"
import { getKanaById } from "@/lib/kana-id"
import type { useLearningProgress } from "@/lib/learning-progress"
import type { useMistakeNotebook } from "@/lib/mistake-notebook"
import type { QuestionResult } from "@/lib/questions"
import type { useSrsDeck } from "@/lib/srs"
import { makeKanaReviewQuestion } from "@/lib/review-questions"
import { gradeSrs } from "@/lib/srs"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import { makeCourseKanaQuestion, type CourseKanaDirection } from "@/lib/course-kana"
import { createSeededRandom } from "@/lib/seeded-random"
import { CourseKanaPrompt } from "@/components/lesson/course-kana-prompt"

export function KanaReviewSession({
  ids,
  onExit,
  notebook,
  learning,
  srs,
  practice = false,
  practiceDirection = "recognition",
}: {
  ids: string[]
  onExit: () => void
  notebook: ReturnType<typeof useMistakeNotebook>
  learning: ReturnType<typeof useLearningProgress>
  srs: ReturnType<typeof useSrsDeck>
  practice?: boolean
  practiceDirection?: CourseKanaDirection
}) {
  const [saveError, setSaveError] = useState(false)
  const [seed] = useState(() => `kana-${Math.random().toString(36).slice(2)}`)
  const review = useReviewSessionState(ids)
  const selected = review.selectedAnswer
  const { dropCurrent } = review

  const currentId = review.currentItem
  const item = useMemo(() => (currentId ? getKanaById(currentId) : null), [currentId])
  const question = useMemo(() => item ? (practice
    ? makeCourseKanaQuestion(item.id, practiceDirection, createSeededRandom(`${seed}:${item.id}`))
    : makeKanaReviewQuestion(item.id, createSeededRandom(`${seed}:${item.id}`))) : null, [item, practice, practiceDirection, seed])

  useEffect(() => {
    if (currentId && !item) {
      dropCurrent()
    }
  }, [currentId, dropCurrent, item])

  const { playAudio } = useReviewAudio({
    autoPlayText: question && (!practice || practiceDirection === "listening") ? item?.kana[item.script] : undefined,
    autoPlayKey: review.presentationVersion,
  })

  const recordAnswerSelection = useReviewAnswerRecorder({
    progress: learning,
    notebook,
    recordAnswer: review.recordAnswer,
    canRecord: useCallback(() => {
      if (!item) return false
      return practice || srs.has(item.id)
    }, [item, practice, srs]),
    grade: useCallback((result: QuestionResult) => {
      if (!item) return false
      if (practice) return gradeSrs(STORAGE_KEYS.SRS_KANA, item.id, result.correct ? "good" : "again")
      return srs.gradeExisting(item.id, result.correct ? "good" : "again")
    }, [item, practice, srs]),
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
        message="当前范围内的假名太少，暂时无法组成一组题。请返回复习页稍后再试，或先继续课程和测验。"
        onExit={onExit}
      />
    )
  }

  const handleSelect = async (val: string) => {
    const recorded = await recordAnswerSelection(question, val)
    setSaveError(!recorded)
  }

  const handleNext = () => {
    setSaveError(false)
    review.advance()
  }

  return (
    <ReviewSessionFrame
      onExit={onExit}
      headerRight={<div className="font-scribble text-sm text-muted-foreground">剩余: {review.remainingCount}</div>}
    >

      <ReviewPromptCard>
        {practice ? <CourseKanaPrompt direction={practiceDirection} glyph={item.kana[item.script]} answered={review.isAnswered} onPlay={playAudio} />
          : <KanaReviewPrompt glyph={item.kana[item.script]} script={item.script} onPlay={playAudio} />}
      </ReviewPromptCard>

      <ReviewOptionGrid
        options={question.options}
        correctAnswer={question.correctAnswer}
        acceptedAnswers={question.acceptedAnswers}
        selectedAnswer={selected}
        onSelect={handleSelect}
        optionClassName="text-lg font-medium"
      />

      <ReviewAnswerFeedback
        question={question}
        selectedAnswer={selected}
        correct={review.lastAnswerCorrect}
        showSelectedAnswer
      />

      <PracticeSaveError show={saveError} />

      <ReviewNextButton show={review.isAnswered} onNext={handleNext} />
    </ReviewSessionFrame>
  )
}
