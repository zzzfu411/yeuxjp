"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useReviewAnswerRecorder } from "@/components/review/use-review-answer-recorder"
import { ReviewOptionGrid } from "@/components/review/review-option-grid"
import { ReviewTypedAnswer } from "@/components/review/review-typed-answer"
import { ReviewAnswerFeedback } from "@/components/review/review-answer-feedback"
import { MixedReviewPrompt } from "@/components/review/review-prompt-content"
import { ReviewNextButton, ReviewPromptCard, ReviewSessionFrame } from "@/components/review/review-session-frame"
import { ReviewDone, ReviewEmptyQuestionState, ReviewErrorState, ReviewLoadingState } from "@/components/review/review-status"
import { useReviewSessionState } from "@/components/review/use-review-session-state"
import { useVocabularyReviewPool } from "@/components/review/review-vocabulary"
import { useReviewAudio } from "@/components/review/use-review-audio"
import { PracticeSaveError } from "@/components/practice/practice-save-error"
import { useLearningProfile, type useLearningProgress } from "@/lib/learning-progress"
import { defaultShowStudyRomaji } from "@/lib/romaji-visibility"
import type { useMistakeNotebook } from "@/lib/mistake-notebook"
import type { QuestionResult } from "@/lib/questions"
import type { useSrsDeck } from "@/lib/srs"
import { questionUsesTypedReview, shouldShowReviewSpecialFeedback, type TodayReviewItem } from "@/lib/review-questions"
import {
  canRecordTodayReviewItem,
  getTodayReviewBatchCompletionTitle,
  getTodayReviewItemKey,
  gradeTodayReviewItem,
  resolveTodayReviewItemData,
} from "@/lib/today-review-session"

export function TodayReviewSession({
  items,
  remainingDueAfterBatch,
  onExit,
  notebook,
  learning,
  kanaSrs,
  vocabSrs,
  mistakeSrs,
}: {
  items: TodayReviewItem[]
  remainingDueAfterBatch: number
  onExit: () => void
  notebook: ReturnType<typeof useMistakeNotebook>
  learning: ReturnType<typeof useLearningProgress>
  kanaSrs: ReturnType<typeof useSrsDeck>
  vocabSrs: ReturnType<typeof useSrsDeck>
  mistakeSrs: ReturnType<typeof useSrsDeck>
}) {
  const vocabIds = useMemo(() => items.filter((item) => item.deck === "vocab").map((item) => item.id), [items])
  const vocabulary = useVocabularyReviewPool(vocabIds, vocabIds.length > 0)
  const { profile } = useLearningProfile()
  const showRomaji = defaultShowStudyRomaji(profile?.romajiMode)

  const [saveErrorKey, setSaveErrorKey] = useState<string | null>(null)
  // One random seed per session: item randomness (direction, distractors) must
  // stay stable when the resolve memo recomputes after an answer mutates the
  // mistake notebook or vocabulary pool references.
  const [reviewSeed] = useState(() => `today-${Math.random().toString(36).slice(2)}`)
  const review = useReviewSessionState(items)
  const current = review.currentItem
  const selected = review.selectedAnswer
  const { dropCurrent } = review
  const currentKey = getTodayReviewItemKey(current)
  const saveError = !!currentKey && saveErrorKey === currentKey
  const { data, missingReviewEntry, insufficientQuestionOptions } = useMemo(() => {
    return resolveTodayReviewItemData({
      current,
      vocabulary: vocabulary.data,
      mistakes: notebook.byId,
      seed: reviewSeed,
      showRomaji,
    })
  }, [current, notebook.byId, reviewSeed, showRomaji, vocabulary.data])

  useEffect(() => {
    if (!current) return
    if (current.deck === "vocab" && (vocabulary.loading || vocabulary.error)) return
    if (missingReviewEntry) {
      dropCurrent()
    }
  }, [current, dropCurrent, missingReviewEntry, vocabulary.error, vocabulary.loading])

  const { playAudio } = useReviewAudio({
    autoPlayText: data?.autoPlayAudio ? data.audio : undefined,
    autoPlayKey: review.presentationVersion,
    autoPlayDelayMs: 350,
  })

  const recordAnswerSelection = useReviewAnswerRecorder({
    progress: learning,
    notebook,
    recordAnswer: review.recordAnswer,
    canRecord: useCallback(() => {
      return canRecordTodayReviewItem(current, { kana: kanaSrs, vocab: vocabSrs, mistakes: mistakeSrs })
    }, [current, kanaSrs, mistakeSrs, vocabSrs]),
    grade: useCallback((result: QuestionResult) => {
      return gradeTodayReviewItem(current, result, { kana: kanaSrs, vocab: vocabSrs, mistakes: mistakeSrs })
    }, [current, kanaSrs, mistakeSrs, vocabSrs]),
  })

  if (review.isComplete) {
    return (
      <ReviewDone
        title={review.isInvalidated
          ? "学习数据已更新，请重新开始复习"
          : getTodayReviewBatchCompletionTitle(remainingDueAfterBatch)}
        onExit={onExit}
        stats={review.isInvalidated ? undefined : review.completionStats}
      />
    )
  }

  if (vocabulary.loading) {
    return <ReviewLoadingState label="正在加载今日复习题库..." />
  }

  if (vocabulary.error) {
    return (
      <ReviewErrorState
        title="今日复习题库加载失败"
        message="部分词汇复习资源没有加载成功。请返回复习页后重新进入，或稍后再试。"
        onExit={onExit}
        onRetry={vocabulary.retry}
      />
    )
  }

  if (insufficientQuestionOptions) {
    return (
      <ReviewEmptyQuestionState
        title={current?.deck === "kana" ? "当前假名复习题不足" : "当前单词复习题不足"}
        message={
          current?.deck === "kana"
            ? "当前范围内的假名太少，暂时无法组成一组题。请返回复习页稍后再试，或先继续课程和测验。"
            : "当前范围内的单词太少，暂时无法组成一组题。请返回复习页稍后再试，或先学习更多单词。"
        }
        onExit={onExit}
        onRetry={current?.deck === "vocab" ? vocabulary.retry : undefined}
      />
    )
  }

  if (!current || !data) {
    return null
  }

  const handleSelect = async (value: string) => {
    const recorded = await recordAnswerSelection(data.question, value)
    setSaveErrorKey(recorded ? null : currentKey)
  }

  const handleNext = () => {
    setSaveErrorKey(null)
    review.advance()
  }

  return (
    <ReviewSessionFrame
      onExit={onExit}
      headerRight={<div className="font-scribble text-sm text-muted-foreground" data-testid="review-remaining">今日剩余: {review.remainingCount}</div>}
    >

      <div className="w-full border-y border-dashed border-border/60 bg-primary/5 p-4 text-sm leading-relaxed text-muted-foreground">
        当前：<span className="font-semibold text-foreground">{data.deckLabel}</span> · 答错后会在本轮再次出现；答对后，系统会安排下次复习。
      </div>

      <ReviewPromptCard minHeightClassName="min-h-[240px]">
        <MixedReviewPrompt prompt={data.prompt} sub={data.sub} hint={data.hint} audio={data.audio} onPlay={playAudio} />
      </ReviewPromptCard>

      {questionUsesTypedReview(data.question) ? (
        <ReviewTypedAnswer
          key={`${currentKey}:${review.completionStats.answered}`}
          disabled={Boolean(selected)}
          onSubmit={handleSelect}
        />
      ) : (
        <ReviewOptionGrid
          options={data.question.options}
          correctAnswer={data.question.correctAnswer}
          acceptedAnswers={data.question.acceptedAnswers}
          selectedAnswer={selected}
          onSelect={handleSelect}
        />
      )}

      <ReviewAnswerFeedback
        question={data.question}
        selectedAnswer={selected}
        correct={review.lastAnswerCorrect}
        showSelectedAnswer
        showSpecialFeedback={shouldShowReviewSpecialFeedback(data.question.type)}
      />

      <PracticeSaveError show={saveError} />

      <ReviewNextButton show={review.isAnswered} onNext={handleNext} />
    </ReviewSessionFrame>
  )
}
