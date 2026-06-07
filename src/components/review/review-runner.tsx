"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useReviewAnswerRecorder } from "@/components/review/use-review-answer-recorder"
import { ReviewOptionGrid } from "@/components/review/review-option-grid"
import { ReviewAnswerFeedback } from "@/components/review/review-answer-feedback"
import { ReviewNextButton, ReviewPromptCard, ReviewSessionFrame } from "@/components/review/review-session-frame"
import { ReviewDone, ReviewLoadingState } from "@/components/review/review-status"
import { useReviewSessionState } from "@/components/review/use-review-session-state"
import { useAllVocabulary } from "@/components/review/review-vocabulary"
import { useReviewAudio } from "@/components/review/use-review-audio"
import { kanaData } from "@/data/kana-data"
import { useMistakeNotebook, MISTAKE_SRS_STORAGE_KEY } from "@/lib/mistake-notebook"
import { useSrsDeck } from "@/lib/srs"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import { useLearningProgress } from "@/lib/learning-progress"
import type { Question, QuestionResult } from "@/lib/questions"
import {
  makeKanaReviewQuestion,
  makeVocabReviewQuestion,
  mistakeToQuestion,
  type ReviewDeck,
  type TodayReviewItem,
} from "@/lib/review-questions"

const KANA_SRS_STORAGE_KEY = STORAGE_KEYS.SRS_KANA
const VOCAB_SRS_STORAGE_KEY = STORAGE_KEYS.SRS_VOCAB

export type ReviewSession =
  | { deck: ReviewDeck; ids: string[] }
  | { deck: "today"; items: TodayReviewItem[] }

export function ReviewRunner({
  session,
  onExit,
  notebook,
}: {
  session: ReviewSession
  onExit: () => void
  notebook: ReturnType<typeof useMistakeNotebook>
}) {
  if (session.deck === "today") return <TodayReview items={session.items} onExit={onExit} notebook={notebook} />
  if (session.deck === "kana") return <KanaReview ids={session.ids} onExit={onExit} notebook={notebook} />
  if (session.deck === "vocab") return <VocabReview ids={session.ids} onExit={onExit} notebook={notebook} />
  return <MistakeReview ids={session.ids} onExit={onExit} notebook={notebook} />
}

function TodayReview({
  items,
  onExit,
  notebook,
}: {
  items: TodayReviewItem[]
  onExit: () => void
  notebook: ReturnType<typeof useMistakeNotebook>
}) {
  const kanaSrs = useSrsDeck(KANA_SRS_STORAGE_KEY)
  const vocabSrs = useSrsDeck(VOCAB_SRS_STORAGE_KEY)
  const mistakeSrs = useSrsDeck(MISTAKE_SRS_STORAGE_KEY)
  const learning = useLearningProgress()
  const needsVocabulary = useMemo(() => items.some((item) => item.deck === "vocab"), [items])
  const vocabulary = useAllVocabulary(needsVocabulary)

  const review = useReviewSessionState(items)
  const current = review.currentItem
  const selected = review.selectedAnswer

  const data = useMemo(() => {
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
        {data.audio ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="w-20 h-20 rounded-full border-4"
            onClick={() => data.audio && playAudio(data.audio)}
          >
            <Volume2 className="w-8 h-8" />
          </Button>
        ) : null}
        <div className="mt-6 text-center space-y-2 px-6">
          <div className="text-4xl font-bold leading-snug break-words">{data.prompt}</div>
          {data.sub ? <div className="text-sm text-muted-foreground">{data.sub}</div> : null}
        </div>
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

function KanaReview({
  ids,
  onExit,
  notebook,
}: {
  ids: string[]
  onExit: () => void
  notebook: ReturnType<typeof useMistakeNotebook>
}) {
  const srs = useSrsDeck(KANA_SRS_STORAGE_KEY)
  const learning = useLearningProgress()
  const [question, setQuestion] = useState<Question | null>(null)
  const review = useReviewSessionState(ids)
  const selected = review.selectedAnswer

  const currentId = review.currentItem
  const item = useMemo(() => (currentId ? kanaData.find((k) => k.romaji === currentId) ?? null : null), [currentId])

  useEffect(() => {
    let cancelled = false

    Promise.resolve().then(() => {
      if (cancelled) return
      if (!item) {
        setQuestion(null)
        return
      }

      setQuestion(makeKanaReviewQuestion(item.romaji))
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
    grade: useCallback((result: QuestionResult) => {
      if (!item) return
      srs.grade(item.romaji, result.correct ? "good" : "again")
    }, [item, srs]),
  })

  if (review.isComplete) {
    return (
      <ReviewDone
        title="假名复习完成"
        onExit={onExit}
        stats={review.completionStats}
      />
    )
  }

  if (!item) {
    return (
      <ReviewDone title="题库变更：当前条目不存在" onExit={onExit} />
    )
  }

  const handleSelect = (val: string) => {
    if (!question) return
    recordAnswerSelection(question, val)
  }

  return (
    <ReviewSessionFrame
      onExit={onExit}
      headerRight={<div className="text-xs text-muted-foreground font-mono">剩余: {review.remainingCount}</div>}
    >

      <ReviewPromptCard>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="w-20 h-20 rounded-full border-4"
          onClick={() => playAudio(item.hiragana)}
        >
          <Volume2 className="w-8 h-8" />
        </Button>

        <div className="mt-6 text-center">
          <div className="text-7xl font-bold leading-none">{item.hiragana}</div>
          <div className="mt-2 text-xl text-muted-foreground">{item.katakana}</div>
          <div className="mt-3 text-xs text-muted-foreground">选择正确的罗马音</div>
        </div>
      </ReviewPromptCard>

      <ReviewOptionGrid
        options={question?.options ?? []}
        correctAnswer={item.romaji}
        selectedAnswer={selected}
        onSelect={handleSelect}
        optionClassName="h-16 text-lg font-medium"
      />

      <ReviewNextButton show={review.isAnswered} onNext={review.advance} />
    </ReviewSessionFrame>
  )
}

function VocabReview({
  ids,
  onExit,
  notebook,
}: {
  ids: string[]
  onExit: () => void
  notebook: ReturnType<typeof useMistakeNotebook>
}) {
  const srs = useSrsDeck(VOCAB_SRS_STORAGE_KEY)
  const learning = useLearningProgress()
  const vocabulary = useAllVocabulary(ids.length > 0)
  const [question, setQuestion] = useState<Question | null>(null)
  const review = useReviewSessionState(ids)
  const selected = review.selectedAnswer

  const currentId = review.currentItem
  const item = useMemo(() => (currentId ? vocabulary.data.find((v) => v.id === currentId) ?? null : null), [currentId, vocabulary.data])

  useEffect(() => {
    let cancelled = false

    Promise.resolve().then(() => {
      if (cancelled) return
      if (!item) {
        setQuestion(null)
        return
      }

      setQuestion(makeVocabReviewQuestion(item.id, vocabulary.data))
    })

    return () => {
      cancelled = true
    }
  }, [item, vocabulary.data])

  const { playAudio } = useReviewAudio({
    autoPlayText: item?.kana,
    autoPlayKey: item?.id,
  })

  const recordAnswerSelection = useReviewAnswerRecorder({
    progress: learning,
    notebook,
    recordAnswer: review.recordAnswer,
    grade: useCallback((result: QuestionResult) => {
      if (!item) return
      srs.grade(item.id, result.correct ? "good" : "again")
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

  if (!item) {
    return <ReviewDone title="题库变更：当前条目不存在" onExit={onExit} />
  }

  const handleSelect = (val: string) => {
    if (!question) return
    recordAnswerSelection(question, val)
  }

  return (
    <ReviewSessionFrame
      onExit={onExit}
      headerRight={<div className="text-xs text-muted-foreground font-mono">剩余: {review.remainingCount}</div>}
    >

      <ReviewPromptCard minHeightClassName="min-h-[240px]">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="w-20 h-20 rounded-full border-4"
          onClick={() => playAudio(item.kana)}
        >
          <Volume2 className="w-8 h-8" />
        </Button>

        <div className="mt-6 text-center space-y-2">
          <div className="text-6xl font-bold leading-none">{item.kanji ?? item.kana}</div>
          {item.kanji ? <div className="text-xl text-muted-foreground">{item.kana}</div> : null}
          <div className="text-xs text-muted-foreground">选择正确的中文意思</div>
        </div>
      </ReviewPromptCard>

      <ReviewOptionGrid
        options={question?.options ?? []}
        correctAnswer={item.id}
        selectedAnswer={selected}
        onSelect={handleSelect}
      />

      <ReviewNextButton show={review.isAnswered} onNext={review.advance} />
    </ReviewSessionFrame>
  )
}

function MistakeReview({
  ids,
  onExit,
  notebook,
}: {
  ids: string[]
  onExit: () => void
  notebook: ReturnType<typeof useMistakeNotebook>
}) {
  const srs = useSrsDeck(MISTAKE_SRS_STORAGE_KEY)
  const learning = useLearningProgress()

  const review = useReviewSessionState(ids)
  const selected = review.selectedAnswer
  const lastOk = review.lastAnswerCorrect

  const currentId = review.currentItem
  const item = currentId ? notebook.byId.get(currentId) ?? null : null

  const { playAudio } = useReviewAudio({
    autoPlayText: item?.questionAudio,
    autoPlayKey: currentId,
  })

  const recordAnswerSelection = useReviewAnswerRecorder({
    progress: learning,
    notebook,
    recordAnswer: review.recordAnswer,
    grade: useCallback((result: QuestionResult) => {
      if (!item) return
      srs.grade(item.id, result.correct ? "good" : "again")
    }, [item, srs]),
  })

  if (review.isComplete) {
    return (
      <ReviewDone
        title="错题复习完成"
        onExit={onExit}
        stats={review.completionStats}
      />
    )
  }

  if (!item) {
    return <ReviewDone title="错题不存在（可能已移除）" onExit={onExit} />
  }

  const question = mistakeToQuestion(item)
  const correct = question.correctAnswer

  const handleSelect = (val: string) => {
    recordAnswerSelection(question, val)
  }

  return (
    <ReviewSessionFrame
      onExit={onExit}
      headerRight={
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground font-mono">剩余: {review.remainingCount}</div>
          <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={() => notebook.remove(item.id)}>
            移除
          </Button>
        </div>
      }
    >

      <ReviewPromptCard>
        {item.questionAudio ? (
          <>
            <Button type="button" variant="outline" size="icon" className="w-20 h-20 rounded-full border-4" onClick={() => playAudio(item.questionAudio!)}>
              <Volume2 className="w-8 h-8" />
            </Button>
            {item.questionText ? (
              <div className="mt-5 text-center px-6 text-sm text-muted-foreground leading-relaxed">{item.questionText}</div>
            ) : null}
          </>
        ) : (
          <div className="text-center space-y-3 px-6">
            <div className="text-3xl font-bold leading-snug break-words">{item.questionText ?? "（无题干）"}</div>
            <div className="text-xs text-muted-foreground">{item.type}</div>
          </div>
        )}
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

      <ReviewNextButton show={review.isAnswered} onNext={review.advance} />
    </ReviewSessionFrame>
  )
}
