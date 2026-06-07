"use client"

import { useCallback, useMemo } from "react"
import { useReviewAnswerRecorder } from "@/components/review/use-review-answer-recorder"
import { ReviewOptionGrid } from "@/components/review/review-option-grid"
import { ReviewAnswerFeedback } from "@/components/review/review-answer-feedback"
import { MixedReviewPrompt } from "@/components/review/review-prompt-content"
import { ReviewNextButton, ReviewPromptCard, ReviewSessionFrame } from "@/components/review/review-session-frame"
import { ReviewDone, ReviewLoadingState } from "@/components/review/review-status"
import { useReviewSessionState } from "@/components/review/use-review-session-state"
import { useAllVocabulary } from "@/components/review/review-vocabulary"
import { useReviewAudio } from "@/components/review/use-review-audio"
import { kanaData } from "@/data/kana-data"
import type { useLearningProgress } from "@/lib/learning-progress"
import type { useMistakeNotebook } from "@/lib/mistake-notebook"
import type { Question, QuestionResult } from "@/lib/questions"
import type { useSrsDeck } from "@/lib/srs"
import {
  makeKanaReviewQuestion,
  makeVocabReviewQuestion,
  mistakeToQuestion,
  type TodayReviewItem,
} from "@/lib/review-questions"

type TodayReviewData = {
  deckLabel: string
  prompt: string
  sub?: string
  audio?: string
  question: Question
}

export function TodayReviewSession({
  items,
  onExit,
  notebook,
  learning,
  kanaSrs,
  vocabSrs,
  mistakeSrs,
}: {
  items: TodayReviewItem[]
  onExit: () => void
  notebook: ReturnType<typeof useMistakeNotebook>
  learning: ReturnType<typeof useLearningProgress>
  kanaSrs: ReturnType<typeof useSrsDeck>
  vocabSrs: ReturnType<typeof useSrsDeck>
  mistakeSrs: ReturnType<typeof useSrsDeck>
}) {
  const needsVocabulary = useMemo(() => items.some((item) => item.deck === "vocab"), [items])
  const vocabulary = useAllVocabulary(needsVocabulary)

  const review = useReviewSessionState(items)
  const current = review.currentItem
  const selected = review.selectedAnswer

  const data: TodayReviewData | null = useMemo(() => {
    if (!current) return null
    if (current.deck === "kana") {
      const item = kanaData.find((k) => k.romaji === current.id)
      if (!item) return null
      const question = makeKanaReviewQuestion(current.id)
      if (!question) return null
      return {
        deckLabel: "假名",
        prompt: item.hiragana,
        sub: item.katakana,
        audio: item.hiragana,
        question,
      }
    }
    if (current.deck === "vocab") {
      const item = vocabulary.data.find((v) => v.id === current.id)
      if (!item) return null
      const question = makeVocabReviewQuestion(current.id, vocabulary.data)
      if (!question) return null
      return {
        deckLabel: "词汇",
        prompt: item.kanji ?? item.kana,
        sub: item.kanji ? item.kana : undefined,
        audio: item.kana,
        question,
      }
    }

    const item = notebook.byId.get(current.id)
    if (!item) return null
    return {
      deckLabel: "错题",
      prompt: item.questionText ?? item.questionAudio ?? "（无题干）",
      sub: item.type,
      audio: item.questionAudio,
      question: mistakeToQuestion(item),
    }
  }, [current, notebook.byId, vocabulary.data])

  const { playAudio } = useReviewAudio({
    autoPlayText: data?.audio,
    autoPlayKey: current?.id,
    autoPlayDelayMs: 350,
  })

  const recordAnswerSelection = useReviewAnswerRecorder({
    progress: learning,
    notebook,
    recordAnswer: review.recordAnswer,
    grade: useCallback((result: QuestionResult) => {
      if (!current) return
      if (current.deck === "kana") kanaSrs.grade(current.id, result.correct ? "good" : "again")
      if (current.deck === "vocab") vocabSrs.grade(current.id, result.correct ? "good" : "again")
      if (current.deck === "mistakes") mistakeSrs.grade(current.id, result.correct ? "good" : "again")
    }, [current, kanaSrs, mistakeSrs, vocabSrs]),
  })

  if (review.isComplete) {
    return (
      <ReviewDone
        title="今日复习完成"
        onExit={onExit}
        stats={review.completionStats}
      />
    )
  }

  if (vocabulary.loading) {
    return <ReviewLoadingState label="正在加载今日复习题库..." />
  }

  if (!current || !data) {
    return <ReviewDone title="复习条目不存在（可能已移除）" onExit={onExit} />
  }

  const handleSelect = (value: string) => {
    recordAnswerSelection(data.question, value)
  }

  return (
    <ReviewSessionFrame
      onExit={onExit}
      headerRight={<div className="text-xs text-muted-foreground font-mono" data-testid="review-remaining">今日剩余: {review.remainingCount}</div>}
    >

      <div className="w-full rounded-xl border bg-muted/10 p-4 text-sm text-muted-foreground leading-relaxed">
        当前：<span className="font-semibold text-foreground">{data.deckLabel}</span> · 答错会排到本轮队尾，答对会进入下一次间隔复习。
      </div>

      <ReviewPromptCard minHeightClassName="min-h-[240px]">
        <MixedReviewPrompt prompt={data.prompt} sub={data.sub} audio={data.audio} onPlay={playAudio} />
      </ReviewPromptCard>

      <ReviewOptionGrid
        options={data.question.options}
        correctAnswer={data.question.correctAnswer}
        selectedAnswer={selected}
        onSelect={handleSelect}
      />

      <ReviewAnswerFeedback question={data.question} selectedAnswer={selected} />

      <ReviewNextButton show={review.isAnswered} onNext={review.advance} />
    </ReviewSessionFrame>
  )
}
