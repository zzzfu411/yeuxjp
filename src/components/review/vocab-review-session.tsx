"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useReviewAnswerRecorder } from "@/components/review/use-review-answer-recorder"
import { ReviewOptionGrid } from "@/components/review/review-option-grid"
import { VocabReviewPrompt } from "@/components/review/review-prompt-content"
import { ReviewNextButton, ReviewPromptCard, ReviewSessionFrame } from "@/components/review/review-session-frame"
import { ReviewDone, ReviewEmptyQuestionState, ReviewErrorState, ReviewLoadingState } from "@/components/review/review-status"
import { useReviewSessionState } from "@/components/review/use-review-session-state"
import { useVocabularyReviewPool } from "@/components/review/review-vocabulary"
import { useReviewAudio } from "@/components/review/use-review-audio"
import { PracticeSaveError } from "@/components/practice/practice-save-error"
import type { useLearningProgress } from "@/lib/learning-progress"
import type { useMistakeNotebook } from "@/lib/mistake-notebook"
import type { QuestionResult } from "@/lib/questions"
import type { useSrsDeck } from "@/lib/srs"
import { makeVocabReviewQuestion } from "@/lib/review-questions"

export function VocabReviewSession({
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
  const vocabulary = useVocabularyReviewPool(ids, ids.length > 0)
  const [saveError, setSaveError] = useState(false)
  const review = useReviewSessionState(ids)
  const selected = review.selectedAnswer
  const { dropCurrent } = review

  const currentId = review.currentItem
  const item = useMemo(() => (currentId ? vocabulary.data.find((v) => v.id === currentId) ?? null : null), [currentId, vocabulary.data])
  const question = useMemo(() => (item ? makeVocabReviewQuestion(item.id, vocabulary.data) : null), [item, vocabulary.data])
  const missingReviewEntry = !!currentId && !item
  const insufficientQuestionOptions = !!item && !question

  useEffect(() => {
    if (!currentId || vocabulary.loading || vocabulary.error) return
    if (missingReviewEntry) {
      dropCurrent()
    }
  }, [currentId, dropCurrent, missingReviewEntry, vocabulary.error, vocabulary.loading])

  const { playAudio } = useReviewAudio({
    autoPlayText: item?.kana,
    autoPlayKey: item?.id,
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
      return srs.gradeExisting(item.id, result.correct ? "good" : "again")
    }, [item, srs]),
  })

  if (review.isComplete) {
    return (
      <ReviewDone
        title={review.isInvalidated ? "学习数据已更新，请重新开始复习" : "单词复习完成"}
        onExit={onExit}
        stats={review.isInvalidated ? undefined : review.completionStats}
      />
    )
  }

  if (vocabulary.loading) {
    return <ReviewLoadingState label="正在加载单词复习..." />
  }

  if (vocabulary.error) {
    return (
      <ReviewErrorState
        title="单词复习题库加载失败"
        message="请返回复习页后重新进入，或稍后再试。"
        onExit={onExit}
        onRetry={vocabulary.retry}
      />
    )
  }

  if (insufficientQuestionOptions) {
    return (
      <ReviewEmptyQuestionState
        title="当前单词复习题不足"
        message="这一轮单词复习暂时凑不出足够的唯一选项。返回复习页后稍后再试，或先增加词汇题库范围。"
        onExit={onExit}
        onRetry={vocabulary.retry}
      />
    )
  }

  if (!item || !question) {
    return null
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

      <ReviewPromptCard minHeightClassName="min-h-[240px]">
        <VocabReviewPrompt display={item.kanji ?? item.kana} kana={item.kana} onPlay={playAudio} />
      </ReviewPromptCard>

      <ReviewOptionGrid
        options={question.options}
        correctAnswer={question.correctAnswer}
        acceptedAnswers={question.acceptedAnswers}
        selectedAnswer={selected}
        onSelect={handleSelect}
      />

      <PracticeSaveError show={saveError} />

      <ReviewNextButton show={review.isAnswered} onNext={handleNext} />
    </ReviewSessionFrame>
  )
}
