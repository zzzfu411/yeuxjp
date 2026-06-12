"use client"

import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { useReviewAnswerRecorder } from "@/components/review/use-review-answer-recorder"
import { ReviewOptionGrid } from "@/components/review/review-option-grid"
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
import { mistakeToQuestion } from "@/lib/review-questions"

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
  const selected = review.selectedAnswer
  const lastOk = review.lastAnswerCorrect

  const currentId = review.currentItem
  const item = currentId ? notebook.byId.get(currentId) ?? null : null
  const saveError = !!currentId && saveErrorId === currentId

  const { playAudio } = useReviewAudio({
    autoPlayText: item?.questionAudio,
    autoPlayKey: currentId,
  })

  const recordAnswerSelection = useReviewAnswerRecorder({
    progress: learning,
    notebook,
    recordAnswer: review.recordAnswer,
    grade: useCallback((result: QuestionResult) => {
      if (!item) return false
      return srs.grade(item.id, result.correct ? "good" : "again")
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

  if (!item) {
    return <ReviewDone title="错题不存在（可能已移除）" onExit={onExit} />
  }

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
  }

  return (
    <ReviewSessionFrame
      onExit={onExit}
      testId="mistake-review-session"
      headerRight={
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground font-mono">剩余: {review.remainingCount}</div>
          <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={handleRemove}>
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

      <ReviewOptionGrid
        options={question.options}
        correctAnswer={correct}
        selectedAnswer={selected}
        onSelect={handleSelect}
      />

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
