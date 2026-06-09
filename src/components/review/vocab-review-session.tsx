"use client"

import { useCallback, useMemo, useState } from "react"
import { useReviewAnswerRecorder } from "@/components/review/use-review-answer-recorder"
import { ReviewOptionGrid } from "@/components/review/review-option-grid"
import { VocabReviewPrompt } from "@/components/review/review-prompt-content"
import { ReviewNextButton, ReviewPromptCard, ReviewSessionFrame } from "@/components/review/review-session-frame"
import { ReviewDone, ReviewLoadingState } from "@/components/review/review-status"
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

  const currentId = review.currentItem
  const item = useMemo(() => (currentId ? vocabulary.data.find((v) => v.id === currentId) ?? null : null), [currentId, vocabulary.data])
  const question = useMemo(() => (item ? makeVocabReviewQuestion(item.id, vocabulary.data) : null), [item, vocabulary.data])

  const { playAudio } = useReviewAudio({
    autoPlayText: item?.kana,
    autoPlayKey: item?.id,
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
        title="单词复习完成"
        onExit={onExit}
        stats={review.completionStats}
      />
    )
  }

  if (vocabulary.loading) {
    return <ReviewLoadingState label="正在加载单词复习..." />
  }

  if (!item || !question) {
    return <ReviewDone title="题库变更：当前条目或选项不足" onExit={onExit} />
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
        correctAnswer={item.id}
        selectedAnswer={selected}
        onSelect={handleSelect}
      />

      <PracticeSaveError show={saveError} />

      <ReviewNextButton show={review.isAnswered} onNext={handleNext} />
    </ReviewSessionFrame>
  )
}
