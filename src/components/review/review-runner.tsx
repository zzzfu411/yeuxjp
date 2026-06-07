"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ReviewOptionGrid } from "@/components/review/review-option-grid"
import { ReviewNextButton, ReviewPromptCard, ReviewSessionFrame } from "@/components/review/review-session-frame"
import { kanaData } from "@/data/kana-data"
import { loadVocabularyScope } from "@/data/vocabulary/loader"
import type { Vocabulary } from "@/data/vocabulary/types"
import { useMistakeNotebook, MISTAKE_SRS_STORAGE_KEY } from "@/lib/mistake-notebook"
import { useSrsDeck } from "@/lib/srs"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import { speakJapaneseRepeated } from "@/lib/speech"
import { useSpeechPreferences } from "@/components/ui/speech-preferences"
import { ConjugationComparison, ParticleFillFeedback, type ConjugationVerbMeta } from "@/components/quiz/feedback"
import { useLearningProgress } from "@/lib/learning-progress"
import { recordQuestionPractice } from "@/lib/learning-session"
import { makeQuestionResult, type Question } from "@/lib/questions"
import {
  advanceReviewQueue,
  createReviewStats,
  getReviewCompletionStats,
  recordReviewAnswer,
  type ReviewCompletionStats,
} from "@/lib/review-session"
import {
  makeKanaReviewQuestion,
  makeVocabReviewQuestion,
  mistakeToQuestion,
  shuffleList,
  type ReviewDeck,
  type TodayReviewItem,
} from "@/lib/review-questions"

const KANA_SRS_STORAGE_KEY = STORAGE_KEYS.SRS_KANA
const VOCAB_SRS_STORAGE_KEY = STORAGE_KEYS.SRS_VOCAB

export type ReviewSession =
  | { deck: ReviewDeck; ids: string[] }
  | { deck: "today"; items: TodayReviewItem[] }

function useAllVocabulary(enabled: boolean) {
  const [state, setState] = useState<{ data: Vocabulary[]; loaded: boolean; error: string | null }>({
    data: [],
    loaded: false,
    error: null,
  })

  useEffect(() => {
    if (!enabled) return

    let cancelled = false

    loadVocabularyScope("all")
      .then((data) => {
        if (cancelled) return
        setState({ data, loaded: true, error: null })
      })
      .catch((err) => {
        if (cancelled) return
        setState({ data: [], loaded: true, error: err instanceof Error ? err.message : String(err) })
      })

    return () => {
      cancelled = true
    }
  }, [enabled])

  return {
    data: enabled ? state.data : [],
    loading: enabled && !state.loaded && !state.error,
    error: enabled ? state.error : null,
  }
}

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
  const speech = useSpeechPreferences()
  const kanaSrs = useSrsDeck(KANA_SRS_STORAGE_KEY)
  const vocabSrs = useSrsDeck(VOCAB_SRS_STORAGE_KEY)
  const mistakeSrs = useSrsDeck(MISTAKE_SRS_STORAGE_KEY)
  const learning = useLearningProgress()
  const needsVocabulary = useMemo(() => items.some((item) => item.deck === "vocab"), [items])
  const vocabulary = useAllVocabulary(needsVocabulary)

  const [queue, setQueue] = useState<TodayReviewItem[]>(() => items)
  const [selected, setSelected] = useState<string | null>(null)
  const [lastOk, setLastOk] = useState<boolean | null>(null)
  const [initialCount] = useState(items.length)
  const [stats, setStats] = useState(createReviewStats)

  const current = queue[0] ?? null

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

  const playAudio = useCallback((text: string) => {
    const repeat = speech?.prefs.repeat ?? 1
    const gapMs = speech?.prefs.gapMs ?? 250
    speakJapaneseRepeated(text, { repeat, gapMs })
  }, [speech?.prefs.gapMs, speech?.prefs.repeat])

  useEffect(() => {
    if (!data?.audio) return
    const autoPlay = speech?.prefs.autoPlay ?? true
    if (!autoPlay) return
    const timer = setTimeout(() => playAudio(data.audio!), 350)
    return () => clearTimeout(timer)
  }, [data?.audio, playAudio, speech?.prefs.autoPlay])

  if (!queue.length) {
    return (
      <ReviewDone
        title="今日复习完成"
        onExit={onExit}
        stats={getReviewCompletionStats(initialCount, stats)}
      />
    )
  }

  if (vocabulary.loading) {
    return (
      <div className="container py-20 px-4 mx-auto max-w-lg flex flex-col items-center space-y-4">
        <div className="w-full max-w-[16rem] aspect-square rounded-2xl border-2 border-dashed border-muted-foreground/20 animate-pulse" />
        <div className="text-sm text-muted-foreground">{"\u6b63\u5728\u52a0\u8f7d\u4eca\u65e5\u590d\u4e60\u9898\u5e93..."}</div>
      </div>
    )
  }

  if (!current || !data) {
    return <ReviewDone title="复习条目不存在（可能已移除）" onExit={onExit} />
  }

  const grade = (id: string, ok: boolean) => {
    if (current.deck === "kana") kanaSrs.grade(id, ok ? "good" : "again")
    if (current.deck === "vocab") vocabSrs.grade(id, ok ? "good" : "again")
    if (current.deck === "mistakes") mistakeSrs.grade(id, ok ? "good" : "again")
  }

  const handleSelect = (value: string) => {
    if (selected) return
    const result = makeQuestionResult(data.question, value)
    const ok = result.correct
    setSelected(value)
    setLastOk(ok)
    grade(current.id, ok)
    recordQuestionPractice({ progress: learning, notebook, result })
    setStats((prev) => recordReviewAnswer(prev, ok))
  }

  const next = () => {
    setQueue((prev) => advanceReviewQueue(prev, lastOk))
    setSelected(null)
    setLastOk(null)
  }

  return (
    <ReviewSessionFrame
      onExit={onExit}
      headerRight={<div className="text-xs text-muted-foreground font-mono" data-testid="review-remaining">今日剩余: {queue.length}</div>}
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

      {selected && (
        <div className="w-full rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground leading-relaxed">
          正确答案：<span className="font-semibold text-foreground">{data.question.options.find((o) => o.value === data.question.correctAnswer)?.display ?? data.question.correctDisplay ?? data.question.correctAnswer}</span>
          {data.question.explanation ? <div className="mt-2">{data.question.explanation}</div> : null}
        </div>
      )}

      <ReviewNextButton show={selected != null} onNext={next} />
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
  const speech = useSpeechPreferences()
  const srs = useSrsDeck(KANA_SRS_STORAGE_KEY)
  const learning = useLearningProgress()
  const [queue, setQueue] = useState<string[]>(() => ids)
  const [selected, setSelected] = useState<string | null>(null)
  const [lastOk, setLastOk] = useState<boolean | null>(null)
  const [options, setOptions] = useState<string[]>(() => [])
  const [initialCount] = useState(ids.length)
  const [stats, setStats] = useState(createReviewStats)

  const currentId = queue[0] ?? null
  const item = useMemo(() => (currentId ? kanaData.find((k) => k.romaji === currentId) ?? null : null), [currentId])

  useEffect(() => {
    let cancelled = false

    Promise.resolve().then(() => {
      if (cancelled) return
      if (!item) {
        setOptions([])
        return
      }

      const wrongPool = kanaData.filter((k) => k.romaji !== item.romaji).map((k) => k.romaji)
      const wrong = shuffleList(wrongPool).slice(0, 3)
      setOptions(shuffleList([item.romaji, ...wrong]))
    })

    return () => {
      cancelled = true
    }
  }, [item])

  const playAudio = useCallback((text: string) => {
    const repeat = speech?.prefs.repeat ?? 1
    const gapMs = speech?.prefs.gapMs ?? 250
    speakJapaneseRepeated(text, { repeat, gapMs })
  }, [speech?.prefs.gapMs, speech?.prefs.repeat])

  useEffect(() => {
    if (!item) return
    const autoPlay = speech?.prefs.autoPlay ?? true
    if (!autoPlay) return
    const timer = setTimeout(() => playAudio(item.hiragana), 400)
    return () => clearTimeout(timer)
  }, [item, playAudio, speech?.prefs.autoPlay])

  if (!queue.length) {
    return (
      <ReviewDone
        title="假名复习完成"
        onExit={onExit}
        stats={getReviewCompletionStats(initialCount, stats)}
      />
    )
  }

  if (!item) {
    return (
      <ReviewDone title="题库变更：当前条目不存在" onExit={onExit} />
    )
  }

  const handleSelect = (val: string) => {
    if (selected) return
    setSelected(val)
    const question: Question = {
      type: "review:kana",
      itemId: item.romaji,
      itemType: "kana",
      mode: "recognition",
      questionText: item.hiragana,
      questionAudio: item.hiragana,
      correctAnswer: item.romaji,
      correctDisplay: item.romaji,
      options: options.map((option) => ({ value: option, display: option })),
    }
    const result = makeQuestionResult(question, val)
    const ok = result.correct
    setLastOk(ok)
    srs.grade(item.romaji, ok ? "good" : "again")
    recordQuestionPractice({ progress: learning, notebook, result })
    setStats((prev) => recordReviewAnswer(prev, ok))
  }

  const next = () => {
    if (!currentId) return
    setQueue((prev) => advanceReviewQueue(prev, lastOk))
    setSelected(null)
    setLastOk(null)
  }

  return (
    <ReviewSessionFrame
      onExit={onExit}
      headerRight={<div className="text-xs text-muted-foreground font-mono">剩余: {queue.length}</div>}
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
        options={options.map((opt) => ({ value: opt, display: opt }))}
        correctAnswer={item.romaji}
        selectedAnswer={selected}
        onSelect={handleSelect}
        optionClassName="h-16 text-lg font-medium"
      />

      <ReviewNextButton show={selected != null} onNext={next} />
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
  const speech = useSpeechPreferences()
  const srs = useSrsDeck(VOCAB_SRS_STORAGE_KEY)
  const learning = useLearningProgress()
  const vocabulary = useAllVocabulary(ids.length > 0)
  const [queue, setQueue] = useState<string[]>(() => ids)
  const [selected, setSelected] = useState<string | null>(null)
  const [lastOk, setLastOk] = useState<boolean | null>(null)
  const [options, setOptions] = useState<string[]>(() => [])
  const [initialCount] = useState(ids.length)
  const [stats, setStats] = useState(createReviewStats)

  const currentId = queue[0] ?? null
  const item = useMemo(() => (currentId ? vocabulary.data.find((v) => v.id === currentId) ?? null : null), [currentId, vocabulary.data])

  useEffect(() => {
    let cancelled = false

    Promise.resolve().then(() => {
      if (cancelled) return
      if (!item) {
        setOptions([])
        return
      }

      const wrongPool = vocabulary.data.filter((v) => v.id !== item.id).map((v) => v.id)
      const wrong = shuffleList(wrongPool).slice(0, 3)
      setOptions(shuffleList([item.id, ...wrong]))
    })

    return () => {
      cancelled = true
    }
  }, [item, vocabulary.data])

  const playAudio = useCallback((text: string) => {
    const repeat = speech?.prefs.repeat ?? 1
    const gapMs = speech?.prefs.gapMs ?? 250
    speakJapaneseRepeated(text, { repeat, gapMs })
  }, [speech?.prefs.gapMs, speech?.prefs.repeat])

  useEffect(() => {
    if (!item) return
    const autoPlay = speech?.prefs.autoPlay ?? true
    if (!autoPlay) return
    const timer = setTimeout(() => playAudio(item.kana), 400)
    return () => clearTimeout(timer)
  }, [item, playAudio, speech?.prefs.autoPlay])

  if (!queue.length) {
    return (
      <ReviewDone
        title="单词复习完成"
        onExit={onExit}
        stats={getReviewCompletionStats(initialCount, stats)}
      />
    )
  }

  if (vocabulary.loading) {
    return (
      <div className="container py-20 px-4 mx-auto max-w-lg flex flex-col items-center space-y-4">
        <div className="w-full max-w-[16rem] aspect-square rounded-2xl border-2 border-dashed border-muted-foreground/20 animate-pulse" />
        <div className="text-sm text-muted-foreground">{"\u6b63\u5728\u52a0\u8f7d\u5355\u8bcd\u590d\u4e60..."}</div>
      </div>
    )
  }

  if (!item) {
    return <ReviewDone title="题库变更：当前条目不存在" onExit={onExit} />
  }

  const handleSelect = (val: string) => {
    if (selected) return
    setSelected(val)
    const question: Question = {
      type: "review:vocab",
      itemId: item.id,
      itemType: "vocab",
      mode: "meaning",
      questionText: item.kanji ?? item.kana,
      questionAudio: item.kana,
      correctAnswer: item.id,
      correctDisplay: item.meaning,
      options: options.map((optionId) => {
        const option = vocabulary.data.find((v) => v.id === optionId)
        return { value: optionId, display: option?.meaning ?? optionId }
      }),
    }
    const result = makeQuestionResult(question, val)
    const ok = result.correct
    setLastOk(ok)
    srs.grade(item.id, ok ? "good" : "again")
    recordQuestionPractice({ progress: learning, notebook, result })
    setStats((prev) => recordReviewAnswer(prev, ok))
  }

  const next = () => {
    if (!currentId) return
    setQueue((prev) => advanceReviewQueue(prev, lastOk))
    setSelected(null)
    setLastOk(null)
  }

  return (
    <ReviewSessionFrame
      onExit={onExit}
      headerRight={<div className="text-xs text-muted-foreground font-mono">剩余: {queue.length}</div>}
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
        options={options.map((optId) => {
          const opt = vocabulary.data.find((v) => v.id === optId)
          return { value: optId, display: opt?.meaning ?? optId }
        })}
        correctAnswer={item.id}
        selectedAnswer={selected}
        onSelect={handleSelect}
      />

      <ReviewNextButton show={selected != null} onNext={next} />
    </ReviewSessionFrame>
  )
}

function isVerbKind(value: unknown): value is ConjugationVerbMeta["kind"] {
  return value === "ichidan" || value === "godan" || value === "suru" || value === "kuru"
}

function isVerbForm(value: unknown): value is "masu" | "nai" | "te" | "ta" {
  return value === "masu" || value === "nai" || value === "te" || value === "ta"
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
  const speech = useSpeechPreferences()
  const srs = useSrsDeck(MISTAKE_SRS_STORAGE_KEY)
  const learning = useLearningProgress()

  const [queue, setQueue] = useState<string[]>(() => ids)
  const [selected, setSelected] = useState<string | null>(null)
  const [lastOk, setLastOk] = useState<boolean | null>(null)
  const [initialCount] = useState(ids.length)
  const [stats, setStats] = useState(createReviewStats)

  const currentId = queue[0] ?? null
  const item = currentId ? notebook.byId.get(currentId) ?? null : null

  const playAudio = useCallback((text: string) => {
    const repeat = speech?.prefs.repeat ?? 1
    const gapMs = speech?.prefs.gapMs ?? 250
    speakJapaneseRepeated(text, { repeat, gapMs })
  }, [speech?.prefs.gapMs, speech?.prefs.repeat])

  useEffect(() => {
    if (!item?.questionAudio) return
    const autoPlay = speech?.prefs.autoPlay ?? true
    if (!autoPlay) return
    const timer = setTimeout(() => playAudio(item.questionAudio!), 400)
    return () => clearTimeout(timer)
  }, [currentId, item?.questionAudio, playAudio, speech?.prefs.autoPlay])

  if (!queue.length) {
    return (
      <ReviewDone
        title="错题复习完成"
        onExit={onExit}
        stats={getReviewCompletionStats(initialCount, stats)}
      />
    )
  }

  if (!item) {
    return <ReviewDone title="错题不存在（可能已移除）" onExit={onExit} />
  }

  const correct = item.correctAnswer
  const selectedDisplay = selected ? item.options.find((o) => o.value === selected)?.display ?? selected : null
  const correctDisplay = item.options.find((o) => o.value === correct)?.display ?? item.correctDisplay ?? correct

  const handleSelect = (val: string) => {
    if (selected) return
    setSelected(val)
    const result = makeQuestionResult(mistakeToQuestion(item), val)
    const ok = result.correct
    setLastOk(ok)
    srs.grade(item.id, ok ? "good" : "again")
    recordQuestionPractice({ progress: learning, notebook, result })
    setStats((prev) => recordReviewAnswer(prev, ok))
  }

  const next = () => {
    if (!currentId) return
    setQueue((prev) => advanceReviewQueue(prev, lastOk))
    setSelected(null)
    setLastOk(null)
  }

  const canShowConj =
    item.type === "verb-conjugation" &&
    item.meta?.verb &&
    isVerbKind(item.meta.verb.kind) &&
    item.meta.askedForm &&
    isVerbForm(item.meta.askedForm.id)

  return (
    <ReviewSessionFrame
      onExit={onExit}
      headerRight={
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground font-mono">剩余: {queue.length}</div>
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
        options={item.options}
        correctAnswer={correct}
        selectedAnswer={selected}
        onSelect={handleSelect}
      />

      {selected && item.type === "particle" && item.questionText && (
        <ParticleFillFeedback sentence={item.questionText} selected={selectedDisplay ?? selected} correct={correct} />
      )}

      {selected && canShowConj && (
        <ConjugationComparison
          verb={{ ...item.meta!.verb!, kind: item.meta!.verb!.kind as ConjugationVerbMeta["kind"] }}
          askedForm={{ id: item.meta!.askedForm!.id as "masu" | "nai" | "te" | "ta", label: item.meta!.askedForm!.label }}
          selected={selected}
          correct={correct}
        />
      )}

      {selected && (
        <div className="w-full rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground leading-relaxed">
          <div className="text-xs font-semibold text-foreground mb-1 tracking-wider">解析</div>
          <div className="space-y-2">
            <div className="text-sm">
              你的答案：<span className={cn("font-semibold", lastOk ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300")}>{selectedDisplay ?? selected}</span>
              <span className="text-muted-foreground"> · 正确：<span className="font-semibold text-foreground">{correctDisplay}</span></span>
            </div>
            {item.explanation ? <div>{item.explanation}</div> : null}
          </div>
        </div>
      )}

      <ReviewNextButton show={selected != null} onNext={next} />
    </ReviewSessionFrame>
  )
}

function ReviewDone({
  title,
  onExit,
  stats,
}: {
  title: string
  onExit: () => void
  stats?: ReviewCompletionStats
}) {
  const accuracy = stats?.answered ? Math.round((stats.correct / stats.answered) * 100) : null

  return (
    <div className="container py-16 px-4 mx-auto max-w-lg flex flex-col items-center space-y-6">
      <div className="relative w-56 h-44 sm:w-72 sm:h-56">
        <Image
          src="/assets/states/state-complete.webp"
          alt=""
          fill
          sizes="(max-width: 640px) 224px, 288px"
          className="object-contain"
          priority
        />
      </div>
      <div className="text-center space-y-2">
        <div className="text-2xl font-bold">{title}</div>
        <div className="text-sm text-muted-foreground">
          {stats
            ? `本轮 ${stats.answered}/${stats.initial} 题已处理，正确率 ${accuracy ?? 0}%，重排 ${stats.repeated} 项。`
            : "今天的任务完成啦。也可以去技能树继续推进。"}
        </div>
        {stats ? (
          <div className="text-xs text-muted-foreground">
            {stats.repeated > 0 ? "建议稍后再回到复习页处理重排内容。" : "状态很好，可以继续下一课或做一轮轻量测验。"}
          </div>
        ) : null}
      </div>
      <div className="flex gap-2">
        <Button onClick={onExit} className="rounded-full">返回</Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/path">打开技能树</Link>
        </Button>
      </div>
    </div>
  )
}
