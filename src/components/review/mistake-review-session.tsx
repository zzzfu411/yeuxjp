"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useReviewAnswerRecorder } from "@/components/review/use-review-answer-recorder"
import { ReviewOptionGrid } from "@/components/review/review-option-grid"
import { ReviewTypedAnswer } from "@/components/review/review-typed-answer"
import { ReviewAnswerFeedback } from "@/components/review/review-answer-feedback"
import { MistakeReviewPrompt } from "@/components/review/review-prompt-content"
import { ReviewNextButton, ReviewPromptCard, ReviewSessionFrame } from "@/components/review/review-session-frame"
import { ReviewDone } from "@/components/review/review-status"
import { useReviewSessionState } from "@/components/review/use-review-session-state"
import { useReviewAudio } from "@/components/review/use-review-audio"
import { PracticeSaveError } from "@/components/practice/practice-save-error"
import type { useLearningProgress } from "@/lib/learning-progress"
import type { useMistakeNotebook } from "@/lib/mistake-notebook"
import type { QuestionResult } from "@/lib/questions"
import type { useSrsDeck } from "@/lib/srs"
import { mistakeToQuestion, questionUsesTypedReview } from "@/lib/review-questions"

export function MistakeReviewSession({
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
  const [saveErrorId, setSaveErrorId] = useState<string | null>(null)
  const review = useReviewSessionState(ids)
  const { dropCurrent } = review
  const selected = review.selectedAnswer
  const lastOk = review.lastAnswerCorrect

  const currentId = review.currentItem
  const item = currentId ? notebook.byId.get(currentId) ?? null : null
  const saveError = !!currentId && saveErrorId === currentId

  useEffect(() => {
    if (!currentId || item) return
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      setSaveErrorId(null)
      dropCurrent()
    })
    return () => {
      cancelled = true
    }
  }, [currentId, dropCurrent, item])

  const { playAudio } = useReviewAudio({
    autoPlayText: item?.questionAudio,
    autoPlayKey: review.presentationVersion,
  })

  const recordAnswerSelection = useReviewAnswerRecorder({
    progress: learning,
    notebook,
    recordAnswer: review.recordAnswer,
    canRecord: useCallback(() => {
      if (!item) return false
      return srs.has(item.id)
    }, [item, srs]),
    grade: useCallback((result: QuestionResult) => {
      if (!item) return false
      if (!result.correct) return true
      return srs.gradeExisting(item.id, "good")
    }, [item, srs]),
  })

  if (review.isComplete) {
    return (
      <ReviewDone
        title={review.isInvalidated ? "学习数据已更新，请重新开始复习" : "错题复习完成"}
        onExit={onExit}
        stats={review.isInvalidated ? undefined : review.completionStats}
      />
    )
  }

  if (!item) return null

  const question = mistakeToQuestion(item)
  const correct = question.correctAnswer

  const handleSelect = (val: string) => {
    const recorded = recordAnswerSelection(question, val)
    setSaveErrorId(recorded ? null : item.id)
  }

  const handleNext = () => {
    setSaveErrorId(null)
    review.advance()
  }

  const handleRemove = () => {
    const removed = notebook.remove(item.id)
    setSaveErrorId(removed ? null : item.id)
    if (removed) dropCurrent()
  }

  return (
    <ReviewSessionFrame
      onExit={onExit}
      testId="mistake-review-session"
      headerRight={
        <div className="flex items-center gap-2">
          <div className="font-scribble text-sm text-muted-foreground">剩余: {review.remainingCount}</div>
          <Button type="button" variant="ghost" size="sm" className="px-2 text-muted-foreground hover:text-accent" onClick={handleRemove}>
            移除
          </Button>
        </div>
      }
    >

      <ReviewPromptCard>
        <MistakeReviewPrompt
          questionText={item.questionText}
          questionAudio={item.questionAudio}
          type={item.type}
          onPlay={playAudio}
        />
      </ReviewPromptCard>

      {questionUsesTypedReview(question) ? (
        <ReviewTypedAnswer
          key={`${currentId}:${review.completionStats.answered}`}
          disabled={Boolean(selected)}
          onSubmit={handleSelect}
        />
      ) : (
        <ReviewOptionGrid
          options={question.options}
          correctAnswer={correct}
          acceptedAnswers={question.acceptedAnswers}
          selectedAnswer={selected}
          onSelect={handleSelect}
        />
      )}

      <ReviewAnswerFeedback
        question={question}
        selectedAnswer={selected}
        correct={lastOk}
        showSelectedAnswer
        showSpecialFeedback
      />

      <PracticeSaveError show={saveError} />

      <ReviewNextButton show={review.isAnswered} onNext={handleNext} />
    </ReviewSessionFrame>
  )
}
